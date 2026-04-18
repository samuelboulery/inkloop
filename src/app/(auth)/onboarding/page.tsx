'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CreateWorkspaceSchema } from '@/lib/schemas/workspace'

const LLM_OPTIONS = [
  { value: 'gpt-4o', label: 'GPT-4o (OpenAI)' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (OpenAI)' },
  { value: 'claude-opus-4-7', label: 'Claude Opus (Anthropic)' },
  { value: 'claude-sonnet-4-6', label: 'Claude Sonnet (Anthropic)' },
  { value: 'ollama/llama3', label: 'Llama 3 (Ollama local)' },
]

const BG = 'hsl(222, 22%, 7%)'
const SURFACE = 'hsl(222, 18%, 11%)'
const BORDER = 'hsl(222, 15%, 18%)'
const BORDER_INPUT = 'hsl(222, 15%, 20%)'
const TEXT = 'hsl(210, 20%, 94%)'
const TEXT_LABEL = 'hsl(210, 15%, 70%)'
const TEXT_MUTED = 'hsl(215, 12%, 45%)'
const INPUT_BG = 'hsl(222, 20%, 8%)'
const ACCENT = 'hsl(235, 80%, 62%)'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<'check' | 'create'>('check')
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
      const { data: { user } } = await supabase.auth.getUser()
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
    return <WorkspaceChecker onNoWorkspace={() => setStep('create')} onWorkspaceFound={(id) => router.push(`/${id}`)} />
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: BG }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 0%, hsl(235, 80%, 20%, 0.2) 0%, transparent 70%)`,
        }}
      />

      <div className="max-w-sm w-full mx-6 relative">
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
            style={{ background: ACCENT, boxShadow: '0 4px 24px hsl(235, 80%, 62%, 0.3)' }}
          >
            <span className="text-white font-bold text-xs tracking-tight">ink</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: TEXT }}>
            Bienvenue sur inkloop
          </h1>
          <p className="text-sm mt-1" style={{ color: TEXT_MUTED }}>
            Créez votre premier espace de travail pour commencer.
          </p>
        </div>

        <div
          className="rounded-xl p-7"
          style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
        >
          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: TEXT_LABEL }}>
                Nom du workspace
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Mon association / Mon profil"
                required
                className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all placeholder:text-[hsl(215,10%,32%)]"
                style={{ background: INPUT_BG, border: `1px solid ${BORDER_INPUT}`, color: TEXT }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'hsl(235, 60%, 45%)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px hsl(235, 80%, 62%, 0.12)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = BORDER_INPUT
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: TEXT_LABEL }}>
                Type
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {(['Personal', 'Association'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    className="py-2.5 px-4 rounded-lg text-sm font-medium transition-all"
                    style={
                      form.type === t
                        ? {
                            background: 'hsl(235, 60%, 20%)',
                            border: '1px solid hsl(235, 60%, 35%)',
                            color: 'hsl(235, 90%, 78%)',
                          }
                        : {
                            background: INPUT_BG,
                            border: `1px solid ${BORDER_INPUT}`,
                            color: 'hsl(215, 12%, 55%)',
                          }
                    }
                  >
                    {t === 'Personal' ? 'Profil personnel' : 'Association'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: TEXT_LABEL }}>
                Modèle IA par défaut
              </label>
              <select
                value={form.default_llm_model}
                onChange={(e) => setForm({ ...form, default_llm_model: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all appearance-none"
                style={{
                  background: INPUT_BG,
                  border: `1px solid ${BORDER_INPUT}`,
                  color: TEXT,
                }}
              >
                {LLM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} style={{ background: 'hsl(222, 20%, 10%)' }}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <p
                className="text-xs rounded-lg px-3.5 py-2.5"
                style={{
                  color: 'hsl(0, 70%, 65%)',
                  background: 'hsl(0, 70%, 20%, 0.2)',
                  border: '1px solid hsl(0, 60%, 30%, 0.3)',
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !form.name}
              className="w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.99]"
              style={{
                background: ACCENT,
                color: '#fff',
                boxShadow: form.name ? '0 2px 12px hsl(235, 80%, 62%, 0.35)' : 'none',
              }}
            >
              {loading ? 'Création…' : 'Créer mon workspace'}
            </button>
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(222, 22%, 7%)' }}>
      <div className="text-sm" style={{ color: 'hsl(215, 12%, 35%)' }}>Chargement…</div>
    </div>
  )
}
