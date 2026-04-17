-- Fonction helper : vérifie si l'utilisateur est membre du workspace
CREATE OR REPLACE FUNCTION is_workspace_member(wid UUID, min_role TEXT DEFAULT 'Viewer')
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = wid
      AND user_id = auth.uid()
      AND CASE min_role
            WHEN 'Owner'  THEN role = 'Owner'
            WHEN 'Editor' THEN role IN ('Owner', 'Editor')
            ELSE role IN ('Owner', 'Editor', 'Viewer')
          END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── workspaces ──────────────────────────────────────────────────────────────
CREATE POLICY workspaces_select ON workspaces
  FOR SELECT USING (owner_id = auth.uid() OR is_workspace_member(id));

CREATE POLICY workspaces_insert ON workspaces
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY workspaces_update ON workspaces
  FOR UPDATE USING (owner_id = auth.uid() OR is_workspace_member(id, 'Editor'));

CREATE POLICY workspaces_delete ON workspaces
  FOR DELETE USING (owner_id = auth.uid());

-- ─── workspace_members ───────────────────────────────────────────────────────
CREATE POLICY members_select ON workspace_members
  FOR SELECT USING (user_id = auth.uid() OR is_workspace_member(workspace_id));

CREATE POLICY members_insert ON workspace_members
  FOR INSERT WITH CHECK (
    -- Seul l'owner ou un Editor peut inviter
    EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid())
    OR is_workspace_member(workspace_id, 'Editor')
  );

CREATE POLICY members_delete ON workspace_members
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid())
  );

-- ─── templates ───────────────────────────────────────────────────────────────
CREATE POLICY templates_select ON templates
  FOR SELECT USING (is_workspace_member(workspace_id) OR
    EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid()));

CREATE POLICY templates_insert ON templates
  FOR INSERT WITH CHECK (
    is_workspace_member(workspace_id, 'Editor') OR
    EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid())
  );

CREATE POLICY templates_update ON templates
  FOR UPDATE USING (
    is_workspace_member(workspace_id, 'Editor') OR
    EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid())
  );

CREATE POLICY templates_delete ON templates
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid())
  );

-- ─── campaigns ───────────────────────────────────────────────────────────────
CREATE POLICY campaigns_select ON campaigns
  FOR SELECT USING (is_workspace_member(workspace_id) OR
    EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid()));

CREATE POLICY campaigns_insert ON campaigns
  FOR INSERT WITH CHECK (
    is_workspace_member(workspace_id, 'Editor') OR
    EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid())
  );

CREATE POLICY campaigns_update ON campaigns
  FOR UPDATE USING (
    is_workspace_member(workspace_id, 'Editor') OR
    EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid())
  );

CREATE POLICY campaigns_delete ON campaigns
  FOR DELETE USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid())
  );

-- ─── editorial_charters ──────────────────────────────────────────────────────
CREATE POLICY charters_select ON editorial_charters
  FOR SELECT USING (is_workspace_member(workspace_id) OR
    EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid()));

CREATE POLICY charters_insert ON editorial_charters
  FOR INSERT WITH CHECK (
    is_workspace_member(workspace_id, 'Editor') OR
    EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid())
  );

CREATE POLICY charters_update ON editorial_charters
  FOR UPDATE USING (
    is_workspace_member(workspace_id, 'Editor') OR
    EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid())
  );

-- ─── ai_logs ─────────────────────────────────────────────────────────────────
CREATE POLICY ai_logs_select ON ai_logs
  FOR SELECT USING (is_workspace_member(workspace_id) OR
    EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid()));

-- Insertion réservée aux server actions (service role ou RLS contournée côté serveur)
CREATE POLICY ai_logs_insert ON ai_logs
  FOR INSERT WITH CHECK (
    is_workspace_member(workspace_id, 'Editor') OR
    EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid())
  );

-- ─── publishing_events ───────────────────────────────────────────────────────
CREATE POLICY publishing_select ON publishing_events
  FOR SELECT USING (is_workspace_member(workspace_id) OR
    EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid()));

CREATE POLICY publishing_insert ON publishing_events
  FOR INSERT WITH CHECK (
    is_workspace_member(workspace_id, 'Editor') OR
    EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid())
  );
