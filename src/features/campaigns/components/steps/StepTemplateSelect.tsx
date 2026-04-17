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
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-sm">Aucun template disponible pour ce workspace.</p>
        <p className="text-gray-600 text-xs mt-1">
          Créez d&apos;abord un template dans les paramètres.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-gray-300 text-sm mb-3 block">Choisir un template</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setSelected(t)
                setFieldValues({})
              }}
              className={`text-left p-3 rounded-lg border transition-colors ${
                selected?.id === t.id
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-gray-700 bg-gray-800 hover:border-gray-600'
              }`}
            >
              <p className="text-sm font-medium text-white">{t.name}</p>
              {t.description && (
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{t.description}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="campaign-name" className="text-gray-300 text-sm">
              Nom de la campagne <span className="text-red-400">*</span>
            </Label>
            <Input
              id="campaign-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Lancement printemps 2026"
              className="mt-1.5 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          {fields.map((field) => (
            <div key={field.name}>
              <Label htmlFor={field.name} className="text-gray-300 text-sm">
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </Label>
              {field.type === 'textarea' ? (
                <Textarea
                  id={field.name}
                  value={fieldValues[field.name] ?? ''}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="mt-1.5 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 resize-none"
                  rows={3}
                />
              ) : (
                <Input
                  id={field.name}
                  type={field.type === 'url' ? 'url' : 'text'}
                  value={fieldValues[field.name] ?? ''}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="mt-1.5 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
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
          className="bg-indigo-600 hover:bg-indigo-500"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
