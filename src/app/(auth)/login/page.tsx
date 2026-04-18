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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(222, 22%, 7%)' }}>
        <div className="max-w-sm w-full mx-6 text-center">
          <div
            className="rounded-xl p-8"
            style={{
              background: 'hsl(222, 18%, 11%)',
              border: '1px solid hsl(222, 15%, 18%)',
            }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'hsl(235, 60%, 20%)' }}
            >
              <svg className="w-5 h-5" style={{ color: 'hsl(235, 80%, 72%)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-[15px] font-semibold mb-2" style={{ color: 'hsl(210, 20%, 94%)' }}>
              Vérifiez votre email
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'hsl(215, 12%, 50%)' }}>
              Un lien de connexion a été envoyé à{' '}
              <span className="font-medium" style={{ color: 'hsl(210, 20%, 80%)' }}>{email}</span>.
              <br />Cliquez dessus pour accéder à inkloop.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'hsl(222, 22%, 7%)' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 50% 0%, hsl(235, 80%, 20%, 0.25) 0%, transparent 70%),
            radial-gradient(ellipse 40% 30% at 80% 80%, hsl(250, 60%, 15%, 0.15) 0%, transparent 60%)
          `,
        }}
      />

      <div className="max-w-sm w-full mx-6 relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
            style={{ background: 'hsl(235, 80%, 62%)', boxShadow: '0 4px 24px hsl(235, 80%, 62%, 0.3)' }}
          >
            <span className="text-white font-bold text-xs tracking-tight">ink</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'hsl(210, 20%, 94%)' }}>
            inkloop
          </h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(215, 12%, 45%)' }}>
            Content Factory assistée par IA
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl p-7"
          style={{
            background: 'hsl(222, 18%, 11%)',
            border: '1px solid hsl(222, 15%, 18%)',
          }}
        >
          <h2 className="text-[13px] font-medium mb-5" style={{ color: 'hsl(215, 12%, 50%)' }}>
            Connexion par lien magique
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium mb-1.5"
                style={{ color: 'hsl(210, 15%, 70%)' }}
              >
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
                className="w-full px-3.5 py-2.5 rounded-lg text-sm transition-all outline-none placeholder:text-[hsl(215,10%,35%)]"
                style={{
                  background: 'hsl(222, 20%, 8%)',
                  border: '1px solid hsl(222, 15%, 20%)',
                  color: 'hsl(210, 20%, 94%)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'hsl(235, 60%, 45%)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px hsl(235, 80%, 62%, 0.12)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'hsl(222, 15%, 20%)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
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
              disabled={loading || !email}
              className="w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.99]"
              style={{
                background: 'hsl(235, 80%, 62%)',
                color: '#fff',
                boxShadow: email ? '0 2px 12px hsl(235, 80%, 62%, 0.35)' : 'none',
              }}
            >
              {loading ? 'Envoi en cours…' : 'Recevoir un lien de connexion'}
            </button>
          </form>

          <p className="text-[11px] text-center mt-5" style={{ color: 'hsl(215, 10%, 35%)' }}>
            Pas de mot de passe — nous vous envoyons un lien magique par email.
          </p>
        </div>
      </div>
    </div>
  )
}
