'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSubmitted(true)
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="max-w-md w-full mx-4 text-center">
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Vérifiez votre email</h2>
            <p className="text-gray-400 text-sm">
              Un lien de connexion a été envoyé à <strong className="text-gray-200">{email}</strong>.
              Cliquez dessus pour accéder à inkloop.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">inkloop</h1>
          <p className="text-gray-400">Content Factory assistée par IA</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-6">Connexion</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
                className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
            >
              {loading ? 'Envoi en cours…' : 'Recevoir un lien de connexion'}
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-6">
            Pas de mot de passe — nous vous envoyons un lien magique par email.
          </p>
        </div>
      </div>
    </div>
  )
}
