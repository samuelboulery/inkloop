'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { publishCampaign } from '../server/publishCampaign'

type Mode = 'now' | 'scheduled'

interface PublishingDialogProps {
  campaignId: string
  campaignName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function toIsoOrNull(localValue: string): string | null {
  if (!localValue) return null
  const date = new Date(localValue)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

export function PublishingDialog({
  campaignId,
  campaignName,
  open,
  onOpenChange,
}: PublishingDialogProps) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('now')
  const [scheduledAt, setScheduledAt] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [success, setSuccess] = useState<string | undefined>()
  const [isPending, startTransition] = useTransition()

  const resetAndClose = (next: boolean) => {
    if (!next) {
      setError(undefined)
      setSuccess(undefined)
      setMode('now')
      setScheduledAt('')
    }
    onOpenChange(next)
  }

  const handlePublish = () => {
    setError(undefined)
    setSuccess(undefined)

    const scheduledFor = mode === 'scheduled' ? toIsoOrNull(scheduledAt) : null
    if (mode === 'scheduled' && !scheduledFor) {
      setError('Date de planification invalide')
      return
    }

    startTransition(async () => {
      try {
        const result = await publishCampaign({ campaignId, scheduledFor })
        setSuccess(
          result.status === 'scheduled'
            ? `Campagne programmée (${result.eventIds.length} plateformes)`
            : `Campagne envoyée (${result.eventIds.length} plateformes)`,
        )
        router.refresh()
        setTimeout(() => resetAndClose(false), 1500)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Échec de la publication')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publier la campagne</DialogTitle>
          <DialogDescription>
            {campaignName} — choisissez le mode d&apos;envoi vers n8n.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label>Mode de publication</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === 'now' ? 'default' : 'outline'}
                onClick={() => setMode('now')}
              >
                Publier maintenant
              </Button>
              <Button
                type="button"
                variant={mode === 'scheduled' ? 'default' : 'outline'}
                onClick={() => setMode('scheduled')}
              >
                Programmer
              </Button>
            </div>
          </div>

          {mode === 'scheduled' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="scheduled-at">Date et heure</Label>
              <Input
                id="scheduled-at"
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {success && <p className="text-sm text-emerald-600">{success}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => resetAndClose(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button onClick={handlePublish} disabled={isPending}>
            {isPending ? 'Envoi…' : 'Confirmer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
