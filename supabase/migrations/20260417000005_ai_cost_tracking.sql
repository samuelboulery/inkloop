-- Tracking coût IA par appel (input/output séparés)
-- Chaque appel au wrapper src/lib/ai enregistre désormais les tokens d'entrée et de sortie
-- ainsi que le coût estimé, calculé à partir du pricing par modèle.

ALTER TABLE ai_logs
  ADD COLUMN input_tokens INT,
  ADD COLUMN output_tokens INT,
  ADD COLUMN input_cost_usd NUMERIC(12, 8),
  ADD COLUMN output_cost_usd NUMERIC(12, 8);

COMMENT ON COLUMN ai_logs.input_cost_usd IS 'Coût USD pour tokens d''entrée, calculé à la volée depuis ai_pricing';
COMMENT ON COLUMN ai_logs.output_cost_usd IS 'Coût USD pour tokens de sortie, calculé à la volée depuis ai_pricing';

-- Index pour reporting coût par workspace / période
CREATE INDEX idx_ai_logs_workspace_cost
  ON ai_logs(workspace_id, created_at DESC)
  WHERE input_cost_usd IS NOT NULL OR output_cost_usd IS NOT NULL;

-- Table de référence : tarifs par modèle (USD par million de tokens)
CREATE TABLE ai_pricing (
  model_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('anthropic', 'openai', 'ollama')),
  input_cost_per_1m NUMERIC(10, 4) NOT NULL CHECK (input_cost_per_1m >= 0),
  output_cost_per_1m NUMERIC(10, 4) NOT NULL CHECK (output_cost_per_1m >= 0),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ai_pricing IS 'Tarifs par modèle IA, exprimés en USD par million de tokens';

-- RLS : table publique en lecture (le pricing n'est pas sensible),
-- écritures réservées au service_role (seeds + mises à jour manuelles).
ALTER TABLE ai_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_pricing_read_all ON ai_pricing
  FOR SELECT USING (true);

-- Seed initial (tarifs 2026-04, à mettre à jour via migrations ultérieures).
INSERT INTO ai_pricing (model_id, provider, input_cost_per_1m, output_cost_per_1m) VALUES
  ('claude-opus-4-7', 'anthropic', 15.0000, 75.0000),
  ('claude-sonnet-4-6', 'anthropic', 3.0000, 15.0000),
  ('claude-haiku-4-5-20251001', 'anthropic', 0.8000, 4.0000),
  ('claude-haiku-4-5', 'anthropic', 0.8000, 4.0000),
  ('gpt-4o', 'openai', 2.5000, 10.0000),
  ('gpt-4o-mini', 'openai', 0.1500, 0.6000),
  ('llama3.2', 'ollama', 0.0000, 0.0000);
