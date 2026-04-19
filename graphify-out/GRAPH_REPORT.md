# Graph Report - .  (2026-04-19)

## Corpus Check
- 384 files · ~50,000 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 384 nodes · 402 edges · 77 communities detected
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 72 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]

## God Nodes (most connected - your core abstractions)
1. `createServerClient()` - 25 edges
2. `Campaign page architecture (wizard + results modes)` - 10 edges
3. `inkloop` - 9 edges
4. `createClient()` - 8 edges
5. `generateClarificationQuestions()` - 8 edges
6. `generateEditorialSkeleton()` - 8 edges
7. `Campaign (domain concept)` - 7 edges
8. `ADR-0001: Wizard Pattern for Campaigns` - 7 edges
9. `ADR-0002: Campaign Status State Machine` - 7 edges
10. `toJson()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `inkloop` --conforms_to_spec--> `Campaign view modal specification (2026-04-18)`  [INFERRED]
  CLAUDE.md → docs/superpowers/specs/2026-04-18-campaign-view-dialog-design.md
- `regenerateUntilValid()` --calls--> `generateContent()`  [INFERRED]
  src/lib/ai/regenerate-until-valid.ts → src/lib/ai/index.ts
- `Campaign (domain concept)` --domain_for--> `Replace wizard modals with dedicated page /campaigns/[campaignId]`  [INFERRED]
  CLAUDE.md → docs/superpowers/plans/2026-04-18-campaign-dedicated-page.md
- `Campaign (domain concept)` --domain_for--> `Allow opening existing campaign in modal for view/edit/publish`  [INFERRED]
  CLAUDE.md → docs/superpowers/plans/2026-04-18-campaign-view-dialog.md
- `ADR-0001: Wizard Pattern for Campaigns` --semantically_similar_to--> `ADR-0002: Campaign Status State Machine`  [INFERRED] [semantically similar]
  docs/decisions/0001-wizard-pattern-campaigns.md → docs/decisions/0002-status-transition-machine.md

## Communities

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (29): toJson(), upsertCharter(), getCampaign(), getCampaigns(), getCharter(), getTemplates(), getWorkspace(), getWorkspaces() (+21 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (12): createAdminClient(), createClient(), handleSave(), handleSave(), handleCreate(), handleSubmit(), handleSave(), GET() (+4 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (19): computeCost(), isValidRate(), tokenCost(), generateClarificationQuestions(), generateContent(), generateEditorialSkeleton(), loadCharter(), loadModelPricing() (+11 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (28): ADR-0001: Wizard Pattern for Campaigns, Rationale: Guided UX via Wizard Pattern, Wizard Steps Implementation, WizardActions Server Actions, Charter Validation Requirement, ADR-0003: Editorial Charter as Hard Constraint, Rationale: Reputational Risk Mitigation via Charter Validation, regenerateUntilValid() Loop (+20 more)

### Community 4 - "Community 4"
Cohesion: 0.1
Nodes (22): Bug: Ready -> InProgress Transition Failure, Bug: Textarea Disabled at Ready Status, Rationale: State Machine for Audit Trail, Campaign Status: Draft, Campaign Status: InProgress, Campaign Status: Ready, Campaign Status: Sent (Terminal), ADR-0002: Campaign Status State Machine (+14 more)

### Community 5 - "Community 5"
Cohesion: 0.14
Nodes (19): Campaign view dialog architecture, Task 1: Pure utils (campaignContent.ts), Task 2: Server action updateCampaignContent, Task 3: CampaignViewDialog component, Task 4: Wire up CampaignViewDialog in WorkspaceDashboard, Task 5: Manual verification, Campaign page architecture (wizard + results modes), Task 1: getCampaign server function (+11 more)

### Community 6 - "Community 6"
Cohesion: 0.18
Nodes (7): containsAsWord(), escapeRegex(), validateAllPosts(), validatePost(), regenerateUntilValid(), runAttempt(), parseContent()

### Community 7 - "Community 7"
Cohesion: 0.27
Nodes (6): mergeEdits(), publishCampaign(), checkAndRecordWebhookRateLimit(), parsePositiveInt(), resolveRateLimitConfig(), WebhookRateLimitError

### Community 8 - "Community 8"
Cohesion: 0.22
Nodes (2): openEdit(), parseFields()

### Community 9 - "Community 9"
Cohesion: 0.2
Nodes (0): 

### Community 10 - "Community 10"
Cohesion: 0.28
Nodes (3): initialState(), parseContent(), parseVocabulary()

### Community 11 - "Community 11"
Cohesion: 0.53
Nodes (8): buildClarificationsPrompt(), buildContentPrompt(), buildSkeletonPrompt(), buildValidationPrompt(), charterBlock(), platformBlock(), templateBlock(), workspaceBlock()

### Community 12 - "Community 12"
Cohesion: 0.25
Nodes (2): computeNextStatus(), handleSave()

### Community 13 - "Community 13"
Cohesion: 0.33
Nodes (0): 

### Community 14 - "Community 14"
Cohesion: 0.33
Nodes (0): 

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (6): API Routes for Webhooks/Jobs Only, Rationale: Security & Bundle Size via Server Components, Server Actions for Mutations, Server Components as Default, ADR-0005: Server Components & Server Actions, Supabase createServerClient() Pattern

### Community 16 - "Community 16"
Cohesion: 0.4
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 0.5
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 0.5
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 0.5
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 0.5
Nodes (2): Badge(), cn()

### Community 21 - "Community 21"
Cohesion: 0.67
Nodes (0): 

### Community 22 - "Community 22"
Cohesion: 0.67
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 0.67
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 0.67
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 0.67
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 0.67
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 0.67
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 0.67
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 0.67
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 0.67
Nodes (0): 

### Community 31 - "Community 31"
Cohesion: 0.67
Nodes (3): LLM Services (Claude, OpenAI, Ollama), Next.js 16.2.4 Stack, Supabase Integration (Auth+RLS)

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (2): Next.js Wordmark, Vercel Logo (Triangle)

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (2): Globe Icon (World), Window/Browser Icon

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (0): 

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (0): 

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (0): 

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (0): 

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (0): 

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (0): 

### Community 61 - "Community 61"
Cohesion: 1.0
Nodes (0): 

### Community 62 - "Community 62"
Cohesion: 1.0
Nodes (0): 

### Community 63 - "Community 63"
Cohesion: 1.0
Nodes (0): 

### Community 64 - "Community 64"
Cohesion: 1.0
Nodes (0): 

### Community 65 - "Community 65"
Cohesion: 1.0
Nodes (0): 

### Community 66 - "Community 66"
Cohesion: 1.0
Nodes (0): 

### Community 67 - "Community 67"
Cohesion: 1.0
Nodes (0): 

### Community 68 - "Community 68"
Cohesion: 1.0
Nodes (0): 

### Community 69 - "Community 69"
Cohesion: 1.0
Nodes (0): 

### Community 70 - "Community 70"
Cohesion: 1.0
Nodes (0): 

### Community 71 - "Community 71"
Cohesion: 1.0
Nodes (0): 

### Community 72 - "Community 72"
Cohesion: 1.0
Nodes (0): 

### Community 73 - "Community 73"
Cohesion: 1.0
Nodes (0): 

### Community 74 - "Community 74"
Cohesion: 1.0
Nodes (0): 

### Community 75 - "Community 75"
Cohesion: 1.0
Nodes (0): 

### Community 76 - "Community 76"
Cohesion: 1.0
Nodes (1): File Icon

## Knowledge Gaps
- **42 isolated node(s):** `Next.js 16.2.4`, `Supabase (database + auth)`, `AI Services (Claude, OpenAI, Ollama)`, `Publishing schedulers (Buffer, Hootsuite, n8n)`, `Task 1: getCampaign server function` (+37 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 32`** (2 nodes): `RootLayout()`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (2 nodes): `webhookRateLimit.test.ts`, `buildSupabaseMock()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (2 nodes): `WorkspaceDashboard.tsx`, `WorkspaceDashboard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (2 nodes): `SettingsPanel()`, `SettingsPanel.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (2 nodes): `CampaignNewPage()`, `CampaignNewPage.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (2 nodes): `CampaignCard()`, `CampaignHistory.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (2 nodes): `StepObjectives.tsx`, `StepObjectives()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (2 nodes): `StepSkeleton.tsx`, `handleSubmit()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (2 nodes): `CommandPaletteTrigger()`, `CommandPaletteTrigger.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (2 nodes): `WorkspaceAvatar()`, `Sidebar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (2 nodes): `cn()`, `label.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (2 nodes): `tooltip.tsx`, `TooltipContent()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (2 nodes): `Alert()`, `alert.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (2 nodes): `LoadingButton()`, `loading-button.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (2 nodes): `cn()`, `separator.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (2 nodes): `cn()`, `button.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (2 nodes): `Spinner()`, `spinner.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (2 nodes): `textarea.tsx`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (2 nodes): `Input()`, `input.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (2 nodes): `Next.js Wordmark`, `Vercel Logo (Triangle)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (2 nodes): `Globe Icon (World)`, `Window/Browser Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (1 nodes): `postcss.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `playwright.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `vitest.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (1 nodes): `eslint.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (1 nodes): `critical-path.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (1 nodes): `database.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (1 nodes): `WorkspaceSettings.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (1 nodes): `getCampaign.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 63`** (1 nodes): `wizardActions.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (1 nodes): `campaignContent.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (1 nodes): `campaignToInitialWizardState.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (1 nodes): `form-field.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (1 nodes): `status-badge.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (1 nodes): `workspace.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 69`** (1 nodes): `template.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 70`** (1 nodes): `publishing.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 71`** (1 nodes): `campaign.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 72`** (1 nodes): `charter.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 73`** (1 nodes): `cost-calculator.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (1 nodes): `providers.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 75`** (1 nodes): `json-parser.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 76`** (1 nodes): `File Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.