'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PublishingDialog } from '@/features/publishing/components/PublishingDialog'
import { LayoutGridIcon } from 'lucide-react'
import type { Campaign } from '@/types/database'

const STATUS_CONFIG: Record<Campaign['status'], { label: string; className: string }> = {
  Draft: {
    label: 'Brouillon',
    className: 'text-muted-foreground bg-muted',
  },
  InProgress: {
    label: 'En cours',
    className: 'text-foreground bg-status-progress/15',
  },
  Ready: {
    label: 'Prêt',
    className: 'text-foreground bg-status-ready/20',
  },
  Sent: {
    label: 'Envoyé',
    className: 'text-background bg-foreground',
  },
}

interface CampaignCardProps {
  campaign: Campaign
  onOpen: (id: string) => void
  onPublish: (campaign: Campaign) => void
  index: number
}

function CampaignCard({ campaign, onOpen, onPublish, index }: CampaignCardProps) {
  const platforms = Object.keys(campaign.generated_content as Record<string, unknown>)
  const canPublish = campaign.status === 'Ready' || campaign.status === 'InProgress'
  const status = STATUS_CONFIG[campaign.status]

  const staggerClass = index < 5 ? `stagger-${Math.min(index + 1, 5) as 1 | 2 | 3 | 4 | 5}` : ''

  return (
    <div
      className={`group rounded-xl p-5 cursor-pointer transition-all duration-200 hover:-translate-y-[2px] hover:border-foreground/20 hover:shadow-sm bg-background border border-border animate-fade-up ${staggerClass}`}
      onClick={() => onOpen(campaign.id)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-medium leading-snug truncate text-foreground">
          {campaign.name}
        </h3>
        <span
          className={`text-meta px-2 py-0.5 rounded-full shrink-0 ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      {platforms.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-3">
          {platforms.map((p) => (
            <span
              key={p}
              className="text-[11px] px-2 py-0.5 rounded-md text-muted-foreground bg-surface-1 border border-border"
            >
              {p}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-1">
        <p className="text-meta text-muted-foreground">
          {new Date(campaign.created_at).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
        {canPublish && (
          <Button
            size="xs"
            className="h-7 px-3 text-[11px] font-medium rounded-md transition-transform duration-200 hover:scale-[1.02]"
            onClick={(event) => {
              event.stopPropagation()
              onPublish(campaign)
            }}
          >
            Publier
          </Button>
        )}
      </div>
    </div>
  )
}

export function CampaignHistory({
  campaigns,
  onOpenCampaign,
}: {
  campaigns: Campaign[]
  onOpenCampaign: (id: string) => void
}) {
  const [publishTarget, setPublishTarget] = useState<Campaign | null>(null)

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-up">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-muted border border-border">
          <LayoutGridIcon className="w-5 h-5 text-muted-foreground/60" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Aucune campagne</p>
        <p className="text-xs mt-1 text-muted-foreground/70">
          Créez votre première campagne pour commencer.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {campaigns.map((c, i) => (
          <CampaignCard
            key={c.id}
            campaign={c}
            onOpen={onOpenCampaign}
            onPublish={setPublishTarget}
            index={i}
          />
        ))}
      </div>

      {publishTarget && (
        <PublishingDialog
          campaignId={publishTarget.id}
          campaignName={publishTarget.name}
          open={publishTarget !== null}
          onOpenChange={(open) => {
            if (!open) setPublishTarget(null)
          }}
        />
      )}
    </>
  )
}
