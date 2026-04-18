'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SocialNetworksSchema } from '@/lib/schemas/workspace'
import type { Workspace } from '@/types/database'
import type { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SettingsPanel } from './SettingsPanel'
import { PlusIcon, Trash2Icon } from 'lucide-react'

type SocialNetworks = z.infer<typeof SocialNetworksSchema>

const KNOWN_PLATFORMS = [
  'LinkedIn',
  'Instagram',
  'X (Twitter)',
  'Facebook',
  'Mastodon',
  'Threads',
  'Bluesky',
  'TikTok',
  'YouTube',
] as const

interface NetworksSettingsProps {
  workspace: Workspace
}

function parseNetworks(raw: unknown): SocialNetworks {
  const result = SocialNetworksSchema.safeParse(raw)
  return result.success ? result.data : {}
}

export function NetworksSettings({ workspace }: NetworksSettingsProps) {
  const router = useRouter()
  const [networks, setNetworks] = useState<SocialNetworks>(() => parseNetworks(workspace.social_networks))
  const [customName, setCustomName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function togglePlatform(platform: string) {
    setNetworks((prev) => {
      const current = prev[platform] ?? { enabled: false }
      return {
        ...prev,
        [platform]: { ...current, enabled: !current.enabled },
      }
    })
  }

  function updateHandle(platform: string, handle: string) {
    setNetworks((prev) => ({
      ...prev,
      [platform]: { ...(prev[platform] ?? { enabled: true }), handle: handle || undefined },
    }))
  }

  function addCustom() {
    const trimmed = customName.trim()
    if (!trimmed) return
    setNetworks((prev) => ({
      ...prev,
      [trimmed]: { enabled: true },
    }))
    setCustomName('')
  }

  function removePlatform(platform: string) {
    setNetworks((prev) => {
      const next = { ...prev }
      delete next[platform]
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const parsed = SocialNetworksSchema.parse(networks)
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('workspaces')
        .update({ social_networks: parsed })
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

  const allPlatforms = Array.from(
    new Set<string>([...KNOWN_PLATFORMS, ...Object.keys(networks)]),
  )

  return (
    <div className="space-y-5">
      <SettingsPanel
        title="Réseaux sociaux"
        description="Activez les plateformes cibles et renseignez vos handles publics."
      >
        <div className="space-y-2">
          {allPlatforms.map((platform) => {
            const config = networks[platform]
            const enabled = config?.enabled ?? false
            const isKnown = (KNOWN_PLATFORMS as readonly string[]).includes(platform)
            return (
              <div
                key={platform}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md bg-background border ${
                  enabled ? 'border-primary' : 'border-border'
                }`}
              >
                <button
                  type="button"
                  onClick={() => togglePlatform(platform)}
                  className={`w-9 h-5 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                    enabled ? 'bg-primary' : 'bg-border'
                  }`}
                  aria-pressed={enabled}
                  aria-label={`Activer ${platform}`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      enabled ? 'left-[18px]' : 'left-0.5'
                    }`}
                  />
                </button>
                <span
                  className={`text-sm font-medium flex-1 ${
                    enabled ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {platform}
                </span>
                <Input
                  type="text"
                  placeholder="@handle ou URL"
                  value={config?.handle ?? ''}
                  onChange={(e) => updateHandle(platform, e.target.value)}
                  disabled={!enabled}
                  className="h-7 text-xs w-52"
                />
                {!isKnown && (
                  <button
                    type="button"
                    onClick={() => removePlatform(platform)}
                    className="p-1.5 rounded-md hover:bg-muted cursor-pointer"
                    aria-label={`Retirer ${platform}`}
                  >
                    <Trash2Icon className="w-3.5 h-3.5 text-destructive" />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-5 pt-5 border-t border-border">
          <Label className="text-meta text-muted-foreground">
            Ajouter une plateforme personnalisée
          </Label>
          <div className="flex gap-2 mt-1.5">
            <Input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Ex : Reddit"
              className="h-9 text-sm flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCustom()
                }
              }}
            />
            <Button
              type="button"
              onClick={addCustom}
              variant="outline"
              size="sm"
              className="h-9 text-xs font-medium gap-1.5 px-3"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Ajouter
            </Button>
          </div>
        </div>

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
