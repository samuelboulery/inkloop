'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PublishingDialog } from '@/features/publishing/components/PublishingDialog'
import type { Campaign } from '@/types/database'

const STATUS_CONFIG: Record<Campaign['status'], { label: string; color: string; bg: string }> = {
  Draft: {
    label: 'Brouillon',
    color: 'hsl(215, 12%, 50%)',
    bg: 'hsl(215, 15%, 16%)',
  },
  InProgress: {
    label: 'En cours',
    color: 'hsl(38, 90%, 65%)',
    bg: 'hsl(38, 80%, 18%)',
  },
  Ready: {
    label: 'Prêt',
    color: 'hsl(145, 65%, 60%)',
    bg: 'hsl(145, 50%, 14%)',
  },
  Sent: {
    label: 'Envoyé',
    color: 'hsl(235, 80%, 72%)',
    bg: 'hsl(235, 60%, 18%)',
  },
}

interface CampaignCardProps {
  campaign: Campaign
  onOpen: (id: string) => void
  onPublish: (campaign: Campaign) => void
}

function CampaignCard({ campaign, onOpen, onPublish }: CampaignCardProps) {
  const platforms = Object.keys(campaign.generated_content as Record<string, unknown>)
  const canPublish = campaign.status === 'Ready' || campaign.status === 'InProgress'
  const status = STATUS_CONFIG[campaign.status]

  return (
    <div
      className="group rounded-xl p-5 cursor-pointer transition-all duration-150 hover:translate-y-[-1px]"
      style={{
        background: 'hsl(222, 18%, 12%)',
        border: '1px solid hsl(222, 15%, 19%)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'hsl(222, 15%, 26%)'
        e.currentTarget.style.boxShadow = '0 4px 20px hsl(222, 20%, 5%, 0.4)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'hsl(222, 15%, 19%)'
        e.currentTarget.style.boxShadow = 'none'
      }}
      onClick={() => onOpen(campaign.id)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-medium leading-snug truncate" style={{ color: 'hsl(210, 20%, 90%)' }}>
          {campaign.name}
        </h3>
        <span
          className="text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0"
          style={{ color: status.color, background: status.bg }}
        >
          {status.label}
        </span>
      </div>

      {platforms.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-3">
          {platforms.map((p) => (
            <span
              key={p}
              className="text-[11px] px-2 py-0.5 rounded-md"
              style={{
                color: 'hsl(215, 12%, 48%)',
                background: 'hsl(222, 18%, 8%)',
                border: '1px solid hsl(222, 15%, 16%)',
              }}
            >
              {p}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-1">
        <p className="text-[11px]" style={{ color: 'hsl(215, 12%, 38%)' }}>
          {new Date(campaign.created_at).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
        {canPublish && (
          <Button
            size="xs"
            className="h-7 px-3 text-[11px] font-medium rounded-md transition-all hover:scale-[1.02]"
            style={{
              background: 'hsl(235, 60%, 20%)',
              color: 'hsl(235, 90%, 78%)',
              border: '1px solid hsl(235, 60%, 28%)',
            }}
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
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
          style={{ background: 'hsl(222, 18%, 14%)', border: '1px solid hsl(222, 15%, 20%)' }}
        >
          <svg className="w-5 h-5" style={{ color: 'hsl(215, 12%, 38%)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="text-sm font-medium" style={{ color: 'hsl(215, 12%, 45%)' }}>Aucune campagne</p>
        <p className="text-xs mt-1" style={{ color: 'hsl(215, 10%, 30%)' }}>Créez votre première campagne pour commencer.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {campaigns.map((c) => (
          <CampaignCard
            key={c.id}
            campaign={c}
            onOpen={onOpenCampaign}
            onPublish={setPublishTarget}
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
