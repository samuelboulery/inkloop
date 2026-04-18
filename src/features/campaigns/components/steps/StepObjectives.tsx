'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  initialObjectives: string
  initialAudience: string
  initialKpis: string
  onSubmit: (input: { objectives: string; audience: string; kpis: string }) => void
  onBack: () => void
  isLoading: boolean
}

export function StepObjectives({
  initialObjectives,
  initialAudience,
  initialKpis,
  onSubmit,
  onBack,
  isLoading,
}: Props) {
  const [objectives, setObjectives] = useState(initialObjectives)
  const [audience, setAudience] = useState(initialAudience)
  const [kpis, setKpis] = useState(initialKpis)

  const canSubmit = objectives.trim().length > 0 && audience.trim().length > 0

  function handleSubmit() {
    onSubmit({
      objectives: objectives.trim(),
      audience: audience.trim(),
      kpis: kpis.trim(),
    })
  }

  return (
    <div className="space-y-6">
      <p className="text-sm" style={{ color: 'hsl(215, 12%, 50%)' }}>
        Précisez les objectifs, l&apos;audience cible et les indicateurs de réussite. Ces éléments
        guideront la génération IA et l&apos;évaluation de la campagne.
      </p>

      <div className="space-y-5">
        <div>
          <Label className="text-sm block mb-1.5" style={{ color: 'hsl(210, 20%, 94%)' }}>
            Objectifs <span style={{ color: 'hsl(0, 70%, 65%)' }}>*</span>
          </Label>
          <Textarea
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
            placeholder="Ex. informer sur le nouvel atelier, recruter 15 participants, renforcer la notoriété locale…"
            rows={3}
            className="resize-none"
            style={{
              background: 'hsl(222, 18%, 14%)',
              borderColor: 'hsl(222, 15%, 22%)',
              color: 'hsl(210, 20%, 94%)',
            }}
          />
        </div>

        <div>
          <Label className="text-sm block mb-1.5" style={{ color: 'hsl(210, 20%, 94%)' }}>
            Audience cible <span style={{ color: 'hsl(0, 70%, 65%)' }}>*</span>
          </Label>
          <Textarea
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="Ex. familles du quartier, étudiants 18-25 ans, bénévoles potentiels…"
            rows={2}
            className="resize-none"
            style={{
              background: 'hsl(222, 18%, 14%)',
              borderColor: 'hsl(222, 15%, 22%)',
              color: 'hsl(210, 20%, 94%)',
            }}
          />
        </div>

        <div>
          <Label className="text-sm block mb-1.5" style={{ color: 'hsl(210, 20%, 94%)' }}>
            Indicateurs de réussite (KPIs)
          </Label>
          <Input
            value={kpis}
            onChange={(e) => setKpis(e.target.value)}
            placeholder="Ex. 500 impressions, 30 inscriptions, 10% de taux d'engagement"
            style={{
              background: 'hsl(222, 18%, 14%)',
              borderColor: 'hsl(222, 15%, 22%)',
              color: 'hsl(210, 20%, 94%)',
            }}
          />
          <p className="text-[11px] mt-1" style={{ color: 'hsl(215, 12%, 38%)' }}>
            Optionnel. Séparez plusieurs indicateurs par des virgules.
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          Retour
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !canSubmit}
          style={{
            background: 'hsl(235, 80%, 62%)',
            color: '#fff',
          }}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Génération des questions…
            </span>
          ) : (
            'Suivant'
          )}
        </Button>
      </div>
    </div>
  )
}
