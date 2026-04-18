'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SocialNetworksSchema } from '@/lib/schemas/workspace'
import type { Workspace } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SettingsPanel } from './SettingsPanel'

interface PromptsEditorProps {
  workspace: Workspace
}

function parsePrompts(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const entries: Array<[string, string]> = []
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'string') entries.push([key, value])
  }
  return Object.fromEntries(entries)
}

function enabledPlatforms(raw: unknown): string[] {
  const parsed = SocialNetworksSchema.safeParse(raw)
  if (!parsed.success) return []
  return Object.entries(parsed.data)
    .filter(([, config]) => config.enabled)
    .map(([name]) => name)
}

export function PromptsEditor({ workspace }: PromptsEditorProps) {
  const router = useRouter()
  const [globalPrompt, setGlobalPrompt] = useState(workspace.system_prompt_global ?? '')
  const [platformPrompts, setPlatformPrompts] = useState<Record<string, string>>(() =>
    parsePrompts(workspace.platform_specific_prompts),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const platforms = enabledPlatforms(workspace.social_networks)

  function updatePlatformPrompt(platform: string, value: string) {
    setPlatformPrompts((prev) => ({ ...prev, [platform]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const cleaned: Record<string, string> = {}
      for (const [platform, prompt] of Object.entries(platformPrompts)) {
        const trimmed = prompt.trim()
        if (trimmed) cleaned[platform] = trimmed
      }
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('workspaces')
        .update({
          system_prompt_global: globalPrompt.trim() || null,
          platform_specific_prompts: cleaned,
        })
        .eq('id', workspace.id)
      if (updateError) throw updateError
      setSuccess(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <SettingsPanel
        title="Prompt système global"
        description="Instructions injectées au début de chaque génération IA pour ce workspace."
      >
        <Textarea
          value={globalPrompt}
          onChange={(e) => setGlobalPrompt(e.target.value)}
          placeholder={
            'Ex : Tu écris pour une association d\'aide aux aidants familiaux. Reste chaleureux, concret, évite le jargon.'
          }
          rows={6}
          className="text-sm"
        />
      </SettingsPanel>

      <SettingsPanel
        title="Prompts par plateforme"
        description="Instructions additionnelles par réseau social activé."
      >
        {platforms.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Activez d&apos;abord des réseaux sociaux dans l&apos;onglet « Réseaux » pour y associer un prompt.
          </p>
        ) : (
          <div className="space-y-4">
            {platforms.map((platform) => (
              <div key={platform}>
                <Label className="text-meta text-muted-foreground">
                  {platform}
                </Label>
                <Textarea
                  value={platformPrompts[platform] ?? ''}
                  onChange={(e) => updatePlatformPrompt(platform, e.target.value)}
                  placeholder={`Conseils spécifiques pour ${platform} (ton, format, longueur, hashtags…)`}
                  rows={3}
                  className="mt-1.5 text-sm"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 mt-6">
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="h-8 text-xs font-medium px-4"
          >
            {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </Button>
          {error && <span className="text-xs text-destructive">{error}</span>}
          {success && <span className="text-xs text-foreground">Enregistré.</span>}
        </div>
      </SettingsPanel>
    </div>
  )
}
