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
import { theme } from '@/lib/ui/theme'
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
                className="flex items-center gap-3 px-3 py-2.5 rounded-md"
                style={{
                  background: theme.BG,
                  border: `1px solid ${enabled ? theme.ACCENT : theme.BORDER}`,
                }}
              >
                <button
                  type="button"
                  onClick={() => togglePlatform(platform)}
                  className="w-9 h-5 rounded-full transition-colors relative shrink-0"
                  style={{
                    background: enabled ? theme.ACCENT : theme.BORDER,
                  }}
                  aria-pressed={enabled}
                  aria-label={`Activer ${platform}`}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                    style={{
                      left: enabled ? '18px' : '2px',
                    }}
                  />
                </button>
                <span
                  className="text-sm font-medium flex-1"
                  style={{ color: enabled ? theme.TEXT : theme.TEXT_MUTED }}
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
                  style={{
                    background: theme.SURFACE,
                    border: `1px solid ${theme.BORDER}`,
                    color: theme.TEXT,
                  }}
                />
                {!isKnown && (
                  <button
                    type="button"
                    onClick={() => removePlatform(platform)}
                    className="p-1.5 rounded-md hover:bg-white/5"
                    aria-label={`Retirer ${platform}`}
                  >
                    <Trash2Icon className="w-3.5 h-3.5" style={{ color: theme.TEXT_MUTED }} />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <div
          className="mt-5 pt-5"
          style={{ borderTop: `1px solid ${theme.BORDER}` }}
        >
          <Label className="text-xs font-medium" style={{ color: theme.TEXT_MUTED }}>
            Ajouter une plateforme personnalisée
          </Label>
          <div className="flex gap-2 mt-1.5">
            <Input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Ex : Reddit"
              className="h-9 text-sm flex-1"
              style={{
                background: theme.BG,
                border: `1px solid ${theme.BORDER}`,
                color: theme.TEXT,
              }}
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
        </div>

        <div className="flex items-center gap-3 mt-6">
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-8 text-xs font-medium px-4"
            style={{ background: theme.ACCENT, color: '#fff', border: 'none' }}
          >
            {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </Button>
          {error && <span className="text-xs" style={{ color: theme.DANGER }}>{error}</span>}
          {success && <span className="text-xs" style={{ color: theme.SUCCESS }}>Enregistré.</span>}
        </div>
      </SettingsPanel>
    </div>
  )
}
