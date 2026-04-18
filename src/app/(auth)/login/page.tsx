'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { MailIcon } from 'lucide-react'

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
      <div className="min-h-screen flex items-center justify-center bg-background animate-fade-in">
        <div className="max-w-sm w-full mx-6 text-center">
          <div className="rounded-xl p-8 bg-surface-1 border border-border animate-scale-in">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-5 bg-foreground">
              <MailIcon className="w-5 h-5 text-background" />
            </div>
            <h2 className="text-[15px] font-semibold mb-2 text-foreground">
              Vérifiez votre email
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Un lien de connexion a été envoyé à{' '}
              <span className="font-medium text-foreground">{email}</span>.
              <br />Cliquez dessus pour accéder à inkloop.
            </p>
          </div>
        </div>
      </div>
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
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-foreground">
            <span className="text-background font-bold text-xs tracking-tight">ink</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            inkloop
          </h1>
          <p className="text-meta mt-2 text-muted-foreground">
            Content Factory · IA
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl p-7 bg-surface-1 border border-border">
          <h2 className="text-meta mb-5 text-muted-foreground">
            Connexion · Lien magique
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium mb-1.5 text-foreground"
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
                className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-background border border-border text-foreground transition-colors duration-200 outline-none focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
              />
            </div>

            {error && (
              <p className="text-xs rounded-lg px-3.5 py-2.5 bg-destructive/5 border border-destructive/20 text-destructive">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full active:scale-[0.99]"
            >
              {loading ? 'Envoi en cours…' : 'Recevoir un lien de connexion'}
            </Button>
          </form>

          <p className="text-[11px] text-center mt-5 text-muted-foreground/70">
            Pas de mot de passe — nous vous envoyons un lien magique par email.
          </p>
        </div>
      </div>
    </div>
  )
}
