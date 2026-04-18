'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getTemplates } from '@/features/templates/server/getTemplates'
import type { Template } from '@/types/database'

interface TemplateField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'url'
  required?: boolean
  placeholder?: string
}

function parseFields(raw: unknown): TemplateField[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (f): f is TemplateField =>
      typeof f === 'object' && f !== null && typeof (f as TemplateField).name === 'string',
  )
}

interface Props {
  workspaceId: string
  onSubmit: (template: Template, name: string, rawData: Record<string, unknown>) => void
  isLoading: boolean
}

export function StepTemplateSelect({ workspaceId, onSubmit, isLoading }: Props) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [selected, setSelected] = useState<Template | null>(null)
  const [name, setName] = useState('')
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})

  useEffect(() => {
    getTemplates(workspaceId)
      .then(setTemplates)
      .catch(() => setTemplates([]))
      .finally(() => setLoadingTemplates(false))
  }, [workspaceId])

  const fields = selected ? parseFields(selected.fields) : []
  const canSubmit =
    selected !== null &&
    name.trim().length > 0 &&
    fields.filter((f) => f.required).every((f) => fieldValues[f.name]?.trim())

  function handleSubmit() {
    if (!selected || !canSubmit) return
    const rawData: Record<string, unknown> = { ...fieldValues }
    onSubmit(selected, name.trim(), rawData)
  }

  function handleFieldChange(fieldName: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [fieldName]: value }))
  }

  if (loadingTemplates) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12 animate-fade-up">
        <p className="text-sm text-muted-foreground">Aucun template disponible pour ce workspace.</p>
        <p className="text-xs mt-1 text-muted-foreground/70">
          Créez d&apos;abord un template dans les paramètres.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <Label className="text-sm block mb-3 text-foreground">Choisir un template</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {templates.map((t) => {
            const isSelected = selected?.id === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelected(t)
                  setFieldValues({})
                }}
                className={`text-left p-3 rounded-lg transition-all duration-150 border ${
                  isSelected
                    ? 'border-foreground bg-secondary'
                    : 'border-border bg-surface-1 hover:border-foreground/30'
                }`}
              >
                <p className="text-sm font-medium text-foreground">{t.name}</p>
                {t.description && (
                  <p className="text-xs mt-0.5 line-clamp-2 text-muted-foreground">{t.description}</p>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {selected && (
        <div className="space-y-4 animate-fade-up">
          <div>
            <Label htmlFor="campaign-name" className="text-sm text-foreground">
              Nom de la campagne <span className="text-destructive">*</span>
            </Label>
            <Input
              id="campaign-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Lancement printemps 2026"
              className="mt-1.5 bg-surface-1 border-border text-foreground transition-colors duration-200"
            />
          </div>

          {fields.map((field) => (
            <div key={field.name}>
              <Label htmlFor={field.name} className="text-sm text-foreground">
                {field.label}
                {field.required && <span className="ml-1 text-destructive">*</span>}
              </Label>
              {field.type === 'textarea' ? (
                <Textarea
                  id={field.name}
                  value={fieldValues[field.name] ?? ''}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="mt-1.5 bg-surface-1 border-border text-foreground resize-none transition-colors duration-200"
                  rows={3}
                />
              ) : (
                <Input
                  id={field.name}
                  type={field.type === 'url' ? 'url' : 'text'}
                  value={fieldValues[field.name] ?? ''}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="mt-1.5 bg-surface-1 border-border text-foreground transition-colors duration-200"
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isLoading}
          className="active:scale-[0.98]"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Création…
            </span>
          ) : (
            'Suivant'
          )}
        </Button>
      </div>
    </div>
  )
}
