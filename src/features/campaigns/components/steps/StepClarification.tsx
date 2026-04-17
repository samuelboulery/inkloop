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
      <div className="space-y-6">
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <p className="text-amber-400 text-sm font-medium">Service IA non disponible</p>
          <p className="text-amber-300/70 text-xs mt-1">
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
            className="bg-indigo-600 hover:bg-indigo-500"
          >
            Passer cette étape
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-gray-400 text-sm">
        Répondez aux questions suivantes pour aider l&apos;IA à mieux comprendre vos besoins.
      </p>

      <div className="space-y-5">
        {qa.map((item, i) => (
          <div key={i}>
            <Label className="text-gray-300 text-sm block mb-1.5">
              {i + 1}. {item.question}
            </Label>
            <Textarea
              value={answers[i] ?? ''}
              onChange={(e) => handleAnswerChange(i, e.target.value)}
              placeholder="Votre réponse…"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 resize-none"
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
          className="bg-indigo-600 hover:bg-indigo-500"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
