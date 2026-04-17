-- Espaces de travail (racine multi-tenant)
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  type TEXT CHECK (type IN ('Association', 'Personal')) NOT NULL DEFAULT 'Personal',
  default_llm_model TEXT NOT NULL DEFAULT 'gpt-4o',
  system_prompt_global TEXT,
  social_networks JSONB NOT NULL DEFAULT '{}',
  platform_specific_prompts JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);

-- Membres d'un workspace (support équipe)
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('Owner', 'Editor', 'Viewer')) NOT NULL DEFAULT 'Editor',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, user_id)
);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);

-- Templates (définit les champs d'une campagne)
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  -- [{ "name": "topic", "label": "Sujet", "type": "text", "required": true }]
  fields JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX idx_templates_workspace ON templates(workspace_id);

-- Campagnes (unité de contenu multi-plateformes)
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES templates(id),
  name TEXT NOT NULL,
  status TEXT CHECK (status IN ('Draft', 'InProgress', 'Ready', 'Sent')) NOT NULL DEFAULT 'Draft',

  -- Étape 1 : données brutes saisies par l'utilisateur
  raw_data JSONB NOT NULL DEFAULT '{}',

  -- Étape 2 : questions/réponses de clarification IA
  -- [{ "question": "...", "answer": "...", "category": "tone|structure|audience" }]
  ai_clarification_questions JSONB NOT NULL DEFAULT '[]',

  -- Étape 3 : squelette éditorial proposé par l'IA
  -- { "angle": "...", "key_messages": [...], "content_type": "..." }
  editorial_skeleton JSONB,
  skeleton_approved_by_user BOOLEAN NOT NULL DEFAULT FALSE,

  -- Étape 4 : contenu généré par plateforme
  -- { "LinkedIn": { "caption": "...", "hashtags": [...] }, "Instagram": {...} }
  generated_content JSONB NOT NULL DEFAULT '{}',

  -- Étape 5 : éditions manuelles finales
  final_edits JSONB NOT NULL DEFAULT '{}',
  sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX idx_campaigns_workspace ON campaigns(workspace_id);
CREATE INDEX idx_campaigns_status ON campaigns(workspace_id, status);
CREATE INDEX idx_campaigns_created ON campaigns(workspace_id, created_at DESC);

-- Chartes éditoriales (règles par workspace)
CREATE TABLE editorial_charters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
  tone_guidelines TEXT,
  -- { "forbidden": ["mot1", "mot2"], "preferred": { "formel": ["bonjour"] } }
  vocabulary_rules JSONB NOT NULL DEFAULT '{}',
  -- { "min_length": 50, "max_length": 280, "allowed_topics": [...] }
  content_rules JSONB NOT NULL DEFAULT '{}',
  brand_guidelines TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX idx_editorial_charters_workspace ON editorial_charters(workspace_id);

-- Logs IA (audit trail de chaque appel LLM)
CREATE TABLE ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  model_used TEXT NOT NULL,
  step TEXT NOT NULL CHECK (step IN ('clarification', 'skeleton', 'generation', 'validation')),
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  tokens_used INT,
  charter_validation_passed BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_logs_campaign ON ai_logs(campaign_id);
CREATE INDEX idx_ai_logs_workspace ON ai_logs(workspace_id, created_at DESC);

-- Historique des publications (envois vers n8n/Buffer)
CREATE TABLE publishing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  webhook_url TEXT,
  webhook_payload JSONB,
  response_status INT,
  response_body TEXT,
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_publishing_workspace ON publishing_events(workspace_id);
CREATE INDEX idx_publishing_campaign ON publishing_events(campaign_id);

-- Trigger updated_at automatique
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_charters_updated_at
  BEFORE UPDATE ON editorial_charters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
