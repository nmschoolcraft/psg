import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const email = session.user.email ?? ''
  const initials = email.slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-canvas-100">
      {/* Nav */}
      <nav className="bg-navy-900 border-b border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">P</span>
            </div>
            <span className="font-display text-white font-semibold">PSG Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-iron-300 text-sm hidden sm:block">{email}</span>
            <div className="w-8 h-8 rounded-full bg-clarity-600 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">{initials}</span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-navy-900">Dashboard</h1>
          <p className="text-iron-500 mt-1">Welcome back — your workforce insights are loading.</p>
        </div>

        {/* Placeholder cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { label: 'Active Claimants', value: '—', note: 'Syncing from BigQuery' },
            { label: 'CSI Score', value: '—', note: 'Last 30 days' },
            { label: 'Repeat Rate', value: '—', note: 'Industry benchmark pending' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-2xl shadow-sm p-6 border border-iron-100">
              <p className="text-sm font-medium text-iron-500 uppercase tracking-caps">{card.label}</p>
              <p className="font-display text-4xl font-bold text-navy-900 mt-2">{card.value}</p>
              <p className="text-xs text-iron-400 mt-1">{card.note}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-iron-100 p-6">
          <p className="text-sm text-iron-500 text-center py-8">
            Full analytics dashboard coming in Phase 2. Data pipeline is live — reports will appear here once your company profile is complete.
          </p>
        </div>
      </main>
    </div>
  )
}

function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="text-iron-400 hover:text-white text-sm transition-colors duration-150"
      >
        Sign out
      </button>
    </form>
  )
}
