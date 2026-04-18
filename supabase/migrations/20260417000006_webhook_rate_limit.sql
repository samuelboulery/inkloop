-- Rate limit des appels webhook (n8n) par workspace.
-- Chaque publication de campagne enregistre une entrée ; la fonction atomique
-- `check_and_record_webhook_rate_limit` nettoie la fenêtre glissante, compte,
-- et autorise ou refuse l'appel en une seule transaction.

CREATE TABLE webhook_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_rate_limits_workspace_created
  ON webhook_rate_limits(workspace_id, created_at DESC);

COMMENT ON TABLE webhook_rate_limits IS
  'Fenêtre glissante des appels webhook par workspace. Les anciennes lignes sont purgées opportunément par check_and_record_webhook_rate_limit.';

-- RLS : les Server Actions passent par la fonction SECURITY DEFINER,
-- mais on laisse un SELECT pour que les utilisateurs puissent lire leur propre historique.
ALTER TABLE webhook_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY webhook_rate_limits_select ON webhook_rate_limits
  FOR SELECT USING (
    is_workspace_member(workspace_id) OR
    EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid())
  );

-- Fonction atomique : nettoie la fenêtre, compte, insère si autorisé.
-- SECURITY DEFINER pour contourner la RLS côté écriture, mais vérifie l'appartenance manuellement.
CREATE OR REPLACE FUNCTION check_and_record_webhook_rate_limit(
  p_workspace_id UUID,
  p_window_seconds INT DEFAULT 60,
  p_max_requests INT DEFAULT 10
)
RETURNS TABLE(allowed BOOLEAN, current_count INT, retry_after_seconds INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
  v_oldest TIMESTAMPTZ;
  v_cutoff TIMESTAMPTZ;
BEGIN
  IF NOT (
    is_workspace_member(p_workspace_id, 'Editor') OR
    EXISTS (SELECT 1 FROM workspaces WHERE id = p_workspace_id AND owner_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Accès refusé au workspace %', p_workspace_id USING ERRCODE = '42501';
  END IF;

  v_cutoff := NOW() - make_interval(secs => p_window_seconds);

  -- Nettoyage opportuniste des entrées hors fenêtre.
  DELETE FROM webhook_rate_limits
  WHERE workspace_id = p_workspace_id
    AND created_at < v_cutoff;

  SELECT COUNT(*), MIN(created_at)
  INTO v_count, v_oldest
  FROM webhook_rate_limits
  WHERE workspace_id = p_workspace_id;

  IF v_count >= p_max_requests THEN
    RETURN QUERY SELECT
      FALSE,
      v_count,
      GREATEST(1, p_window_seconds - EXTRACT(EPOCH FROM (NOW() - v_oldest))::INT);
    RETURN;
  END IF;

  INSERT INTO webhook_rate_limits (workspace_id) VALUES (p_workspace_id);

  RETURN QUERY SELECT TRUE, v_count + 1, 0;
END;
$$;

COMMENT ON FUNCTION check_and_record_webhook_rate_limit IS
  'Rate limit atomique par workspace sur fenêtre glissante. Retourne (allowed, current_count, retry_after_seconds).';
