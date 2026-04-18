'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Workspace } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SettingsPanel } from './SettingsPanel'
import { PlusIcon, XIcon } from 'lucide-react'

const DEFAULT_TARGETS = [
  'Grand public',
  'Membres / Adhérents',
  'Bénévoles',
  'Partenaires',
  'Médias',
  'Jeunes (18-25 ans)',
  'Familles',
  'Donateurs',
  'Professionnels',
  'Institutions / Élus',
]

interface Props {
  workspace: Workspace
}

export function TargetsEditor({ workspace }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [newTarget, setNewTarget] = useState('')

  const rawTargets = workspace.campaign_targets
  const [targets, setTargets] = useState<string[]>(
    Array.isArray(rawTargets) && rawTargets.length > 0
      ? (rawTargets as string[])
      : DEFAULT_TARGETS,
  )

  function addTarget() {
    const trimmed = newTarget.trim()
    if (!trimmed || targets.includes(trimmed)) return
    setTargets((prev) => [...prev, trimmed])
    setNewTarget('')
  }

  function removeTarget(target: string) {
    setTargets((prev) => prev.filter((t) => t !== target))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTarget()
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('workspaces')
        .update({ campaign_targets: targets })
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

  function resetToDefaults() {
    setTargets(DEFAULT_TARGETS)
  }

  return (
    <SettingsPanel
      title="Cibles de campagne"
      description="Définissez les cibles disponibles lors de la création d'une campagne dans ce workspace."
      actions={
        <button
          type="button"
          onClick={resetToDefaults}
          className="text-[11px] underline underline-offset-2 transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
        >
          Réinitialiser
        </button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 min-h-[40px]">
          {targets.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Aucune cible définie. Ajoutez-en ci-dessous.
            </p>
          )}
          {targets.map((target) => (
            <span
              key={target}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-background border border-border text-foreground"
            >
              {target}
              <button
                type="button"
                onClick={() => removeTarget(target)}
                className="rounded-full transition-colors hover:opacity-60 cursor-pointer"
                aria-label={`Supprimer ${target}`}
              >
                <XIcon className="w-3 h-3 text-muted-foreground" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nouvelle cible…"
            className="h-8 text-xs flex-1"
          />
          <Button
            type="button"
            onClick={addTarget}
            disabled={!newTarget.trim()}
            size="sm"
            className="h-8 px-3 text-xs"
          >
            <PlusIcon className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-3 pt-1">
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
      </div>
    </SettingsPanel>
  )
}
