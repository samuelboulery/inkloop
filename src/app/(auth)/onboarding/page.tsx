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

      // Ajoute l'owner comme membre Owner
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

  // Vérifie si l'utilisateur a déjà des workspaces
  if (step === 'check') {
    return <WorkspaceChecker onNoWorkspace={() => setStep('create')} onWorkspaceFound={(id) => router.push(`/${id}`)} />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="max-w-lg w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Bienvenue sur inkloop</h1>
          <p className="text-gray-400">Créez votre premier espace de travail pour commencer.</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Nom du workspace</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Mon association / Mon profil"
                required
                className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Type</label>
              <div className="grid grid-cols-2 gap-3">
                {(['Personal', 'Association'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    className={`py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                      form.type === t
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    {t === 'Personal' ? 'Profil personnel' : 'Association'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Modèle IA par défaut</label>
              <select
                value={form.default_llm_model}
                onChange={(e) => setForm({ ...form, default_llm_model: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                {LLM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !form.name}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
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
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-gray-500 text-sm">Chargement…</div>
    </div>
  )
}
