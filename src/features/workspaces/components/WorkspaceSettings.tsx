'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UpdateWorkspaceSchema } from '@/lib/schemas/workspace'
import type { Workspace } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'

const LLM_OPTIONS = [
  { value: 'gpt-4o', label: 'GPT-4o (OpenAI)' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (OpenAI)' },
  { value: 'claude-opus-4-7', label: 'Claude Opus (Anthropic)' },
  { value: 'claude-sonnet-4-6', label: 'Claude Sonnet (Anthropic)' },
  { value: 'ollama/llama3', label: 'Llama 3 (Ollama local)' },
]

const SOCIAL_PLATFORMS = ['LinkedIn', 'Instagram', 'X (Twitter)', 'Facebook', 'Mastodon']

export function WorkspaceSettings({ workspace }: { workspace: Workspace }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    name: workspace.name,
    type: workspace.type,
    default_llm_model: workspace.default_llm_model,
    system_prompt_global: workspace.system_prompt_global ?? '',
    social_networks: (workspace.social_networks as Record<string, { enabled: boolean; handle?: string }>) ?? {},
  })

  function togglePlatform(platform: string) {
    setForm((prev) => ({
      ...prev,
      social_networks: {
        ...prev.social_networks,
        [platform]: {
          ...prev.social_networks[platform],
          enabled: !prev.social_networks[platform]?.enabled,
        },
      },
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const validated = UpdateWorkspaceSchema.parse({ id: workspace.id, ...form })
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('workspaces')
        .update({
          name: validated.name,
          type: validated.type,
          default_llm_model: validated.default_llm_model,
          system_prompt_global: validated.system_prompt_global,
          social_networks: validated.social_networks,
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
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
      <Card className="bg-gray-800 border-gray-700 p-6">
        <h3 className="text-sm font-semibold text-gray-200 mb-4">Informations générales</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="ws-name" className="text-gray-300">Nom du workspace</Label>
            <Input
              id="ws-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1.5 bg-gray-700 border-gray-600 text-white"
              required
            />
          </div>

          <div>
            <Label className="text-gray-300">Type</Label>
            <div className="flex gap-3 mt-1.5">
              {(['Personal', 'Association'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  className={`py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                    form.type === t
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {t === 'Personal' ? 'Profil personnel' : 'Association'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="ws-model" className="text-gray-300">Modèle IA par défaut</Label>
            <select
              id="ws-model"
              value={form.default_llm_model}
              onChange={(e) => setForm({ ...form, default_llm_model: e.target.value })}
              className="mt-1.5 w-full px-3.5 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              {LLM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card className="bg-gray-800 border-gray-700 p-6">
        <h3 className="text-sm font-semibold text-gray-200 mb-1">Charte éditoriale (prompt système)</h3>
        <p className="text-xs text-gray-500 mb-4">Ce prompt est injecté dans chaque appel IA pour garantir le respect de votre charte.</p>
        <Textarea
          value={form.system_prompt_global}
          onChange={(e) => setForm({ ...form, system_prompt_global: e.target.value })}
          placeholder="Ex : Vous représentez l'association XYZ. Adoptez un ton professionnel et bienveillant. Évitez le jargon technique..."
          className="bg-gray-700 border-gray-600 text-white placeholder-gray-500 min-h-[120px]"
        />
      </Card>

      <Card className="bg-gray-800 border-gray-700 p-6">
        <h3 className="text-sm font-semibold text-gray-200 mb-4">Réseaux sociaux activés</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SOCIAL_PLATFORMS.map((platform) => {
            const enabled = form.social_networks[platform]?.enabled ?? false
            return (
              <button
                key={platform}
                type="button"
                onClick={() => togglePlatform(platform)}
                className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors text-left ${
                  enabled
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                    : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:border-gray-500'
                }`}
              >
                {platform}
              </button>
            )
          })}
        </div>
      </Card>

      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-400 bg-green-400/10 rounded-lg px-3 py-2">Paramètres sauvegardés.</p>
      )}

      <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-500">
        {saving ? 'Sauvegarde…' : 'Sauvegarder'}
      </Button>
    </form>
  )
}
