# Page Dédiée de Campagne Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer les modales Wizard + ViewDialog par une page dédiée `/[workspaceId]/campaigns/[campaignId]` qui affiche le wizard en plein écran puis les résultats avec possibilité de régénérer.

**Architecture:** Chaque campagne a sa propre URL. Cliquer "Nouvelle campagne" navigue vers `/campaigns/new` (step 1), puis redirige vers `/campaigns/[id]` après création. La page gère deux modes : `wizard` (steps 2-6) et `results` (contenu éditable + boutons de régénération). `useCampaignWizard` acquiert un flag `isComplete` pour déclencher la transition.

**Tech Stack:** Next.js App Router (Server Components + `"use client"`), `useCampaignWizard` hook existant, Supabase server client, shadcn/ui, Tailwind CSS 4.

---

## Structure des fichiers

| Action | Fichier | Responsabilité |
|--------|---------|----------------|
| Créer | `src/features/campaigns/server/getCampaign.ts` | Fetch une campagne par ID |
| Créer | `src/app/(workspace)/[workspaceId]/campaigns/new/page.tsx` | Route nouvelle campagne (step 1) |
| Créer | `src/app/(workspace)/[workspaceId]/campaigns/[campaignId]/page.tsx` | Route campagne existante |
| Créer | `src/features/campaigns/components/CampaignDetailPage.tsx` | Composant client : orchestration wizard/results |
| Créer | `src/features/campaigns/components/CampaignResults.tsx` | Vue résultats + édition + régénération |
| Modifier | `src/features/campaigns/hooks/useCampaignWizard.ts` | Ajouter `isComplete` à `WizardState` |
| Modifier | `src/features/campaigns/components/CampaignWizard.tsx` | Supprimer le Dialog wrapper, devenir composant inline |
| Modifier | `src/features/workspaces/components/WorkspaceDashboard.tsx` | Naviguer au lieu d'ouvrir des modales |
| Modifier | `src/features/campaigns/components/CampaignHistory.tsx` | Rendre les items cliquables (liens) |
| Supprimer | `src/features/campaigns/components/CampaignViewDialog.tsx` | Remplacé par CampaignDetailPage |

---

## Task 1: Fonction serveur `getCampaign`

**Files:**
- Create: `src/features/campaigns/server/getCampaign.ts`

- [ ] **Step 1: Écrire le test**

```typescript
// src/features/campaigns/server/getCampaign.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

import { getCampaign } from './getCampaign'
import { createServerClient } from '@/lib/supabase/server'

describe('getCampaign', () => {
  it('retourne null si la campagne est introuvable', async () => {
    const supabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    }
    vi.mocked(createServerClient).mockResolvedValue(supabase as never)

    const result = await getCampaign('unknown-id')
    expect(result).toBeNull()
  })

  it('retourne la campagne si elle existe', async () => {
    const mockCampaign = { id: 'abc', name: 'Test', status: 'Draft' }
    const supabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockCampaign, error: null }),
    }
    vi.mocked(createServerClient).mockResolvedValue(supabase as never)

    const result = await getCampaign('abc')
    expect(result).toEqual(mockCampaign)
  })
})
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

```bash
pnpm test src/features/campaigns/server/getCampaign.test.ts
```
Attendu : FAIL — `getCampaign` non défini.

- [ ] **Step 3: Implémenter `getCampaign`**

```typescript
// src/features/campaigns/server/getCampaign.ts
import { createServerClient } from '@/lib/supabase/server'
import type { Campaign } from '@/types/database'

export async function getCampaign(campaignId: string): Promise<Campaign | null> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (error) return null
  return data
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

```bash
pnpm test src/features/campaigns/server/getCampaign.test.ts
```
Attendu : PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/campaigns/server/getCampaign.ts src/features/campaigns/server/getCampaign.test.ts
git commit -m "feat: ajouter getCampaign server function"
```

---

## Task 2: Ajouter `isComplete` à `useCampaignWizard`

**Files:**
- Modify: `src/features/campaigns/hooks/useCampaignWizard.ts`

- [ ] **Step 1: Écrire un test pour `isComplete`**

Dans `src/features/campaigns/hooks/useCampaignWizard.ts`, ajouter à `WizardState` :

```typescript
// Vérifier que campaignToInitialWizardState fonctionne toujours (tests existants passent)
pnpm test src/features/campaigns/hooks/
```
Attendu : tests existants PASS.

- [ ] **Step 2: Modifier `WizardState` et `INITIAL_STATE`**

Dans `src/features/campaigns/hooks/useCampaignWizard.ts` :

Ajouter `isComplete: boolean` dans l'interface `WizardState` :
```typescript
export interface WizardState {
  step: WizardStep
  campaignId: string | undefined
  selectedTemplate: Template | undefined
  campaignName: string
  rawData: Record<string, unknown>
  objectives: string
  audience: string
  kpis: string
  clarificationQA: ClarificationQA[]
  skeleton: EditorialSkeleton | undefined
  skeletonApproved: boolean
  generatedContent: Record<string, GeneratedPost>
  finalEdits: Record<string, Partial<GeneratedPost>>
  isLoading: boolean
  error: string | undefined
  isComplete: boolean
}
```

Ajouter `isComplete: false` dans `INITIAL_STATE` :
```typescript
const INITIAL_STATE: WizardState = {
  step: 1,
  campaignId: undefined,
  selectedTemplate: undefined,
  campaignName: '',
  rawData: {},
  objectives: '',
  audience: '',
  kpis: '',
  clarificationQA: [],
  skeleton: undefined,
  skeletonApproved: false,
  generatedContent: {},
  finalEdits: {},
  isLoading: false,
  error: undefined,
  isComplete: false,
}
```

- [ ] **Step 3: Mettre `isComplete: true` dans `submitStep6`**

Dans la fonction `submitStep6`, changer :
```typescript
setState((prev) => ({ ...prev, isLoading: false, error: undefined }))
```
en :
```typescript
setState((prev) => ({ ...prev, isLoading: false, error: undefined, isComplete: true }))
```

- [ ] **Step 4: Ajouter `restartFromStep` pour la régénération**

Ajouter dans le hook, avant le `return` :
```typescript
const restartFromStep = useCallback((step: WizardStep) => {
  setState((prev) => ({
    ...prev,
    step,
    isComplete: false,
    error: undefined,
  }))
}, [])
```

Et l'exporter :
```typescript
return {
  state,
  submitStep1,
  submitStep2,
  submitStep3,
  submitStep4,
  submitStep5,
  submitStep6,
  goBack,
  reset,
  restartFromStep,
}
```

- [ ] **Step 5: Vérifier que les tests existants passent toujours**

```bash
pnpm test src/features/campaigns/hooks/
pnpm typecheck
```
Attendu : PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/campaigns/hooks/useCampaignWizard.ts
git commit -m "feat: ajouter isComplete et restartFromStep dans useCampaignWizard"
```

---

## Task 3: `CampaignWizard` — supprimer le Dialog wrapper

**Files:**
- Modify: `src/features/campaigns/components/CampaignWizard.tsx`

Objectif : `CampaignWizard` devient un composant inline (sans `Dialog`). Il reçoit les props nécessaires directement.

- [ ] **Step 1: Réécrire `CampaignWizard.tsx`**

Remplacer le contenu de `src/features/campaigns/components/CampaignWizard.tsx` par :

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Campaign, Template } from '@/types/database'
import { useCampaignWizard, campaignToInitialWizardState } from '../hooks/useCampaignWizard'
import { StepTemplateSelect } from './steps/StepTemplateSelect'
import { StepObjectives } from './steps/StepObjectives'
import { StepClarification } from './steps/StepClarification'
import { StepSkeleton } from './steps/StepSkeleton'
import { StepGeneration } from './steps/StepGeneration'
import { StepReview } from './steps/StepReview'
import { PublishingDialog } from '@/features/publishing/components/PublishingDialog'

const STEP_LABELS = ['Template', 'Objectifs', 'Clarification', 'Squelette', 'Contenu', 'Révision']

type StepNum = 1 | 2 | 3 | 4 | 5 | 6

interface Props {
  workspaceId: string
  resumeCampaign?: Campaign
  onComplete?: (campaignId: string) => void
}

export function CampaignWizard({ workspaceId, resumeCampaign, onComplete }: Props) {
  const router = useRouter()
  const initialState = resumeCampaign ? campaignToInitialWizardState(resumeCampaign) : undefined
  const {
    state,
    submitStep1,
    submitStep2,
    submitStep3,
    submitStep4,
    submitStep5,
    submitStep6,
    goBack,
  } = useCampaignWizard(workspaceId, initialState)

  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [publishedCampaign, setPublishedCampaign] = useState<
    { id: string; name: string } | undefined
  >(undefined)

  async function handleFinalSubmit() {
    const ok = await submitStep6()
    if (ok && state.campaignId) {
      router.refresh()
      onComplete?.(state.campaignId)
    }
  }

  async function handleFinalSubmitAndPublish() {
    if (!state.campaignId) return
    const ok = await submitStep6()
    if (ok) {
      setPublishedCampaign({ id: state.campaignId, name: state.campaignName })
      setPublishDialogOpen(true)
      router.refresh()
    }
  }

  function handlePublishDialogChange(next: boolean) {
    setPublishDialogOpen(next)
    if (!next && state.campaignId) {
      setPublishedCampaign(undefined)
      onComplete?.(state.campaignId)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Stepper */}
      <div className="flex items-center gap-0 mb-8 shrink-0">
        {STEP_LABELS.map((label, i) => {
          const stepNum = (i + 1) as StepNum
          const isActive = state.step === stepNum
          const isDone = state.step > stepNum
          return (
            <div key={label} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all"
                  style={
                    isDone
                      ? { background: 'hsl(235, 80%, 62%)', color: '#fff' }
                      : isActive
                        ? {
                            background: 'hsl(235, 60%, 20%)',
                            color: 'hsl(235, 90%, 78%)',
                            boxShadow: '0 0 0 3px hsl(235, 80%, 62%, 0.2)',
                            border: '1px solid hsl(235, 60%, 38%)',
                          }
                        : {
                            background: 'hsl(222, 18%, 16%)',
                            color: 'hsl(215, 12%, 38%)',
                            border: '1px solid hsl(222, 15%, 22%)',
                          }
                  }
                >
                  {isDone ? '✓' : stepNum}
                </div>
                <span
                  className="text-[11px] mt-1 hidden sm:block"
                  style={{
                    color: isActive
                      ? 'hsl(235, 80%, 75%)'
                      : isDone
                        ? 'hsl(215, 12%, 50%)'
                        : 'hsl(215, 10%, 32%)',
                  }}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className="h-px flex-1 mx-1 transition-colors"
                  style={{
                    background:
                      state.step > stepNum ? 'hsl(235, 80%, 45%)' : 'hsl(222, 15%, 20%)',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Error banner */}
      {state.error && (
        <div
          className="rounded-lg px-4 py-2 mb-4 shrink-0"
          style={{
            background: 'hsl(0, 70%, 20%, 0.2)',
            border: '1px solid hsl(0, 60%, 30%, 0.3)',
          }}
        >
          <p className="text-xs" style={{ color: 'hsl(0, 70%, 65%)' }}>
            {state.error}
          </p>
        </div>
      )}

      {/* Step content */}
      <div className="overflow-y-auto flex-1">
        {state.step === 1 && (
          <StepTemplateSelect
            workspaceId={workspaceId}
            onSubmit={submitStep1}
            isLoading={state.isLoading}
          />
        )}
        {state.step === 2 && (
          <StepObjectives
            initialObjectives={state.objectives}
            initialAudience={state.audience}
            initialKpis={state.kpis}
            onSubmit={submitStep2}
            onBack={goBack}
            isLoading={state.isLoading}
          />
        )}
        {state.step === 3 && (
          <StepClarification
            qa={state.clarificationQA}
            onSubmit={submitStep3}
            onBack={goBack}
            isLoading={state.isLoading}
          />
        )}
        {state.step === 4 && (
          <StepSkeleton
            skeleton={state.skeleton}
            onSubmit={submitStep4}
            onBack={goBack}
            isLoading={state.isLoading}
          />
        )}
        {state.step === 5 && (
          <StepGeneration
            generatedContent={state.generatedContent}
            onSubmit={submitStep5}
            onBack={goBack}
          />
        )}
        {state.step === 6 && (
          <StepReview
            campaignId={state.campaignId}
            campaignName={state.campaignName}
            workspaceId={workspaceId}
            skeleton={state.skeleton}
            generatedContent={state.generatedContent}
            finalEdits={state.finalEdits}
            onSubmit={handleFinalSubmit}
            onSubmitAndPublish={handleFinalSubmitAndPublish}
            onBack={goBack}
            isLoading={state.isLoading}
          />
        )}
      </div>

      {publishedCampaign && (
        <PublishingDialog
          campaignId={publishedCampaign.id}
          campaignName={publishedCampaign.name}
          open={publishDialogOpen}
          onOpenChange={handlePublishDialogChange}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Vérifier le typecheck**

```bash
pnpm typecheck
```
Attendu : pas d'erreurs dans `CampaignWizard.tsx`. Il peut y avoir des erreurs dans `WorkspaceDashboard.tsx` (qui utilisait les vieilles props) — elles seront corrigées en Task 6.

- [ ] **Step 3: Commit partiel**

```bash
git add src/features/campaigns/components/CampaignWizard.tsx
git commit -m "refactor: CampaignWizard devient inline (sans Dialog)"
```

---

## Task 4: `CampaignResults` — vue résultats avec régénération

**Files:**
- Create: `src/features/campaigns/components/CampaignResults.tsx`

- [ ] **Step 1: Créer `CampaignResults.tsx`**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { PublishingDialog } from '@/features/publishing/components/PublishingDialog'
import { updateCampaignContent } from '../server/wizardActions'
import { computeNextStatus, getCharLimit } from '../utils/campaignContent'
import { GeneratedPostSchema } from '@/lib/schemas/campaign'
import { z } from 'zod'
import type { Campaign } from '@/types/database'
import type { GeneratedPost } from '@/lib/schemas/campaign'
import type { WizardStep } from '../hooks/useCampaignWizard'

const GeneratedContentSchema = z.record(z.string(), GeneratedPostSchema)

const STATUS_LABELS: Record<Campaign['status'], string> = {
  Draft: 'Brouillon',
  InProgress: 'En cours',
  Ready: 'Prêt',
  Sent: 'Envoyé',
}

const STATUS_COLORS: Record<Campaign['status'], { color: string; bg: string }> = {
  Draft: { color: 'hsl(215, 12%, 50%)', bg: 'hsl(215, 15%, 16%)' },
  InProgress: { color: 'hsl(38, 90%, 65%)', bg: 'hsl(38, 80%, 18%)' },
  Ready: { color: 'hsl(145, 65%, 60%)', bg: 'hsl(145, 50%, 14%)' },
  Sent: { color: 'hsl(235, 80%, 72%)', bg: 'hsl(235, 60%, 18%)' },
}

interface CampaignResultsProps {
  campaign: Campaign
  onRestart: (step: WizardStep) => void
}

export function CampaignResults({ campaign, onRestart }: CampaignResultsProps) {
  const [publishOpen, setPublishOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [localCampaign, setLocalCampaign] = useState(campaign)

  const parsed = GeneratedContentSchema.safeParse(localCampaign.generated_content)
  const initialContent: Record<string, GeneratedPost> = parsed.success ? parsed.data : {}
  const platforms = Object.entries(initialContent).sort(([a], [b]) => a.localeCompare(b))

  const isSent = localCampaign.status === 'Sent'
  const canPublish = localCampaign.status === 'Ready' || localCampaign.status === 'InProgress'
  const canMarkReady = localCampaign.status !== 'Ready' && localCampaign.status !== 'Sent'
  const statusStyle = STATUS_COLORS[localCampaign.status]

  function handleCaptionChange(platform: string, value: string) {
    setEdits((prev) => ({ ...prev, [platform]: value }))
  }

  function buildUpdatedContent(): Record<string, GeneratedPost> {
    return Object.fromEntries(
      Object.entries(initialContent).map(([platform, post]) => [
        platform,
        { ...post, caption: edits[platform] ?? post.caption },
      ]),
    )
  }

  function handleSave() {
    const newStatus = computeNextStatus(localCampaign.status, 'save')
    setError(null)
    startTransition(async () => {
      try {
        const updated = await updateCampaignContent({
          campaignId: localCampaign.id,
          content: buildUpdatedContent(),
          newStatus,
        })
        setLocalCampaign(updated)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
      }
    })
  }

  function handleMarkReady() {
    setError(null)
    startTransition(async () => {
      try {
        const updated = await updateCampaignContent({
          campaignId: localCampaign.id,
          content: buildUpdatedContent(),
          newStatus: 'Ready',
        })
        setLocalCampaign(updated)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
      }
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold" style={{ color: 'hsl(210, 20%, 90%)' }}>
            {localCampaign.name}
          </h2>
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ color: statusStyle.color, background: statusStyle.bg }}
          >
            {STATUS_LABELS[localCampaign.status]}
          </span>
        </div>

        {!isSent && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => onRestart(3)}
              style={{
                borderColor: 'hsl(222, 15%, 25%)',
                color: 'hsl(210, 20%, 60%)',
                background: 'transparent',
              }}
            >
              Modifier les réponses
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => onRestart(4)}
              style={{
                borderColor: 'hsl(222, 15%, 25%)',
                color: 'hsl(210, 20%, 60%)',
                background: 'transparent',
              }}
            >
              Modifier le squelette
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        {platforms.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-16">
            <p className="text-sm text-center" style={{ color: 'hsl(215, 12%, 40%)' }}>
              Aucun contenu généré.
            </p>
          </div>
        )}

        {platforms.map(([platform, post]) => {
          const limit = getCharLimit(platform)
          const caption = edits[platform] ?? post.caption
          const overLimit = caption.length > limit

          return (
            <div key={platform}>
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-xs font-medium capitalize"
                  style={{ color: 'hsl(215, 12%, 60%)' }}
                >
                  {platform}
                </span>
                <span
                  className="text-[11px]"
                  style={{ color: overLimit ? 'hsl(0, 70%, 60%)' : 'hsl(215, 12%, 40%)' }}
                >
                  {caption.length} / {limit}
                </span>
              </div>
              <textarea
                value={caption}
                readOnly={isSent}
                onChange={(e) => handleCaptionChange(platform, e.target.value)}
                rows={4}
                className="w-full rounded-lg px-3 py-2.5 text-sm resize-y"
                style={{
                  background: 'hsl(222, 18%, 8%)',
                  border: `1px solid ${overLimit ? 'hsl(0, 60%, 40%)' : 'hsl(222, 15%, 20%)'}`,
                  color: 'hsl(210, 20%, 88%)',
                  outline: 'none',
                }}
              />
              {post.hashtags.length > 0 && (
                <p className="mt-1.5 text-[11px]" style={{ color: 'hsl(235, 60%, 60%)' }}>
                  {post.hashtags.map((h) => `#${h}`).join(' ')}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {error && (
        <p className="text-xs mt-3" style={{ color: 'hsl(0, 70%, 60%)' }}>
          {error}
        </p>
      )}

      {!isSent && (
        <div
          className="flex items-center justify-end gap-2 mt-4 pt-4 border-t shrink-0"
          style={{ borderColor: 'hsl(222, 15%, 19%)' }}
        >
          {canMarkReady && (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={handleMarkReady}
              className="text-xs h-8"
              style={{
                borderColor: 'hsl(222, 15%, 25%)',
                color: 'hsl(210, 20%, 70%)',
                background: 'transparent',
              }}
            >
              Marquer comme prêt
            </Button>
          )}
          {canPublish && (
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => setPublishOpen(true)}
              className="text-xs h-8"
              style={{
                background: 'hsl(235, 60%, 20%)',
                color: 'hsl(235, 90%, 78%)',
                border: '1px solid hsl(235, 60%, 28%)',
              }}
            >
              Publier
            </Button>
          )}
          <Button
            size="sm"
            disabled={isPending}
            onClick={handleSave}
            className="text-xs h-8"
            style={{ background: 'hsl(235, 80%, 62%)', color: '#fff', border: 'none' }}
          >
            {isPending ? 'Sauvegarde…' : 'Sauvegarder'}
          </Button>
        </div>
      )}

      {publishOpen && (
        <PublishingDialog
          campaignId={localCampaign.id}
          campaignName={localCampaign.name}
          open={publishOpen}
          onOpenChange={setPublishOpen}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Vérifier le typecheck**

```bash
pnpm typecheck
```
Attendu : pas d'erreurs dans `CampaignResults.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/features/campaigns/components/CampaignResults.tsx
git commit -m "feat: composant CampaignResults avec édition et régénération"
```

---

## Task 5: `CampaignDetailPage` — orchestration wizard/results

**Files:**
- Create: `src/features/campaigns/components/CampaignDetailPage.tsx`

Ce composant client reçoit la campagne en prop et décide d'afficher wizard ou résultats.

- [ ] **Step 1: Créer `CampaignDetailPage.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CampaignWizard } from './CampaignWizard'
import { CampaignResults } from './CampaignResults'
import { campaignToInitialWizardState } from '../hooks/useCampaignWizard'
import type { Campaign } from '@/types/database'
import type { WizardStep } from '../hooks/useCampaignWizard'

interface CampaignDetailPageProps {
  campaign: Campaign
  workspaceId: string
}

function hasGeneratedContent(campaign: Campaign): boolean {
  const content = campaign.generated_content
  if (!content || typeof content !== 'object') return false
  return Object.keys(content).length > 0
}

export function CampaignDetailPage({ campaign, workspaceId }: CampaignDetailPageProps) {
  const router = useRouter()

  // Montrer les résultats si du contenu a déjà été généré
  const [mode, setMode] = useState<'wizard' | 'results'>(
    hasGeneratedContent(campaign) ? 'results' : 'wizard',
  )

  // Pour la régénération : le step de reprise du wizard
  const [resumeStep, setResumeStep] = useState<WizardStep | undefined>(undefined)

  function handleWizardComplete() {
    setMode('results')
    setResumeStep(undefined)
    router.refresh()
  }

  function handleRestart(step: WizardStep) {
    setResumeStep(step)
    setMode('wizard')
  }

  const resumeCampaign: Campaign | undefined =
    mode === 'wizard' && resumeStep !== undefined
      ? campaign
      : mode === 'wizard' && !hasGeneratedContent(campaign)
        ? campaign
        : undefined

  // Pour la reprise depuis un step donné, construire l'état initial
  const wizardInitialState =
    resumeStep !== undefined
      ? { ...campaignToInitialWizardState(campaign), step: resumeStep }
      : undefined

  return (
    <div
      className="flex flex-col h-full min-h-screen"
      style={{ background: 'hsl(222, 18%, 8%)', color: 'hsl(210, 20%, 90%)' }}
    >
      {/* Top bar */}
      <header
        className="px-6 py-4 flex items-center gap-3 shrink-0"
        style={{ borderBottom: '1px solid hsl(222, 15%, 16%)' }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/${workspaceId}`)}
          className="gap-2 text-xs h-8 px-2"
          style={{ color: 'hsl(215, 12%, 50%)' }}
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          Retour
        </Button>
        <span
          className="text-[11px]"
          style={{ color: 'hsl(222, 15%, 30%)' }}
        >
          /
        </span>
        <span className="text-sm font-medium truncate" style={{ color: 'hsl(210, 20%, 80%)' }}>
          {campaign.name}
        </span>
        <span
          className="text-[11px] ml-auto"
          style={{ color: mode === 'wizard' ? 'hsl(235, 80%, 70%)' : 'hsl(215, 12%, 40%)' }}
        >
          {mode === 'wizard' ? 'Wizard' : 'Résultats'}
        </span>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-6 py-8 overflow-hidden">
        {mode === 'wizard' ? (
          <CampaignWizard
            workspaceId={workspaceId}
            resumeCampaign={resumeCampaign}
            wizardInitialState={wizardInitialState}
            onComplete={handleWizardComplete}
          />
        ) : (
          <CampaignResults
            campaign={campaign}
            onRestart={handleRestart}
          />
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Adapter `CampaignWizard` pour accepter `wizardInitialState`**

Dans `src/features/campaigns/components/CampaignWizard.tsx`, ajouter `wizardInitialState` aux props :

```tsx
import type { WizardState } from '../hooks/useCampaignWizard'

interface Props {
  workspaceId: string
  resumeCampaign?: Campaign
  wizardInitialState?: Partial<WizardState>
  onComplete?: (campaignId: string) => void
}

export function CampaignWizard({ workspaceId, resumeCampaign, wizardInitialState, onComplete }: Props) {
  const router = useRouter()
  const derivedInitialState = resumeCampaign ? campaignToInitialWizardState(resumeCampaign) : undefined
  const initialState = wizardInitialState ?? derivedInitialState
  // ...reste inchangé
```

- [ ] **Step 3: Vérifier le typecheck**

```bash
pnpm typecheck
```
Attendu : pas d'erreurs.

- [ ] **Step 4: Commit**

```bash
git add src/features/campaigns/components/CampaignDetailPage.tsx src/features/campaigns/components/CampaignWizard.tsx
git commit -m "feat: CampaignDetailPage orchestre wizard et résultats"
```

---

## Task 6: Routes Next.js pour les pages campagne

**Files:**
- Create: `src/app/(workspace)/[workspaceId]/campaigns/[campaignId]/page.tsx`

- [ ] **Step 1: Créer la route de détail campagne**

```tsx
// src/app/(workspace)/[workspaceId]/campaigns/[campaignId]/page.tsx
import { notFound } from 'next/navigation'
import { getCampaign } from '@/features/campaigns/server/getCampaign'
import { CampaignDetailPage } from '@/features/campaigns/components/CampaignDetailPage'

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ workspaceId: string; campaignId: string }>
}) {
  const { workspaceId, campaignId } = await params

  const campaign = await getCampaign(campaignId)
  if (!campaign) notFound()

  return <CampaignDetailPage campaign={campaign} workspaceId={workspaceId} />
}
```

- [ ] **Step 2: Lancer le serveur de dev pour vérifier la route**

```bash
pnpm dev
```

Naviguer manuellement vers `http://localhost:3000/[workspaceId]/campaigns/[un-vrai-campaign-id]` depuis la DB.

Attendu : la page s'affiche avec le wizard ou les résultats selon l'état de la campagne.

- [ ] **Step 3: Commit**

```bash
git add src/app/(workspace)/[workspaceId]/campaigns/[campaignId]/page.tsx
git commit -m "feat: route /campaigns/[campaignId] avec CampaignDetailPage"
```

---

## Task 7: Mettre à jour `WorkspaceDashboard` et `CampaignHistory`

**Files:**
- Modify: `src/features/workspaces/components/WorkspaceDashboard.tsx`
- Modify: `src/features/campaigns/components/CampaignHistory.tsx` (vérifier que les items ont des liens)

Objectif : "Nouvelle campagne" navigue vers `/[workspaceId]/campaigns/new`, les items de campagne naviguent vers `/[workspaceId]/campaigns/[id]`.

- [ ] **Step 1: Lire CampaignHistory pour voir comment les clics sont gérés**

```bash
cat src/features/campaigns/components/CampaignHistory.tsx
```

- [ ] **Step 2: Créer la route `/campaigns/new` (step 1 only)**

Créer `src/app/(workspace)/[workspaceId]/campaigns/new/page.tsx` :

```tsx
import { CampaignNewPage } from '@/features/campaigns/components/CampaignNewPage'

export default async function NewCampaignPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params
  return <CampaignNewPage workspaceId={workspaceId} />
}
```

Créer `src/features/campaigns/components/CampaignNewPage.tsx` :

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CampaignWizard } from './CampaignWizard'

interface CampaignNewPageProps {
  workspaceId: string
}

export function CampaignNewPage({ workspaceId }: CampaignNewPageProps) {
  const router = useRouter()

  function handleComplete(campaignId: string) {
    router.push(`/${workspaceId}/campaigns/${campaignId}`)
  }

  return (
    <div
      className="flex flex-col h-full min-h-screen"
      style={{ background: 'hsl(222, 18%, 8%)', color: 'hsl(210, 20%, 90%)' }}
    >
      <header
        className="px-6 py-4 flex items-center gap-3 shrink-0"
        style={{ borderBottom: '1px solid hsl(222, 15%, 16%)' }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/${workspaceId}`)}
          className="gap-2 text-xs h-8 px-2"
          style={{ color: 'hsl(215, 12%, 50%)' }}
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          Retour
        </Button>
        <span className="text-[11px]" style={{ color: 'hsl(222, 15%, 30%)' }}>/</span>
        <span className="text-sm font-medium" style={{ color: 'hsl(210, 20%, 80%)' }}>
          Nouvelle campagne
        </span>
      </header>

      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-6 py-8 overflow-hidden">
        <CampaignWizard
          workspaceId={workspaceId}
          onComplete={handleComplete}
        />
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Mettre à jour `WorkspaceDashboard`**

Remplacer dans `src/features/workspaces/components/WorkspaceDashboard.tsx` :
- Ajouter `useRouter` et supprimer les states `wizardOpen` et `selectedCampaign`
- "Nouvelle campagne" → `router.push(`/${workspace.id}/campaigns/new`)`
- `handleOpenCampaign` → `router.push(`/${workspace.id}/campaigns/${id}`)`
- Supprimer les imports et instances de `CampaignWizard` et `CampaignViewDialog`

Code complet :

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { CampaignHistory } from '@/features/campaigns/components/CampaignHistory'
import { WorkspaceSettings } from './WorkspaceSettings'
import type { Campaign, EditorialCharter, Template, Workspace } from '@/types/database'
import { PlusIcon } from 'lucide-react'

interface WorkspaceDashboardProps {
  workspace: Workspace
  campaigns: Campaign[]
  templates: Template[]
  charter: EditorialCharter | null
}

const BORDER = 'hsl(222, 15%, 18%)'
const TEXT = 'hsl(210, 20%, 94%)'
const TEXT_MUTED = 'hsl(215, 12%, 50%)'
const ACCENT = 'hsl(235, 80%, 62%)'

export function WorkspaceDashboard({
  workspace,
  campaigns,
  templates,
  charter,
}: WorkspaceDashboardProps) {
  const router = useRouter()

  function handleOpenCampaign(id: string) {
    router.push(`/${workspace.id}/campaigns/${id}`)
  }

  return (
    <div className="flex flex-col h-full">
      <header
        className="px-7 py-5 flex items-center justify-between shrink-0"
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        <div>
          <h1 className="text-[15px] font-semibold tracking-tight" style={{ color: TEXT }}>
            {workspace.name}
          </h1>
          <p className="text-xs mt-0.5 font-normal" style={{ color: TEXT_MUTED }}>
            {workspace.type === 'Personal' ? 'Profil personnel' : 'Association'}
          </p>
        </div>
        <Button
          onClick={() => router.push(`/${workspace.id}/campaigns/new`)}
          className="gap-2 text-xs font-medium h-8 px-3.5 rounded-md transition-all hover:scale-[1.02]"
          style={{
            background: ACCENT,
            color: '#fff',
            border: 'none',
            boxShadow: `0 1px 12px hsl(235, 80%, 62%, 0.35)`,
          }}
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Nouvelle campagne
        </Button>
      </header>

      <Tabs defaultValue="campaigns" className="flex-1 flex flex-col">
        <TabsList
          className="rounded-none px-6 gap-0 h-auto pb-0"
          style={{ background: 'transparent', borderBottom: `1px solid ${BORDER}` }}
        >
          <TabsTrigger
            value="campaigns"
            className="rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent px-4 py-3 text-xs font-medium transition-colors"
            style={{ color: TEXT_MUTED }}
          >
            Campagnes
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent px-4 py-3 text-xs font-medium transition-colors"
            style={{ color: TEXT_MUTED }}
          >
            Paramètres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="flex-1 p-7 mt-0">
          <CampaignHistory campaigns={campaigns} onOpenCampaign={handleOpenCampaign} />
        </TabsContent>

        <TabsContent value="settings" className="flex-1 p-7 mt-0 overflow-auto">
          <WorkspaceSettings workspace={workspace} templates={templates} charter={charter} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

- [ ] **Step 4: Vérifier le typecheck complet**

```bash
pnpm typecheck
pnpm lint
```
Attendu : 0 erreurs.

- [ ] **Step 5: Commit**

```bash
git add src/features/workspaces/components/WorkspaceDashboard.tsx \
        src/app/(workspace)/[workspaceId]/campaigns/new/page.tsx \
        src/features/campaigns/components/CampaignNewPage.tsx
git commit -m "feat: navigation vers pages dédiées campagnes depuis le dashboard"
```

---

## Task 8: Supprimer `CampaignViewDialog`

**Files:**
- Delete: `src/features/campaigns/components/CampaignViewDialog.tsx`

- [ ] **Step 1: Vérifier qu'il n'y a plus d'imports de `CampaignViewDialog`**

```bash
grep -r "CampaignViewDialog" src/
```
Attendu : 0 résultats (tous les imports ont été supprimés en Task 7).

- [ ] **Step 2: Supprimer le fichier**

```bash
rm src/features/campaigns/components/CampaignViewDialog.tsx
```

- [ ] **Step 3: Vérifier typecheck et lint**

```bash
pnpm typecheck
pnpm lint
```
Attendu : 0 erreurs.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: supprimer CampaignViewDialog (remplacé par CampaignDetailPage)"
```

---

## Task 9: Tests manuels et smoke test

- [ ] **Step 1: Démarrer le serveur**

```bash
pnpm dev
```

- [ ] **Step 2: Tester le flux "Nouvelle campagne"**

1. Cliquer "Nouvelle campagne" sur le dashboard → navigation vers `/[wid]/campaigns/new`
2. Compléter l'étape 1 (template + nom) → vérifier la redirection vers `/[wid]/campaigns/[id]`
3. Compléter les étapes 2-6 → vérifier que les résultats s'affichent automatiquement

- [ ] **Step 3: Tester la reprise d'une campagne existante**

1. Cliquer sur une campagne existante dans l'historique → navigation vers `/[wid]/campaigns/[id]`
2. Si elle a du contenu : vue résultats s'affiche
3. Si elle est en cours : wizard au bon step s'affiche

- [ ] **Step 4: Tester la régénération**

1. Sur une campagne avec du contenu, cliquer "Modifier les réponses" → wizard step 3
2. Soumettre → régénération du squelette → step 4 → step 5 → step 6 → retour résultats

- [ ] **Step 5: Vérifier le bouton retour**

Cliquer "Retour" → navigation vers le dashboard workspace.

- [ ] **Step 6: Commit final si tout est ok**

```bash
git add -A
git commit -m "test: validation manuelle du flux campagne page dédiée"
```

---

## Self-Review

### Couverture de la spec

| Exigence | Task |
|----------|------|
| Page dédiée par campagne | Task 6 |
| Wizard en plein écran (pas de modale) | Tasks 3, 5, 6 |
| Vue résultats sur la même page | Tasks 4, 5 |
| Modifier les réponses (step 3) | Task 4 (`onRestart(3)`) |
| Modifier le squelette (step 4) | Task 4 (`onRestart(4)`) |
| Régénération après ajustements | Tasks 2, 5 (`restartFromStep`) |
| Navigation depuis le dashboard | Task 7 |
| Nouvelle campagne → page dédiée | Tasks 7 |
| Suppression des vieilles modales | Tasks 3, 8 |

### Checklist placeholders

Aucun TBD ou TODO dans ce plan.

### Cohérence des types

- `WizardStep` exporté depuis `useCampaignWizard.ts` — utilisé dans `CampaignResults`, `CampaignDetailPage`, `CampaignWizard`
- `onComplete?: (campaignId: string) => void` — cohérent entre `CampaignWizard` et ses consommateurs
- `wizardInitialState?: Partial<WizardState>` — ajouté dans Task 5 Step 2, avant utilisation dans Task 5 Step 1
