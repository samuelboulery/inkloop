'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { EditorialSkeleton } from '@/lib/schemas/campaign'

interface Props {
  skeleton: EditorialSkeleton | undefined
  onSubmit: (skeleton: EditorialSkeleton) => void
  onBack: () => void
  isLoading: boolean
}

const EMPTY_SKELETON: EditorialSkeleton = {
  angle: '',
  key_messages: [],
  content_type: '',
  tone: '',
}

export function StepSkeleton({ skeleton, onSubmit, onBack, isLoading }: Props) {
  const initial = skeleton ?? EMPTY_SKELETON
  const [angle, setAngle] = useState(initial.angle)
  const [keyMessages, setKeyMessages] = useState(initial.key_messages.join('\n'))
  const [contentType, setContentType] = useState(initial.content_type)
  const [tone, setTone] = useState(initial.tone ?? '')

  const isEmpty = !skeleton || (skeleton.angle === '' && skeleton.key_messages.length === 0)

  function handleSubmit() {
    const messages = keyMessages
      .split('\n')
      .map((m) => m.trim())
      .filter(Boolean)

    onSubmit({
      angle: angle.trim(),
      key_messages: messages,
      content_type: contentType.trim(),
      tone: tone.trim() || undefined,
    })
  }

  const canSubmit = angle.trim().length > 0 && contentType.trim().length > 0

  return (
    <div className="space-y-6">
      {isEmpty && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <p className="text-amber-400 text-sm font-medium">Squelette généré manuellement</p>
          <p className="text-amber-300/70 text-xs mt-1">
            L&apos;IA n&apos;est pas encore configurée. Remplissez le squelette éditorial
            manuellement.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label className="text-gray-300 text-sm">
            Angle éditorial <span className="text-red-400">*</span>
          </Label>
          <Input
            value={angle}
            onChange={(e) => setAngle(e.target.value)}
            placeholder="Ex : Comment notre association a transformé 200 vies en 2025"
            className="mt-1.5 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
          />
        </div>

        <div>
          <Label className="text-gray-300 text-sm">
            Messages clés <span className="text-gray-500 text-xs ml-1">(un par ligne)</span>
          </Label>
          <Textarea
            value={keyMessages}
            onChange={(e) => setKeyMessages(e.target.value)}
            placeholder={"Impact concret sur les bénéficiaires\nChiffres clés de l'année\nAppel à l'action"}
            className="mt-1.5 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 resize-none font-mono text-sm"
            rows={4}
          />
        </div>

        <div>
          <Label className="text-gray-300 text-sm">
            Type de contenu <span className="text-red-400">*</span>
          </Label>
          <Input
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            placeholder="Ex : Bilan annuel, Annonce événement, Témoignage…"
            className="mt-1.5 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
          />
        </div>

        <div>
          <Label className="text-gray-300 text-sm">
            Ton <span className="text-gray-500 text-xs ml-1">(optionnel)</span>
          </Label>
          <Input
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            placeholder="Ex : Chaleureux et inspirant, Professionnel, Engagé…"
            className="mt-1.5 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
          />
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          Retour
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isLoading}
          className="bg-indigo-600 hover:bg-indigo-500"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Génération du contenu…
            </span>
          ) : (
            'Approuver & générer'
          )}
        </Button>
      </div>
    </div>
  )
}
