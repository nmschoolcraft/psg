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
      setLoading(false)
    } else {
      setSubmitted(true)
    }
  }

  return (
    <div className="min-h-screen bg-canvas-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-navy-900 mb-4">
            <span className="text-white font-display font-bold text-lg">P</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-navy-900">PSG Portal</h1>
          <p className="text-iron-500 text-sm mt-1">Phoenix Solutions Group</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-8">
          {submitted ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-trust-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-trust-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="font-display text-xl font-semibold text-navy-900 mb-2">Check your email</h2>
              <p className="text-iron-500 text-sm">
                We sent a login link to <strong className="text-navy-900">{email}</strong>.
                Click the link to sign in — no password needed.
              </p>
              <button
                onClick={() => { setSubmitted(false); setEmail('') }}
                className="mt-6 text-sm text-clarity-600 hover:text-clarity-700 underline underline-offset-2"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h2 className="font-display text-xl font-semibold text-navy-900 mb-1">Sign in</h2>
              <p className="text-iron-500 text-sm mb-6">
                Enter your email and we&apos;ll send you a login link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-iron-700 mb-1.5">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-iron-200 bg-white text-navy-900 placeholder:text-iron-400 text-sm
                               focus:outline-none focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500
                               transition-colors duration-150"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-2.5 px-4 rounded-lg bg-navy-900 text-white font-medium text-sm
                             hover:bg-navy-800 active:bg-navy-950 disabled:opacity-50 disabled:cursor-not-allowed
                             transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2"
                >
                  {loading ? 'Sending…' : 'Send login link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
