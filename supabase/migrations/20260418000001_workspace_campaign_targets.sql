-- Ajoute une liste de cibles de campagne configurables par workspace
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS campaign_targets jsonb NOT NULL DEFAULT '[]'::jsonb;
