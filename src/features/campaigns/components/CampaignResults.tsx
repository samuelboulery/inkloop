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
        const content = GeneratedContentSchema.parse(buildUpdatedContent())
        const updated = await updateCampaignContent({
          campaignId: localCampaign.id,
          content,
          newStatus,
        })
        setLocalCampaign(updated)
        setEdits({})
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
      }
    })
  }

  function handleMarkReady() {
    setError(null)
    startTransition(async () => {
      try {
        const content = GeneratedContentSchema.parse(buildUpdatedContent())
        const updated = await updateCampaignContent({
          campaignId: localCampaign.id,
          content,
          newStatus: 'Ready',
        })
        setLocalCampaign(updated)
        setEdits({})
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
                readOnly={isSent || isPending}
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
