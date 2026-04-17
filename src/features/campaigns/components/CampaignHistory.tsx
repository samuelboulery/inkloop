'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PublishingDialog } from '@/features/publishing/components/PublishingDialog'
import type { Campaign } from '@/types/database'

const STATUS_LABELS: Record<Campaign['status'], string> = {
  Draft: 'Brouillon',
  InProgress: 'En cours',
  Ready: 'Prêt',
  Sent: 'Envoyé',
}

const STATUS_VARIANTS: Record<Campaign['status'], 'secondary' | 'default' | 'outline' | 'destructive'> = {
  Draft: 'secondary',
  InProgress: 'outline',
  Ready: 'default',
  Sent: 'secondary',
}

interface CampaignCardProps {
  campaign: Campaign
  onOpen: (id: string) => void
  onPublish: (campaign: Campaign) => void
}

function CampaignCard({ campaign, onOpen, onPublish }: CampaignCardProps) {
  const platforms = Object.keys(campaign.generated_content as Record<string, unknown>)
  const canPublish = campaign.status === 'Ready' || campaign.status === 'InProgress'

  return (
    <Card
      className="bg-gray-800 border-gray-700 p-4 cursor-pointer hover:border-indigo-500/50 transition-colors"
      onClick={() => onOpen(campaign.id)}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-sm font-medium text-white truncate">{campaign.name}</h3>
        <Badge variant={STATUS_VARIANTS[campaign.status]} className="shrink-0 text-xs">
          {STATUS_LABELS[campaign.status]}
        </Badge>
      </div>

      {platforms.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mt-2">
          {platforms.map((p) => (
            <span key={p} className="text-xs text-gray-400 bg-gray-700/60 rounded px-1.5 py-0.5">
              {p}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-gray-500">
          {new Date(campaign.created_at).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
        {canPublish && (
          <Button
            size="xs"
            onClick={(event) => {
              event.stopPropagation()
              onPublish(campaign)
            }}
          >
            Publier
          </Button>
        )}
      </div>
    </Card>
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
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="text-gray-400 text-sm font-medium">Aucune campagne</p>
        <p className="text-gray-600 text-xs mt-1">Créez votre première campagne pour commencer.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
