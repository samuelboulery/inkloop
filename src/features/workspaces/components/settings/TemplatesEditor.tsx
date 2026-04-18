'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Template } from '@/types/database'
import type { TemplateField } from '@/lib/schemas/template'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SettingsPanel } from './SettingsPanel'
import { theme } from '@/lib/ui/theme'
import { PlusIcon, Trash2Icon, PencilIcon, SaveIcon, XIcon } from 'lucide-react'
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '@/features/templates/server/templateActions'

const FIELD_TYPES: TemplateField['type'][] = ['text', 'textarea', 'date', 'url', 'select', 'multiselect']

interface TemplatesEditorProps {
  workspaceId: string
  templates: Template[]
}

interface DraftState {
  id?: string
  name: string
  description: string
  fields: TemplateField[]
}

const EMPTY_DRAFT: DraftState = {
  name: '',
  description: '',
  fields: [{ name: 'title', label: 'Titre', type: 'text', required: true }],
}

function parseFields(raw: unknown): TemplateField[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((f): f is TemplateField => {
    if (!f || typeof f !== 'object') return false
    const obj = f as Record<string, unknown>
    return typeof obj.name === 'string' && typeof obj.label === 'string' && typeof obj.type === 'string'
  })
}

export function TemplatesEditor({ workspaceId, templates }: TemplatesEditorProps) {
  const router = useRouter()
  const [draft, setDraft] = useState<DraftState | null>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function openCreate() {
    setError(null)
    setDraft(EMPTY_DRAFT)
  }

  function openEdit(template: Template) {
    setError(null)
    setDraft({
      id: template.id,
      name: template.name,
      description: template.description ?? '',
      fields: parseFields(template.fields),
    })
  }

  function closeDraft() {
    setDraft(null)
    setError(null)
  }

  function updateField(index: number, patch: Partial<TemplateField>) {
    if (!draft) return
    const next = draft.fields.map((f, i) => (i === index ? { ...f, ...patch } : f))
    setDraft({ ...draft, fields: next })
  }

  function addField() {
    if (!draft) return
    setDraft({
      ...draft,
      fields: [
        ...draft.fields,
        { name: `field_${draft.fields.length + 1}`, label: 'Nouveau champ', type: 'text', required: false },
      ],
    })
  }

  function removeField(index: number) {
    if (!draft) return
    setDraft({ ...draft, fields: draft.fields.filter((_, i) => i !== index) })
  }

  function handleSave() {
    if (!draft) return
    setError(null)
    startTransition(async () => {
      try {
        if (draft.id) {
          await updateTemplate({
            id: draft.id,
            workspace_id: workspaceId,
            name: draft.name,
            description: draft.description || null,
            fields: draft.fields,
          })
        } else {
          await createTemplate({
            workspace_id: workspaceId,
            name: draft.name,
            description: draft.description || null,
            fields: draft.fields,
          })
        }
        setDraft(null)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur')
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Supprimer ce template ?')) return
    setError(null)
    startTransition(async () => {
      try {
        await deleteTemplate({ id, workspaceId })
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur')
      }
    })
  }

  return (
    <SettingsPanel
      title="Templates de campagne"
      description="Structure des champs demandés au début de chaque campagne."
      actions={
        !draft && (
          <Button
            type="button"
            onClick={openCreate}
            className="h-8 text-xs font-medium gap-1.5 px-3"
            style={{ background: theme.ACCENT, color: '#fff', border: 'none' }}
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Nouveau
          </Button>
        )
      }
    >
      {draft ? (
        <DraftForm
          draft={draft}
          pending={pending}
          error={error}
          onChange={setDraft}
          onSave={handleSave}
          onCancel={closeDraft}
          onAddField={addField}
          onUpdateField={updateField}
          onRemoveField={removeField}
        />
      ) : templates.length === 0 ? (
        <p className="text-xs" style={{ color: theme.TEXT_MUTED }}>
          Aucun template. Créez-en un pour démarrer une campagne.
        </p>
      ) : (
        <div className="space-y-2">
          {templates.map((template) => {
            const fields = parseFields(template.fields)
            return (
              <div
                key={template.id}
                className="flex items-start gap-3 px-3.5 py-3 rounded-md"
                style={{ background: theme.BG, border: `1px solid ${theme.BORDER}` }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: theme.TEXT }}>
                    {template.name}
                  </p>
                  {template.description && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: theme.TEXT_MUTED }}>
                      {template.description}
                    </p>
                  )}
                  <p className="text-[11px] mt-1" style={{ color: theme.TEXT_MUTED }}>
                    {fields.length} champ{fields.length > 1 ? 's' : ''} — {fields.map((f) => f.label).join(' · ')}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(template)}
                    className="p-1.5 rounded-md hover:bg-white/5"
                    aria-label="Modifier"
                  >
                    <PencilIcon className="w-3.5 h-3.5" style={{ color: theme.TEXT_MUTED }} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(template.id)}
                    className="p-1.5 rounded-md hover:bg-white/5"
                    aria-label="Supprimer"
                  >
                    <Trash2Icon className="w-3.5 h-3.5" style={{ color: theme.DANGER }} />
                  </button>
                </div>
              </div>
            )
          })}
          {error && (
            <p className="text-xs mt-2" style={{ color: theme.DANGER }}>
              {error}
            </p>
          )}
        </div>
      )}
    </SettingsPanel>
  )
}

interface DraftFormProps {
  draft: DraftState
  pending: boolean
  error: string | null
  onChange: (draft: DraftState) => void
  onSave: () => void
  onCancel: () => void
  onAddField: () => void
  onUpdateField: (index: number, patch: Partial<TemplateField>) => void
  onRemoveField: (index: number) => void
}

function DraftForm({
  draft,
  pending,
  error,
  onChange,
  onSave,
  onCancel,
  onAddField,
  onUpdateField,
  onRemoveField,
}: DraftFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-medium" style={{ color: theme.TEXT_MUTED }}>
          Nom du template
        </Label>
        <Input
          value={draft.name}
          onChange={(e) => onChange({ ...draft, name: e.target.value })}
          placeholder="Ex : Annonce d'événement"
          className="mt-1.5 h-9 text-sm"
          style={{ background: theme.BG, border: `1px solid ${theme.BORDER}`, color: theme.TEXT }}
        />
      </div>
      <div>
        <Label className="text-xs font-medium" style={{ color: theme.TEXT_MUTED }}>
          Description
        </Label>
        <Textarea
          value={draft.description}
          onChange={(e) => onChange({ ...draft, description: e.target.value })}
          placeholder="À quoi sert ce template ?"
          className="mt-1.5 min-h-[60px] text-sm"
          style={{ background: theme.BG, border: `1px solid ${theme.BORDER}`, color: theme.TEXT }}
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium" style={{ color: theme.TEXT_MUTED }}>
            Champs ({draft.fields.length})
          </Label>
          <button
            type="button"
            onClick={onAddField}
            className="text-xs font-medium flex items-center gap-1 hover:underline"
            style={{ color: theme.ACCENT }}
          >
            <PlusIcon className="w-3 h-3" />
            Ajouter
          </button>
        </div>
        <div className="space-y-2 mt-2">
          {draft.fields.map((field, index) => (
            <FieldRow
              key={index}
              field={field}
              index={index}
              onUpdate={onUpdateField}
              onRemove={onRemoveField}
            />
          ))}
        </div>
      </div>

      {error && (
        <p className="text-xs" style={{ color: theme.DANGER }}>
          {error}
        </p>
      )}

      <div className="flex items-center gap-2 pt-2">
        <Button
          type="button"
          onClick={onSave}
          disabled={pending || !draft.name.trim() || draft.fields.length === 0}
          className="h-8 text-xs font-medium gap-1.5 px-4"
          style={{ background: theme.ACCENT, color: '#fff', border: 'none' }}
        >
          <SaveIcon className="w-3.5 h-3.5" />
          {pending ? 'Enregistrement…' : draft.id ? 'Enregistrer' : 'Créer'}
        </Button>
        <Button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="h-8 text-xs font-medium gap-1.5 px-3"
          style={{ background: theme.BG, border: `1px solid ${theme.BORDER}`, color: theme.TEXT }}
        >
          <XIcon className="w-3.5 h-3.5" />
          Annuler
        </Button>
      </div>
    </div>
  )
}

interface FieldRowProps {
  field: TemplateField
  index: number
  onUpdate: (index: number, patch: Partial<TemplateField>) => void
  onRemove: (index: number) => void
}

function FieldRow({ field, index, onUpdate, onRemove }: FieldRowProps) {
  const needsOptions = field.type === 'select' || field.type === 'multiselect'
  return (
    <div
      className="px-3 py-3 rounded-md space-y-2"
      style={{ background: theme.BG, border: `1px solid ${theme.BORDER}` }}
    >
      <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center">
        <Input
          value={field.name}
          onChange={(e) => onUpdate(index, { name: e.target.value })}
          placeholder="identifiant"
          className="h-8 text-xs"
          style={{ background: theme.SURFACE, border: `1px solid ${theme.BORDER}`, color: theme.TEXT }}
        />
        <Input
          value={field.label}
          onChange={(e) => onUpdate(index, { label: e.target.value })}
          placeholder="Libellé visible"
          className="h-8 text-xs"
          style={{ background: theme.SURFACE, border: `1px solid ${theme.BORDER}`, color: theme.TEXT }}
        />
        <select
          value={field.type}
          onChange={(e) => onUpdate(index, { type: e.target.value as TemplateField['type'] })}
          className="h-8 text-xs px-2 rounded-md"
          style={{ background: theme.SURFACE, border: `1px solid ${theme.BORDER}`, color: theme.TEXT }}
        >
          {FIELD_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="p-1.5 rounded-md hover:bg-white/5"
          aria-label="Retirer le champ"
        >
          <Trash2Icon className="w-3.5 h-3.5" style={{ color: theme.DANGER }} />
        </button>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
        <Input
          value={field.placeholder ?? ''}
          onChange={(e) => onUpdate(index, { placeholder: e.target.value || undefined })}
          placeholder="Placeholder (optionnel)"
          className="h-8 text-xs"
          style={{ background: theme.SURFACE, border: `1px solid ${theme.BORDER}`, color: theme.TEXT }}
        />
        <label className="flex items-center gap-1.5 text-xs" style={{ color: theme.TEXT_MUTED }}>
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onUpdate(index, { required: e.target.checked })}
          />
          Obligatoire
        </label>
      </div>
      {needsOptions && (
        <Input
          value={(field.options ?? []).join(', ')}
          onChange={(e) =>
            onUpdate(index, {
              options: e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="Options séparées par une virgule"
          className="h-8 text-xs"
          style={{ background: theme.SURFACE, border: `1px solid ${theme.BORDER}`, color: theme.TEXT }}
        />
      )}
    </div>
  )
}
