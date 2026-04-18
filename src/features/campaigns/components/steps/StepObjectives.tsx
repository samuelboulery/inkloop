'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const DEFAULT_TARGETS = [
  'Grand public',
  'Membres / Adhérents',
  'Bénévoles',
  'Partenaires',
  'Médias',
  'Jeunes (18-25 ans)',
  'Familles',
  'Donateurs',
  'Professionnels',
  'Institutions / Élus',
]

interface Props {
  initialObjectives: string
  initialAudience: string
  initialTargets: string[]
  initialKpis: string
  availableTargets?: string[]
  onSubmit: (input: {
    objectives: string
    audience: string
    targets: string[]
    kpis: string
  }) => void
  onBack: () => void
  isLoading: boolean
}

export function StepObjectives({
  initialObjectives,
  initialAudience,
  initialTargets,
  initialKpis,
  availableTargets,
  onSubmit,
  onBack,
  isLoading,
}: Props) {
  const targetList =
    availableTargets && availableTargets.length > 0 ? availableTargets : DEFAULT_TARGETS
  const [objectives, setObjectives] = useState(initialObjectives)
  const [audience, setAudience] = useState(initialAudience)
  const [targets, setTargets] = useState<string[]>(initialTargets)
  const [kpis, setKpis] = useState(initialKpis)

  const canSubmit = objectives.trim().length > 0 && targets.length > 0

  function toggleTarget(target: string) {
    setTargets((prev) =>
      prev.includes(target) ? prev.filter((t) => t !== target) : [...prev, target],
    )
  }

  function handleSubmit() {
    onSubmit({
      objectives: objectives.trim(),
      audience: audience.trim(),
      targets,
      kpis: kpis.trim(),
    })
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <p className="text-sm text-muted-foreground">
        Précisez les objectifs, les cibles et les indicateurs de réussite. Ces éléments guideront la
        génération IA et l&apos;évaluation de la campagne.
      </p>

      <div className="space-y-5">
        <div>
          <Label className="text-meta text-muted-foreground block mb-1.5">
            Objectifs <span className="text-destructive">*</span>
          </Label>
          <Textarea
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
            placeholder="Ex. informer sur le nouvel atelier, recruter 15 participants, renforcer la notoriété locale…"
            rows={3}
            className="resize-none"
          />
        </div>

        <div>
          <Label className="text-meta text-muted-foreground block mb-1.5">
            Cibles visées <span className="text-destructive">*</span>
          </Label>
          <p className="text-[11px] mb-2.5 text-muted-foreground">
            Sélectionnez une ou plusieurs cibles. Vous pouvez en ajouter plusieurs.
          </p>
          <div className="flex flex-wrap gap-2">
            {targetList.map((target) => {
              const selected = targets.includes(target)
              return (
                <button
                  key={target}
                  type="button"
                  onClick={() => toggleTarget(target)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 active:scale-95 select-none cursor-pointer ${
                    selected
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground'
                  }`}
                >
                  {selected && <span className="mr-1 opacity-70">✓</span>}
                  {target}
                </button>
              )
            })}
          </div>
          {targets.length > 0 && (
            <p className="text-[11px] mt-2 text-muted-foreground">
              {targets.length} cible{targets.length > 1 ? 's' : ''} sélectionnée
              {targets.length > 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div>
          <Label className="text-meta text-muted-foreground block mb-1.5">
            Précisions sur l&apos;audience
          </Label>
          <Textarea
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="Ex. familles du quartier avec enfants 6-12 ans, bénévoles disponibles le week-end…"
            rows={2}
            className="resize-none"
          />
          <p className="text-[11px] mt-1 text-muted-foreground">
            Optionnel. Apportez des précisions contextuelles sur votre audience.
          </p>
        </div>

        <div>
          <Label className="text-meta text-muted-foreground block mb-1.5">
            Indicateurs de réussite (KPIs)
          </Label>
          <Input
            value={kpis}
            onChange={(e) => setKpis(e.target.value)}
            placeholder="Ex. 500 impressions, 30 inscriptions, 10% de taux d'engagement"
          />
          <p className="text-[11px] mt-1 text-muted-foreground">
            Optionnel. Séparez plusieurs indicateurs par des virgules.
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          Retour
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading || !canSubmit}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
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
