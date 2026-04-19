# Data Access & Server Actions

> 31 nodes · cohesion 0.50

## Key Concepts

- **createServerClient()** (25 connections) — `src/lib/supabase/server.ts`
- **wizardActions.ts** (7 connections) — `src/features/campaigns/server/wizardActions.ts`
- **toJson()** (6 connections) — `src/features/campaigns/server/wizardActions.ts`
- **getWorkspace()** (5 connections) — `src/features/workspaces/server/getWorkspaces.ts`
- **getWorkspaces()** (4 connections) — `src/features/workspaces/server/getWorkspaces.ts`
- **templateActions.ts** (4 connections) — `src/features/templates/server/templateActions.ts`
- **RootPage()** (3 connections) — `src/app/page.tsx`
- **CampaignPage()** (3 connections) — `src/app/(workspace)/[workspaceId]/campaigns/[campaignId]/page.tsx`
- **upsertCharter()** (3 connections) — `src/features/charters/server/charterActions.ts`
- **toJson()** (3 connections) — `src/features/templates/server/templateActions.ts`
- **createTemplate()** (3 connections) — `src/features/templates/server/templateActions.ts`
- **updateTemplate()** (3 connections) — `src/features/templates/server/templateActions.ts`
- **initializeCampaign()** (3 connections) — `src/features/campaigns/server/wizardActions.ts`
- **saveCampaignObjectives()** (3 connections) — `src/features/campaigns/server/wizardActions.ts`
- **approveSkeleton()** (3 connections) — `src/features/campaigns/server/wizardActions.ts`
- **saveGeneratedContent()** (3 connections) — `src/features/campaigns/server/wizardActions.ts`
- **updateCampaignContent()** (3 connections) — `src/features/campaigns/server/wizardActions.ts`
- **getCampaign()** (3 connections) — `src/features/campaigns/server/getCampaign.ts`
- **middleware()** (2 connections) — `src/middleware.ts`
- **CampaignNewRoute()** (2 connections) — `src/app/(workspace)/[workspaceId]/campaigns/new/page.tsx`
- **charterActions.ts** (2 connections) — `src/features/charters/server/charterActions.ts`
- **toJson()** (2 connections) — `src/features/charters/server/charterActions.ts`
- **getWorkspaces.ts** (2 connections) — `src/features/workspaces/server/getWorkspaces.ts`
- **deleteTemplate()** (2 connections) — `src/features/templates/server/templateActions.ts`
- **saveClarificationAnswers()** (2 connections) — `src/features/campaigns/server/wizardActions.ts`
- *... and 6 more nodes in this community*

## Relationships

- [[Workspace Layout & Queries]] (5 shared connections)
- [[AI Generation Pipeline]] (4 shared connections)
- [[Workspace Settings & Admin]] (1 shared connections)
- [[Publishing & Webhooks]] (1 shared connections)

## Source Files

- `src/app/(workspace)/[workspaceId]/campaigns/[campaignId]/page.tsx`
- `src/app/(workspace)/[workspaceId]/campaigns/new/page.tsx`
- `src/app/page.tsx`
- `src/features/campaigns/server/getCampaign.ts`
- `src/features/campaigns/server/wizardActions.ts`
- `src/features/charters/server/charterActions.ts`
- `src/features/templates/server/templateActions.ts`
- `src/features/workspaces/server/getWorkspaces.ts`
- `src/lib/supabase/server.ts`
- `src/middleware.ts`

## Audit Trail

- EXTRACTED: 58 (54%)
- INFERRED: 49 (46%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*