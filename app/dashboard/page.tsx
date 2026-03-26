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

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <a href="/dashboard/marketing" className="block bg-white rounded-2xl shadow-sm border border-iron-100 p-6 hover:shadow-md hover:border-clarity-300 transition-all duration-150 group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-clarity-50 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-clarity-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-navy-900 group-hover:text-clarity-700 transition-colors duration-150">Marketing Dashboard</p>
                <p className="text-xs text-iron-500">Google Ads · SEMrush · Alerts</p>
              </div>
            </div>
            <p className="text-sm text-iron-500">Paid search performance, competitor intelligence, quality scores, and live alert queue across all client accounts.</p>
          </a>

          <div className="bg-white rounded-2xl shadow-sm border border-iron-100 p-6 opacity-60">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-canvas-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-iron-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-iron-600">Workforce Analytics</p>
                <p className="text-xs text-iron-400">Coming in Phase 2</p>
              </div>
            </div>
            <p className="text-sm text-iron-400">Claimant growth, CSI trends, pay type mix, and repeat rate benchmarks.</p>
          </div>
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
