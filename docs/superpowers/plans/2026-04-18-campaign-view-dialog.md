# Campaign View Dialog — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre d'ouvrir une campagne existante dans une modal pour consulter, modifier et publier son contenu généré par plateforme.

**Architecture:** Nouveau composant `CampaignViewDialog` (Dialog Radix UI) déclenché depuis `WorkspaceDashboard`. Les utilitaires purs (transitions de statut, limites de caractères) sont extraits dans `campaignContent.ts` et testés indépendamment. Une nouvelle server action `updateCampaignContent` persiste les modifications en DB.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Zod, Supabase, Radix UI Dialog, Vitest

---

## Fichiers

| Action | Fichier |
|---|---|
| Créer | `src/features/campaigns/utils/campaignContent.ts` |
| Créer | `src/features/campaigns/utils/campaignContent.test.ts` |
| Créer | `src/features/campaigns/components/CampaignViewDialog.tsx` |
| Modifier | `src/features/campaigns/server/wizardActions.ts` |
| Modifier | `src/features/workspaces/components/WorkspaceDashboard.tsx` |

---

## Task 1 : Utilitaires purs + tests

**Files:**
- Create: `src/features/campaigns/utils/campaignContent.ts`
- Create: `src/features/campaigns/utils/campaignContent.test.ts`

- [ ] **Step 1 : Écrire les tests**

```ts
// src/features/campaigns/utils/campaignContent.test.ts
import { describe, it, expect } from 'vitest'
import { computeNextStatus, getCharLimit } from './campaignContent'

describe('getCharLimit', () => {
  it('retourne 280 pour twitter', () => {
    expect(getCharLimit('twitter')).toBe(280)
  })
  it('retourne 3000 pour linkedin', () => {
    expect(getCharLimit('linkedin')).toBe(3000)
  })
  it('retourne 2000 pour plateforme inconnue', () => {
    expect(getCharLimit('tiktok')).toBe(2000)
  })
  it('est insensible à la casse', () => {
    expect(getCharLimit('Twitter')).toBe(280)
    expect(getCharLimit('LINKEDIN')).toBe(3000)
  })
})

describe('computeNextStatus', () => {
  it('Draft + save → InProgress', () => {
    expect(computeNextStatus('Draft', 'save')).toBe('InProgress')
  })
  it('InProgress + save → InProgress', () => {
    expect(computeNextStatus('InProgress', 'save')).toBe('InProgress')
  })
  it('Ready + save → InProgress (modification détectée)', () => {
    expect(computeNextStatus('Ready', 'save')).toBe('InProgress')
  })
  it('Draft + markReady → Ready', () => {
    expect(computeNextStatus('Draft', 'markReady')).toBe('Ready')
  })
  it('InProgress + markReady → Ready', () => {
    expect(computeNextStatus('InProgress', 'markReady')).toBe('Ready')
  })
})
```

- [ ] **Step 2 : Vérifier que les tests échouent**

```bash
pnpm vitest run src/features/campaigns/utils/campaignContent.test.ts
```
Attendu : FAIL — `Cannot find module './campaignContent'`

- [ ] **Step 3 : Implémenter les utilitaires**

```ts
// src/features/campaigns/utils/campaignContent.ts
import type { Campaign } from '@/types/database'

export const CHAR_LIMITS: Record<string, number> = {
  twitter: 280,
  linkedin: 3000,
  facebook: 63206,
  instagram: 2200,
}

export function getCharLimit(platform: string): number {
  return CHAR_LIMITS[platform.toLowerCase()] ?? 2000
}

export function computeNextStatus(
  current: Campaign['status'],
  action: 'save' | 'markReady',
): Campaign['status'] {
  if (action === 'markReady') return 'Ready'
  if (current === 'Draft' || current === 'Ready') return 'InProgress'
  return current
}
```

- [ ] **Step 4 : Vérifier que les tests passent**

```bash
pnpm vitest run src/features/campaigns/utils/campaignContent.test.ts
```
Attendu : PASS — 9 tests

- [ ] **Step 5 : Commit**

```bash
git add src/features/campaigns/utils/campaignContent.ts src/features/campaigns/utils/campaignContent.test.ts
git commit -m "feat: utilitaires purs statut campagne et limites caractères"
```

---

## Task 2 : Server action `updateCampaignContent`

**Files:**
- Modify: `src/features/campaigns/server/wizardActions.ts`

- [ ] **Step 1 : Ajouter l'import `Campaign` en tête de fichier**

Remplacer la ligne d'import existante :
```ts
import type { ClarificationQA, EditorialSkeleton, GeneratedPost } from '@/lib/schemas/campaign'
import type { Json } from '@/types/database'
```
Par :
```ts
import type { ClarificationQA, EditorialSkeleton, GeneratedPost } from '@/lib/schemas/campaign'
import type { Campaign, Json } from '@/types/database'
```

- [ ] **Step 2 : Ajouter la server action à la fin du fichier**

```ts
export async function updateCampaignContent(input: {
  campaignId: string
  content: Record<string, GeneratedPost>
  newStatus: Campaign['status']
}): Promise<Campaign> {
  if (input.newStatus === 'Sent') {
    throw new Error('Impossible de modifier une campagne déjà envoyée')
  }

  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('campaigns')
    .update({
      generated_content: toJson(input.content),
      status: input.newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.campaignId)
    .select()
    .single()

  if (error) throw error
  return data
}
```

- [ ] **Step 3 : Vérifier le typecheck**

```bash
pnpm typecheck
```
Attendu : 0 erreur

- [ ] **Step 4 : Commit**

```bash
git add src/features/campaigns/server/wizardActions.ts
git commit -m "feat: server action updateCampaignContent"
```

---

## Task 3 : Composant `CampaignViewDialog`

**Files:**
- Create: `src/features/campaigns/components/CampaignViewDialog.tsx`

- [ ] **Step 1 : Créer le fichier**

```tsx
// src/features/campaigns/components/CampaignViewDialog.tsx
'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PublishingDialog } from '@/features/publishing/components/PublishingDialog'
import { updateCampaignContent } from '../server/wizardActions'
import { computeNextStatus, getCharLimit } from '../utils/campaignContent'
import { GeneratedPostSchema } from '@/lib/schemas/campaign'
import { z } from 'zod'
import type { Campaign } from '@/types/database'
import type { GeneratedPost } from '@/lib/schemas/campaign'

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

interface CampaignViewDialogProps {
  campaign: Campaign | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCampaignUpdated: (updated: Campaign) => void
}

export function CampaignViewDialog({
  campaign,
  open,
  onOpenChange,
  onCampaignUpdated,
}: CampaignViewDialogProps) {
  const [publishOpen, setPublishOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [edits, setEdits] = useState<Record<string, string>>({})

  if (!campaign) return null

  const parsed = GeneratedContentSchema.safeParse(campaign.generated_content)
  const initialContent: Record<string, GeneratedPost> = parsed.success ? parsed.data : {}
  const platforms = Object.entries(initialContent).sort(([a], [b]) => a.localeCompare(b))

  const isSent = campaign.status === 'Sent'
  const canPublish = campaign.status === 'Ready' || campaign.status === 'InProgress'
  const canMarkReady = campaign.status !== 'Ready' && campaign.status !== 'Sent'
  const statusStyle = STATUS_COLORS[campaign.status]

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
    const newStatus = computeNextStatus(campaign.status, 'save')
    setError(null)
    startTransition(async () => {
      try {
        const updated = await updateCampaignContent({
          campaignId: campaign.id,
          content: buildUpdatedContent(),
          newStatus,
        })
        onCampaignUpdated(updated)
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
          campaignId: campaign.id,
          content: buildUpdatedContent(),
          newStatus: 'Ready',
        })
        onCampaignUpdated(updated)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
      }
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] flex flex-col gap-0"
          style={{
            background: 'hsl(222, 18%, 10%)',
            border: '1px solid hsl(222, 15%, 19%)',
            color: 'hsl(210, 20%, 90%)',
          }}
        >
          <DialogHeader className="pb-4">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle
                className="text-sm font-semibold truncate"
                style={{ color: 'hsl(210, 20%, 90%)' }}
              >
                {campaign.name}
              </DialogTitle>
              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0"
                style={{ color: statusStyle.color, background: statusStyle.bg }}
              >
                {STATUS_LABELS[campaign.status]}
              </span>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 pr-1">
            {platforms.length === 0 && (
              <p
                className="text-sm text-center py-10"
                style={{ color: 'hsl(215, 12%, 40%)' }}
              >
                Aucun contenu généré pour cette campagne.
              </p>
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
                      style={{
                        color: overLimit ? 'hsl(0, 70%, 60%)' : 'hsl(215, 12%, 40%)',
                      }}
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
                    <p
                      className="mt-1.5 text-[11px]"
                      style={{ color: 'hsl(235, 60%, 60%)' }}
                    >
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
              className="flex items-center justify-end gap-2 mt-4 pt-4 border-t"
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
        </DialogContent>
      </Dialog>

      {publishOpen && (
        <PublishingDialog
          campaignId={campaign.id}
          campaignName={campaign.name}
          open={publishOpen}
          onOpenChange={setPublishOpen}
        />
      )}
    </>
  )
}
```

- [ ] **Step 2 : Vérifier le typecheck**

```bash
pnpm typecheck
```
Attendu : 0 erreur

- [ ] **Step 3 : Commit**

```bash
git add src/features/campaigns/components/CampaignViewDialog.tsx
git commit -m "feat: composant CampaignViewDialog"
```

---

## Task 4 : Brancher `WorkspaceDashboard`

**Files:**
- Modify: `src/features/workspaces/components/WorkspaceDashboard.tsx`

- [ ] **Step 1 : Remplacer le contenu complet du fichier**

```tsx
// src/features/workspaces/components/WorkspaceDashboard.tsx
'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { CampaignHistory } from '@/features/campaigns/components/CampaignHistory'
import { CampaignWizard } from '@/features/campaigns/components/CampaignWizard'
import { CampaignViewDialog } from '@/features/campaigns/components/CampaignViewDialog'
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
  campaigns: initialCampaigns,
  templates,
  charter,
}: WorkspaceDashboardProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)

  function handleOpenCampaign(id: string) {
    const found = campaigns.find((c) => c.id === id) ?? null
    setSelectedCampaign(found)
  }

  function handleCampaignUpdated(updated: Campaign) {
    setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    setSelectedCampaign(updated)
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
          onClick={() => setWizardOpen(true)}
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
          style={{
            background: 'transparent',
            borderBottom: `1px solid ${BORDER}`,
          }}
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

      <CampaignWizard
        workspaceId={workspace.id}
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />

      <CampaignViewDialog
        campaign={selectedCampaign}
        open={selectedCampaign !== null}
        onOpenChange={(open) => { if (!open) setSelectedCampaign(null) }}
        onCampaignUpdated={handleCampaignUpdated}
      />
    </div>
  )
}
```

- [ ] **Step 2 : Vérifier le typecheck et le lint**

```bash
pnpm lint && pnpm typecheck
```
Attendu : 0 erreur, 0 warning

- [ ] **Step 3 : Commit**

```bash
git add src/features/workspaces/components/WorkspaceDashboard.tsx
git commit -m "feat: brancher CampaignViewDialog dans WorkspaceDashboard"
```

---

## Task 5 : Vérification manuelle

- [ ] **Step 1 : Lancer le serveur de dev**

```bash
pnpm dev
```

- [ ] **Step 2 : Scénario golden path**

1. Ouvrir un workspace avec au moins une campagne au statut `Ready` ou `InProgress`
2. Cliquer sur la carte de la campagne → la modal s'ouvre avec le contenu par plateforme
3. Modifier le texte d'un post → le compteur de caractères se met à jour
4. Cliquer "Sauvegarder" → spinner, puis le badge statut se met à jour dans la modal ET dans la liste
5. Fermer la modal → la carte dans la liste reflète le nouveau statut

- [ ] **Step 3 : Scénarios edge case**

- Campagne `Draft` sans contenu généré → message "Aucun contenu généré"
- Campagne `Sent` → textareas en lecture seule, pas de footer
- Dépasser la limite de caractères → compteur en rouge, bordure rouge sur le textarea
- Cliquer "Marquer comme prêt" → statut passe à `Ready`, bouton disparaît

- [ ] **Step 4 : Lancer les tests unitaires**

```bash
pnpm test
```
Attendu : tous les tests passent
