-- Policy UPDATE manquante sur publishing_events
-- Les Server Actions (session utilisateur) doivent pouvoir mettre à jour
-- les statuts de réponse et l'horodatage de planification.

CREATE POLICY publishing_update ON publishing_events
  FOR UPDATE USING (
    is_workspace_member(workspace_id, 'Editor') OR
    EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid())
  );
