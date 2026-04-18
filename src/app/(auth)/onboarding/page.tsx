'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CreateWorkspaceSchema } from '@/lib/schemas/workspace'
import { Button } from '@/components/ui/button'

const LLM_OPTIONS = [
  { value: 'gpt-4o', label: 'GPT-4o (OpenAI)' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (OpenAI)' },
  { value: 'claude-opus-4-7', label: 'Claude Opus (Anthropic)' },
  { value: 'claude-sonnet-4-6', label: 'Claude Sonnet (Anthropic)' },
  { value: 'ollama/llama3', label: 'Llama 3 (Ollama local)' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const forceCreate = searchParams.get('new') === '1'
  const [step, setStep] = useState<'check' | 'create'>(forceCreate ? 'create' : 'check')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    type: 'Personal' as 'Personal' | 'Association',
    default_llm_model: 'gpt-4o',
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const validated = CreateWorkspaceSchema.parse(form)

      const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .insert({ ...validated, owner_id: user.id })
        .select()
        .single()

      if (wsError) throw wsError

      await supabase.from('workspace_members').insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'Owner',
      })

      router.push(`/${workspace.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'check') {
    return (
      <WorkspaceChecker
        onNoWorkspace={() => setStep('create')}
        onWorkspaceFound={(id) => router.push(`/${id}`)}
      />
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background animate-fade-in">
      {/* Subtle blueprint grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="max-w-sm w-full mx-6 relative animate-fade-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-foreground">
            <span className="text-background font-bold text-xs tracking-tight">ink</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {forceCreate ? 'Nouveau workspace' : 'Bienvenue sur inkloop'}
          </h1>
          <p className="text-meta mt-2 text-muted-foreground">
            {forceCreate ? 'Créer un espace de travail' : 'Premier workspace · Setup'}
          </p>
        </div>

        <div className="rounded-xl p-7 bg-surface-1 border border-border">
          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label
                htmlFor="workspace-name"
                className="block text-xs font-medium mb-1.5 text-foreground"
              >
                Nom du workspace
              </label>
              <input
                id="workspace-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Mon association / Mon profil"
                required
                className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-background border border-border text-foreground transition-colors duration-200 outline-none focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-foreground">Type</label>
              <div className="grid grid-cols-2 gap-2.5">
                {(['Personal', 'Association'] as const).map((t) => {
                  const selected = form.type === t
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, type: t })}
                      className={
                        selected
                          ? 'py-2.5 px-4 rounded-lg text-sm font-medium transition-colors duration-200 bg-foreground border border-foreground text-background'
                          : 'py-2.5 px-4 rounded-lg text-sm font-medium transition-colors duration-200 bg-background border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40'
                      }
                    >
                      {t === 'Personal' ? 'Profil personnel' : 'Association'}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="default-llm"
                className="block text-xs font-medium mb-1.5 text-foreground"
              >
                Modèle IA par défaut
              </label>
              <select
                id="default-llm"
                value={form.default_llm_model}
                onChange={(e) => setForm({ ...form, default_llm_model: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm appearance-none bg-background border border-border text-foreground transition-colors duration-200 outline-none focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                {LLM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <p className="text-xs rounded-lg px-3.5 py-2.5 bg-destructive/5 border border-destructive/20 text-destructive">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading || !form.name}
              className="w-full active:scale-[0.99]"
            >
              {loading ? 'Création…' : 'Créer mon workspace'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

function WorkspaceChecker({
  onNoWorkspace,
  onWorkspaceFound,
}: {
  onNoWorkspace: () => void
  onWorkspaceFound: (id: string) => void
}) {
  const supabase = createClient()

  supabase
    .from('workspaces')
    .select('id')
    .limit(1)
    .then(({ data }) => {
      if (data && data.length > 0) {
        onWorkspaceFound(data[0].id)
      } else {
        onNoWorkspace()
      }
    })

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-meta text-muted-foreground">Chargement…</div>
    </div>
  )
}
