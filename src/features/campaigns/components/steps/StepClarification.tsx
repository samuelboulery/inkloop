'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { ClarificationQA } from '@/lib/schemas/campaign'

interface Props {
  qa: ClarificationQA[]
  onSubmit: (qa: ClarificationQA[]) => void
  onBack: () => void
  isLoading: boolean
}

export function StepClarification({ qa, onSubmit, onBack, isLoading }: Props) {
  const [answers, setAnswers] = useState<Record<number, string>>(
    Object.fromEntries(qa.map((item, i) => [i, item.answer])),
  )

  function handleAnswerChange(index: number, value: string) {
    setAnswers((prev) => ({ ...prev, [index]: value }))
  }

  function handleSubmit() {
    const updated: ClarificationQA[] = qa.map((item, i) => ({
      ...item,
      answer: answers[i] ?? '',
    }))
    onSubmit(updated)
  }

  if (qa.length === 0) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div className="rounded-lg px-4 py-3 bg-status-progress/10 border border-status-progress/25">
          <p className="text-sm font-medium text-foreground">Service IA non disponible</p>
          <p className="text-xs mt-1 text-muted-foreground">
            Les questions de clarification seront générées automatiquement en Phase 5. Vous pouvez
            passer cette étape.
          </p>
        </div>
        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={onBack} disabled={isLoading}>
            Retour
          </Button>
          <Button
            onClick={() => onSubmit([])}
            disabled={isLoading}
            className="active:scale-[0.98]"
          >
            Passer cette étape
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <p className="text-sm text-muted-foreground">
        Répondez aux questions suivantes pour aider l&apos;IA à mieux comprendre vos besoins.
      </p>

      <div className="space-y-5">
        {qa.map((item, i) => (
          <div key={i}>
            <Label className="text-sm block mb-1.5 text-foreground">
              {i + 1}. {item.question}
            </Label>
            <Textarea
              value={answers[i] ?? ''}
              onChange={(e) => handleAnswerChange(i, e.target.value)}
              placeholder="Votre réponse…"
              className="bg-surface-1 border-border text-foreground resize-none transition-colors duration-200"
              rows={2}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          Retour
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="active:scale-[0.98]"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Génération du squelette…
            </span>
          ) : (
            'Suivant'
          )}
        </Button>
      </div>
    </div>
  )
}
