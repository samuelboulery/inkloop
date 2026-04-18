'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UpdateWorkspaceSchema } from '@/lib/schemas/workspace'
import type { Workspace } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SettingsPanel } from './SettingsPanel'

const LLM_OPTIONS = [
  { value: 'gpt-4o', label: 'GPT-4o (OpenAI)' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (OpenAI)' },
  { value: 'claude-opus-4-7', label: 'Claude Opus (Anthropic)' },
  { value: 'claude-sonnet-4-6', label: 'Claude Sonnet (Anthropic)' },
  { value: 'ollama', label: 'Ollama (modèle local)' },
] as const

interface GeneralSettingsProps {
  workspace: Workspace
}

export function GeneralSettings({ workspace }: GeneralSettingsProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    name: workspace.name,
    type: workspace.type,
    default_llm_model: workspace.default_llm_model,
    logo_url: workspace.logo_url ?? '',
  })

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const validated = UpdateWorkspaceSchema.parse({
        id: workspace.id,
        name: form.name,
        type: form.type,
        default_llm_model: form.default_llm_model,
        logo_url: form.logo_url.trim() || null,
      })
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('workspaces')
        .update({
          name: validated.name,
          type: validated.type,
          default_llm_model: validated.default_llm_model,
          logo_url: validated.logo_url ?? null,
        })
        .eq('id', workspace.id)

      if (updateError) throw updateError

      setSuccess(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave}>
      <SettingsPanel
        title="Informations générales"
        description="Identité et modèle IA par défaut du workspace."
      >
        <div className="space-y-5">
          <div>
            <Label htmlFor="ws-name" className="text-meta text-muted-foreground">
              Nom du workspace
            </Label>
            <Input
              id="ws-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1.5 h-9 text-sm"
              required
            />
          </div>

          <div>
            <Label htmlFor="ws-logo" className="text-meta text-muted-foreground">
              URL du logo (optionnel)
            </Label>
            <Input
              id="ws-logo"
              type="url"
              value={form.logo_url}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              placeholder="https://…"
              className="mt-1.5 h-9 text-sm"
            />
          </div>

          <div>
            <Label className="text-meta text-muted-foreground">Type</Label>
            <div className="flex gap-2 mt-1.5">
              {(['Personal', 'Association'] as const).map((t) => {
                const active = form.type === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    className={
                      'py-2 px-3.5 rounded-md text-xs font-medium transition-colors cursor-pointer ' +
                      (active
                        ? 'bg-primary text-primary-foreground border border-primary'
                        : 'bg-background text-foreground border border-border hover:bg-muted')
                    }
                  >
                    {t === 'Personal' ? 'Profil personnel' : 'Association'}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="ws-model" className="text-meta text-muted-foreground">
              Modèle IA par défaut
            </Label>
            <select
              id="ws-model"
              value={form.default_llm_model}
              onChange={(e) => setForm({ ...form, default_llm_model: e.target.value })}
              className="mt-1.5 w-full px-3 py-2 rounded-md text-sm bg-background border border-border text-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {LLM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <Button type="submit" disabled={saving} size="sm" className="text-xs font-medium">
            {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </Button>
          {error && <span className="text-xs text-destructive">{error}</span>}
          {success && <span className="text-xs text-emerald-600">Enregistré.</span>}
        </div>
      </SettingsPanel>
    </form>
  )
}
