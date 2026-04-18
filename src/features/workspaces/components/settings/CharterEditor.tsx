'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { upsertCharter } from '@/features/charters/server/charterActions'
import {
  VocabularyRulesSchema,
  ContentRulesSchema,
  type VocabularyRules,
  type ContentRules,
} from '@/lib/schemas/charter'
import type { EditorialCharter } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SettingsPanel } from './SettingsPanel'
import { theme } from '@/lib/ui/theme'
import { PlusIcon, XIcon } from 'lucide-react'

interface CharterEditorProps {
  workspaceId: string
  charter: EditorialCharter | null
}

interface CharterFormState {
  tone_guidelines: string
  brand_guidelines: string
  vocabulary_rules: VocabularyRules
  content_rules: ContentRules
}

function parseVocabulary(raw: unknown): VocabularyRules {
  const result = VocabularyRulesSchema.safeParse(raw)
  return result.success ? result.data : { forbidden: [], preferred: {} }
}

function parseContent(raw: unknown): ContentRules {
  const result = ContentRulesSchema.safeParse(raw)
  return result.success ? result.data : { allowed_topics: [], forbidden_topics: [] }
}

function initialState(charter: EditorialCharter | null): CharterFormState {
  return {
    tone_guidelines: charter?.tone_guidelines ?? '',
    brand_guidelines: charter?.brand_guidelines ?? '',
    vocabulary_rules: parseVocabulary(charter?.vocabulary_rules),
    content_rules: parseContent(charter?.content_rules),
  }
}

export function CharterEditor({ workspaceId, charter }: CharterEditorProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [state, setState] = useState<CharterFormState>(() => initialState(charter))
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSave() {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      try {
        await upsertCharter({
          workspace_id: workspaceId,
          tone_guidelines: state.tone_guidelines.trim() || null,
          brand_guidelines: state.brand_guidelines.trim() || null,
          vocabulary_rules: state.vocabulary_rules,
          content_rules: state.content_rules,
        })
        setSuccess(true)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur')
      }
    })
  }

  return (
    <div className="space-y-5">
      <SettingsPanel
        title="Ton & voix"
        description="Lignes directrices éditoriales et guidelines de marque."
      >
        <div className="space-y-5">
          <div>
            <Label className="text-xs font-medium" style={{ color: theme.TEXT_MUTED }}>
              Ton de la voix
            </Label>
            <Textarea
              value={state.tone_guidelines}
              onChange={(e) => setState({ ...state, tone_guidelines: e.target.value })}
              placeholder="Ex : bienveillant, direct, expert mais accessible…"
              rows={4}
              className="mt-1.5 text-sm"
              style={{
                background: theme.BG,
                border: `1px solid ${theme.BORDER}`,
                color: theme.TEXT,
              }}
            />
          </div>

          <div>
            <Label className="text-xs font-medium" style={{ color: theme.TEXT_MUTED }}>
              Guidelines de marque
            </Label>
            <Textarea
              value={state.brand_guidelines}
              onChange={(e) => setState({ ...state, brand_guidelines: e.target.value })}
              placeholder="Positionnement, valeurs, références visuelles…"
              rows={4}
              className="mt-1.5 text-sm"
              style={{
                background: theme.BG,
                border: `1px solid ${theme.BORDER}`,
                color: theme.TEXT,
              }}
            />
          </div>
        </div>
      </SettingsPanel>

      <SettingsPanel
        title="Vocabulaire"
        description="Mots interdits et substitutions préférées."
      >
        <div className="space-y-5">
          <TagListEditor
            label="Mots interdits"
            placeholder="Ex : synergie"
            values={state.vocabulary_rules.forbidden}
            onChange={(forbidden) =>
              setState({
                ...state,
                vocabulary_rules: { ...state.vocabulary_rules, forbidden },
              })
            }
          />
          <PreferredMapEditor
            preferred={state.vocabulary_rules.preferred}
            onChange={(preferred) =>
              setState({
                ...state,
                vocabulary_rules: { ...state.vocabulary_rules, preferred },
              })
            }
          />
        </div>
      </SettingsPanel>

      <SettingsPanel
        title="Règles de contenu"
        description="Contraintes de longueur et sujets autorisés."
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium" style={{ color: theme.TEXT_MUTED }}>
                Longueur minimale
              </Label>
              <Input
                type="number"
                min={1}
                value={state.content_rules.min_length ?? ''}
                onChange={(e) =>
                  setState({
                    ...state,
                    content_rules: {
                      ...state.content_rules,
                      min_length: e.target.value ? Number(e.target.value) : undefined,
                    },
                  })
                }
                className="mt-1.5 h-9 text-sm"
                style={{
                  background: theme.BG,
                  border: `1px solid ${theme.BORDER}`,
                  color: theme.TEXT,
                }}
              />
            </div>
            <div>
              <Label className="text-xs font-medium" style={{ color: theme.TEXT_MUTED }}>
                Longueur maximale
              </Label>
              <Input
                type="number"
                min={1}
                value={state.content_rules.max_length ?? ''}
                onChange={(e) =>
                  setState({
                    ...state,
                    content_rules: {
                      ...state.content_rules,
                      max_length: e.target.value ? Number(e.target.value) : undefined,
                    },
                  })
                }
                className="mt-1.5 h-9 text-sm"
                style={{
                  background: theme.BG,
                  border: `1px solid ${theme.BORDER}`,
                  color: theme.TEXT,
                }}
              />
            </div>
          </div>

          <TagListEditor
            label="Sujets autorisés"
            placeholder="Ex : innovation"
            values={state.content_rules.allowed_topics}
            onChange={(allowed_topics) =>
              setState({
                ...state,
                content_rules: { ...state.content_rules, allowed_topics },
              })
            }
          />
          <TagListEditor
            label="Sujets interdits"
            placeholder="Ex : politique"
            values={state.content_rules.forbidden_topics}
            onChange={(forbidden_topics) =>
              setState({
                ...state,
                content_rules: { ...state.content_rules, forbidden_topics },
              })
            }
          />
        </div>

        <div className="flex items-center gap-3 mt-6">
          <Button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="h-8 text-xs font-medium px-4"
            style={{ background: theme.ACCENT, color: '#fff', border: 'none' }}
          >
            {pending ? 'Sauvegarde…' : 'Sauvegarder la charte'}
          </Button>
          {error && <span className="text-xs" style={{ color: theme.DANGER }}>{error}</span>}
          {success && <span className="text-xs" style={{ color: theme.SUCCESS }}>Enregistré.</span>}
        </div>
      </SettingsPanel>
    </div>
  )
}

interface TagListEditorProps {
  label: string
  placeholder: string
  values: string[]
  onChange: (values: string[]) => void
}

function TagListEditor({ label, placeholder, values, onChange }: TagListEditorProps) {
  const [draft, setDraft] = useState('')

  function add() {
    const trimmed = draft.trim()
    if (!trimmed || values.includes(trimmed)) {
      setDraft('')
      return
    }
    onChange([...values, trimmed])
    setDraft('')
  }

  function remove(value: string) {
    onChange(values.filter((v) => v !== value))
  }

  return (
    <div>
      <Label className="text-xs font-medium" style={{ color: theme.TEXT_MUTED }}>
        {label}
      </Label>
      <div className="flex gap-2 mt-1.5">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          className="h-9 text-sm flex-1"
          style={{
            background: theme.BG,
            border: `1px solid ${theme.BORDER}`,
            color: theme.TEXT,
          }}
        />
        <Button
          type="button"
          onClick={add}
          className="h-9 text-xs font-medium gap-1.5 px-3"
          style={{
            background: theme.BG,
            border: `1px solid ${theme.BORDER}`,
            color: theme.TEXT,
          }}
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Ajouter
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {values.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md"
              style={{
                background: theme.BG,
                border: `1px solid ${theme.BORDER}`,
                color: theme.TEXT,
              }}
            >
              {value}
              <button
                type="button"
                onClick={() => remove(value)}
                className="hover:opacity-70"
                aria-label={`Retirer ${value}`}
              >
                <XIcon className="w-3 h-3" style={{ color: theme.TEXT_MUTED }} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

interface PreferredMapEditorProps {
  preferred: Record<string, string[]>
  onChange: (preferred: Record<string, string[]>) => void
}

function PreferredMapEditor({ preferred, onChange }: PreferredMapEditorProps) {
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')

  function addPair() {
    const k = key.trim()
    const v = value.trim()
    if (!k || !v) return
    const existing = preferred[k] ?? []
    if (existing.includes(v)) {
      setValue('')
      return
    }
    onChange({ ...preferred, [k]: [...existing, v] })
    setValue('')
  }

  function removePair(k: string, v: string) {
    const filtered = (preferred[k] ?? []).filter((x) => x !== v)
    const next = { ...preferred }
    if (filtered.length === 0) {
      delete next[k]
    } else {
      next[k] = filtered
    }
    onChange(next)
  }

  const entries = Object.entries(preferred)

  return (
    <div>
      <Label className="text-xs font-medium" style={{ color: theme.TEXT_MUTED }}>
        Substitutions préférées (à éviter → préférer)
      </Label>
      <div className="flex gap-2 mt-1.5">
        <Input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Mot à éviter"
          className="h-9 text-sm flex-1"
          style={{
            background: theme.BG,
            border: `1px solid ${theme.BORDER}`,
            color: theme.TEXT,
          }}
        />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Alternative"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addPair()
            }
          }}
          className="h-9 text-sm flex-1"
          style={{
            background: theme.BG,
            border: `1px solid ${theme.BORDER}`,
            color: theme.TEXT,
          }}
        />
        <Button
          type="button"
          onClick={addPair}
          className="h-9 text-xs font-medium gap-1.5 px-3"
          style={{
            background: theme.BG,
            border: `1px solid ${theme.BORDER}`,
            color: theme.TEXT,
          }}
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Ajouter
        </Button>
      </div>
      {entries.length > 0 && (
        <div className="mt-3 space-y-2">
          {entries.map(([k, values]) => (
            <div
              key={k}
              className="flex items-start gap-2 p-2.5 rounded-md"
              style={{ background: theme.BG, border: `1px solid ${theme.BORDER}` }}
            >
              <span className="text-xs font-medium w-32 shrink-0" style={{ color: theme.TEXT }}>
                {k}
              </span>
              <span className="text-xs shrink-0" style={{ color: theme.TEXT_MUTED }}>
                →
              </span>
              <div className="flex flex-wrap gap-1.5 flex-1">
                {values.map((v) => (
                  <span
                    key={v}
                    className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-md"
                    style={{
                      background: theme.SURFACE,
                      border: `1px solid ${theme.BORDER}`,
                      color: theme.TEXT,
                    }}
                  >
                    {v}
                    <button
                      type="button"
                      onClick={() => removePair(k, v)}
                      className="hover:opacity-70"
                      aria-label={`Retirer ${v}`}
                    >
                      <XIcon className="w-3 h-3" style={{ color: theme.TEXT_MUTED }} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
