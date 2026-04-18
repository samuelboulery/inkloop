'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading-button'
import { Alert } from '@/components/ui/alert'
import { StatusBadge, type StatusBadgeProps } from '@/components/ui/status-badge'
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

const STATUS_BADGE_MAP: Record<Campaign['status'], NonNullable<StatusBadgeProps['status']>> = {
  Draft: 'draft',
  InProgress: 'progress',
  Ready: 'ready',
  Sent: 'sent',
}

const PLATFORM_LABELS: Record<string, string> = {
  twitter: 'X / Twitter',
  x: 'X / Twitter',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
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
          <h2 className="text-base font-semibold text-foreground">{localCampaign.name}</h2>
          <StatusBadge
            status={STATUS_BADGE_MAP[localCampaign.status]}
            dot={localCampaign.status === 'InProgress'}
          >
            {STATUS_LABELS[localCampaign.status]}
          </StatusBadge>
        </div>

        {!isSent && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => onRestart(3)}
            >
              Modifier les réponses
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => onRestart(4)}
            >
              Modifier le squelette
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-8 pr-1">
        {platforms.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-16">
            <p className="text-sm text-center text-muted-foreground">Aucun contenu généré.</p>
          </div>
        )}

        {platforms.map(([platform, post]) => {
          const limit = getCharLimit(platform)
          const caption = edits[platform] ?? post.caption
          const overLimit = caption.length > limit
          const platformLabel = PLATFORM_LABELS[platform.toLowerCase()] ?? platform

          return (
            <div key={platform} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-meta text-muted-foreground">{platformLabel}</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Editor */}
                <div className="flex flex-col gap-2">
                  <textarea
                    value={caption}
                    readOnly={isSent || isPending}
                    onChange={(e) => handleCaptionChange(platform, e.target.value)}
                    rows={6}
                    className={`w-full rounded-lg px-3 py-2.5 text-sm resize-y transition-colors duration-200 bg-surface-1 text-foreground border focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring ${
                      overLimit ? 'border-destructive' : 'border-border'
                    }`}
                  />
                  <div className="flex items-center justify-between">
                    {post.hashtags.length > 0 ? (
                      <p className="text-meta text-muted-foreground truncate">
                        {post.hashtags.map((h) => `#${h}`).join(' ')}
                      </p>
                    ) : (
                      <span />
                    )}
                    <CharCounterRing length={caption.length} limit={limit} />
                  </div>
                </div>

                {/* Preview */}
                <PlatformPreview
                  platform={platformLabel}
                  caption={caption}
                  hashtags={post.hashtags}
                />
              </div>
            </div>
          )
        })}
      </div>

      {error && (
        <div className="mt-3 shrink-0">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {!isSent && (
        <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border shrink-0">
          {canMarkReady && (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={handleMarkReady}
              className="text-xs h-8"
            >
              Marquer comme prêt
            </Button>
          )}
          {canPublish && (
            <Button
              variant="secondary"
              size="sm"
              disabled={isPending}
              onClick={() => setPublishOpen(true)}
              className="text-xs h-8"
            >
              Publier
            </Button>
          )}
          <LoadingButton
            size="sm"
            loading={isPending}
            loadingText="Sauvegarde…"
            onClick={handleSave}
            className="text-xs h-8"
          >
            Sauvegarder
          </LoadingButton>
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

interface CharCounterRingProps {
  length: number
  limit: number
}

function CharCounterRing({ length, limit }: CharCounterRingProps) {
  const ratio = limit > 0 ? length / limit : 0
  const clamped = Math.min(ratio, 1)
  const radius = 14
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - clamped)
  const overLimit = ratio > 1
  const nearLimit = ratio >= 0.9 && !overLimit

  const ringColor = overLimit
    ? 'text-destructive'
    : nearLimit
      ? 'text-signal'
      : 'text-foreground'
  const labelColor = overLimit
    ? 'text-destructive'
    : nearLimit
      ? 'text-signal'
      : 'text-muted-foreground'

  return (
    <div className="flex items-center gap-2">
      <span className={`text-meta tabular-nums ${labelColor}`}>
        {length} / {limit}
      </span>
      <svg
        width={36}
        height={36}
        viewBox="0 0 36 36"
        role="img"
        aria-label={`${length} caractères sur ${limit}`}
        className="shrink-0"
      >
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          strokeWidth="2"
          className="text-border"
          stroke="currentColor"
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 18 18)"
          className={`${ringColor} transition-[stroke-dashoffset,color] duration-200`}
          stroke="currentColor"
        />
      </svg>
    </div>
  )
}

interface PlatformPreviewProps {
  platform: string
  caption: string
  hashtags: string[]
}

function PlatformPreview({ platform, caption, hashtags }: PlatformPreviewProps) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div
          aria-hidden="true"
          className="size-8 rounded-full bg-foreground/10 border border-border"
        />
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-xs font-medium text-foreground truncate">Votre marque</span>
          <span className="text-meta text-muted-foreground">{platform}</span>
        </div>
      </div>

      <p className="text-sm text-foreground whitespace-pre-wrap break-words leading-relaxed">
        {caption || (
          <span className="text-muted-foreground italic">Aperçu du contenu…</span>
        )}
      </p>

      {hashtags.length > 0 && (
        <p className="text-xs text-signal/80 break-words">
          {hashtags.map((h) => `#${h}`).join(' ')}
        </p>
      )}

      <div className="mt-1 pt-3 border-t border-border flex items-center justify-between text-meta text-muted-foreground">
        <span>Aperçu</span>
        <span className="tabular-nums">{caption.length} car.</span>
      </div>
    </div>
  )
}
