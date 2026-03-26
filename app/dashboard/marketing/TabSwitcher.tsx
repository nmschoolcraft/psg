'use client'

import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Tab = 'executive' | 'paid-search' | 'competitors' | 'alerts'

export interface DashboardData {
  portfolio: Record<string, unknown>
  accounts: Record<string, unknown>[]
  trend: Record<string, unknown>[]
  campaigns: Record<string, unknown>[]
  qsBands: Record<string, unknown>[]
  searchTerms: Record<string, unknown>[]
  competitors: Record<string, unknown>[]
  keywords: Record<string, unknown>[]
  alerts: Record<string, unknown>[]
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function fmt(value: unknown): string {
  if (value === null || value === undefined) return '—'
  const n = typeof value === 'string' ? parseFloat(value) : Number(value)
  if (isNaN(n)) return String(value)
  return n.toLocaleString('en-US', { maximumFractionDigits: 1 })
}

function fmtCurrency(value: unknown): string {
  if (value === null || value === undefined) return '—'
  const n = typeof value === 'string' ? parseFloat(value) : Number(value)
  if (isNaN(n)) return '—'
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function fmtPct(value: unknown): string {
  if (value === null || value === undefined) return '—'
  const n = typeof value === 'string' ? parseFloat(value) : Number(value)
  if (isNaN(n)) return '—'
  return (n * 100).toFixed(1) + '%'
}

function num(value: unknown): number {
  if (value === null || value === undefined) return 0
  return typeof value === 'string' ? parseFloat(value) || 0 : Number(value) || 0
}

// ─── UI primitives ────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 border border-iron-100">
      <p className="text-xs font-semibold text-iron-500 uppercase tracking-caps">{label}</p>
      <p className="font-display text-3xl font-bold text-navy-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-iron-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function BarRow({ label, value, max, sub }: { label: string; value: number; max: number; sub?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-sm text-navy-800 truncate pr-2">{label}</span>
        {sub && <span className="text-xs text-iron-500 shrink-0">{sub}</span>}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-iron-100 rounded-full h-2 overflow-hidden">
          <div className="h-full bg-clarity-500 rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-iron-600 tabular-nums w-16 text-right shrink-0">{fmtCurrency(value)}</span>
      </div>
    </div>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const s = String(severity).toLowerCase()
  if (s === 'critical') return <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5">Critical</span>
  if (s === 'warning') return <span className="inline-flex items-center rounded-full bg-ignite-100 text-ignite-700 text-xs font-semibold px-2 py-0.5">Warning</span>
  return <span className="inline-flex items-center rounded-full bg-iron-100 text-iron-600 text-xs font-semibold px-2 py-0.5">{String(severity)}</span>
}

// ─── Tab sections ─────────────────────────────────────────────────────────────

function ExecutiveTab({ portfolio, accounts, trend }: Pick<DashboardData, 'portfolio' | 'accounts' | 'trend'>) {
  const totalSpend = num(portfolio.total_spend)
  const totalClicks = num(portfolio.total_clicks)
  const totalImpressions = num(portfolio.total_impressions)
  const totalConversions = num(portfolio.total_conversions)
  const totalBudget = num(portfolio.total_budget)
  const burnRate = num(portfolio.portfolio_burn_rate)
  const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0
  const ctr = totalImpressions > 0 ? totalClicks / totalImpressions : 0
  const maxSpend = Math.max(...trend.map(r => num(r.spend)), 1)
  const maxAccountSpend = Math.max(...accounts.map(a => num(a.spend)), 1)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard label="Total Spend" value={fmtCurrency(totalSpend)} sub="Last 30 days" />
        <KpiCard label="Total Clicks" value={fmt(totalClicks)} />
        <KpiCard label="Conversions" value={fmt(totalConversions)} sub="Ads tracked" />
        <KpiCard label="Cost / Conv." value={cpa > 0 ? fmtCurrency(cpa) : '—'} />
        <KpiCard label="Avg CTR" value={fmtPct(ctr)} />
        <KpiCard label="Budget Burn" value={fmtPct(burnRate)} sub={`of ${fmtCurrency(totalBudget)}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-iron-100 p-5">
          <h3 className="text-sm font-semibold text-navy-900 mb-4">30-Day Spend Trend</h3>
          {trend.length > 0 ? (
            <div className="space-y-1.5">
              {trend.slice(-14).map((row) => {
                const d = String(row.date).slice(5)
                const s = num(row.spend)
                const pct = (s / maxSpend) * 100
                return (
                  <div key={String(row.date)} className="flex items-center gap-2">
                    <span className="text-xs text-iron-400 w-10 shrink-0">{d}</span>
                    <div className="flex-1 bg-iron-100 rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-clarity-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-iron-600 tabular-nums w-16 text-right">{fmtCurrency(s)}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-iron-400">No trend data available</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-iron-100 p-5">
          <h3 className="text-sm font-semibold text-navy-900 mb-4">Spend by Account</h3>
          <div className="space-y-3">
            {accounts.map((acct) => (
              <BarRow
                key={String(acct.account_name)}
                label={String(acct.account_name)}
                value={num(acct.spend)}
                max={maxAccountSpend}
                sub={`CTR ${fmtPct(acct.avg_ctr)}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-canvas-100 border border-canvas-300 rounded-xl px-4 py-3 text-sm text-iron-600">
        <span className="font-semibold">Note:</span>{' '}
        Qualified Leads and Sessions require GA4 access (PSG-89 pending). Conversions shown are Google Ads tracked only.
      </div>
    </div>
  )
}

function PaidSearchTab({ campaigns, qsBands, searchTerms }: Pick<DashboardData, 'campaigns' | 'qsBands' | 'searchTerms'>) {
  const topConverters = searchTerms.filter(t => t.term_category === 'Top Converter')
  const wastedSpend = searchTerms.filter(t => t.term_category === 'Wasted Spend')
  const qsBandOrder: Record<string, number> = { 'High (8-10)': 0, 'Average (5-7)': 1, 'Low (1-4)': 2, 'Unknown': 3 }
  const sortedBands = [...qsBands].sort((a, b) => (qsBandOrder[String(a.qs_band)] ?? 9) - (qsBandOrder[String(b.qs_band)] ?? 9))
  const totalKeywords = qsBands.reduce((s, b) => s + num(b.keywords), 0)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-iron-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-iron-100">
          <h3 className="text-sm font-semibold text-navy-900">Campaign Performance — Last 30 Days</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-iron-100 bg-canvas-50">
                <th className="text-left text-xs font-semibold text-iron-500 uppercase tracking-caps px-5 py-3">Campaign</th>
                <th className="text-left text-xs font-semibold text-iron-500 uppercase tracking-caps px-3 py-3">Account</th>
                <th className="text-right text-xs font-semibold text-iron-500 uppercase tracking-caps px-3 py-3">Spend</th>
                <th className="text-right text-xs font-semibold text-iron-500 uppercase tracking-caps px-3 py-3">Clicks</th>
                <th className="text-right text-xs font-semibold text-iron-500 uppercase tracking-caps px-3 py-3">CTR</th>
                <th className="text-right text-xs font-semibold text-iron-500 uppercase tracking-caps px-3 py-3">Conv.</th>
                <th className="text-right text-xs font-semibold text-iron-500 uppercase tracking-caps px-3 py-3">CPA</th>
                <th className="text-right text-xs font-semibold text-iron-500 uppercase tracking-caps px-3 py-3">Imp. Share</th>
                <th className="text-right text-xs font-semibold text-iron-500 uppercase tracking-caps px-3 py-3">Budget</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-iron-50">
              {campaigns.map((c, i) => {
                const cpa = num(c.cpa)
                const cpaClass = cpa > 150 ? 'text-red-600 font-semibold' : cpa > 0 && cpa < 75 ? 'text-trust-700 font-semibold' : 'text-navy-800'
                return (
                  <tr key={i} className="hover:bg-canvas-50 transition-colors duration-75">
                    <td className="px-5 py-2.5 text-navy-800 max-w-xs truncate">{String(c.campaign_name)}</td>
                    <td className="px-3 py-2.5 text-iron-600 text-xs whitespace-nowrap">{String(c.account_name)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-navy-800">{fmtCurrency(c.spend)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-iron-600">{fmt(c.clicks)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-iron-600">{fmtPct(c.ctr)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-iron-600">{fmt(c.conversions)}</td>
                    <td className={`px-3 py-2.5 text-right tabular-nums ${cpaClass}`}>{cpa > 0 ? fmtCurrency(cpa) : '—'}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-iron-600">{fmtPct(c.avg_is)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-iron-600">{fmtPct(c.avg_budget_burn)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-iron-100 p-5">
          <h3 className="text-sm font-semibold text-navy-900 mb-4">Quality Score Distribution</h3>
          <div className="space-y-3">
            {sortedBands.map((band) => {
              const kw = num(band.keywords)
              const pct = totalKeywords > 0 ? (kw / totalKeywords) * 100 : 0
              const barColor = String(band.qs_band).startsWith('High') ? 'bg-trust-500'
                : String(band.qs_band).startsWith('Average') ? 'bg-ignite-400'
                : String(band.qs_band).startsWith('Low') ? 'bg-red-500'
                : 'bg-iron-300'
              return (
                <div key={String(band.qs_band)}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-iron-700">{String(band.qs_band)}</span>
                    <span className="text-iron-500 tabular-nums">{fmt(kw)} keywords ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="bg-iron-100 rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-iron-100 p-5">
          <h3 className="text-sm font-semibold text-navy-900 mb-4">Search Term Intelligence</h3>
          {topConverters.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-trust-700 uppercase tracking-caps mb-2">Top Converters</p>
              <div className="space-y-1.5">
                {topConverters.slice(0, 5).map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-navy-800 truncate pr-2">{String(t.search_term)}</span>
                    <span className="text-iron-500 shrink-0 tabular-nums">{fmt(t.conversions)} conv · {fmtCurrency(t.cpa)} CPA</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {wastedSpend.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-600 uppercase tracking-caps mb-2">Wasted Spend</p>
              <div className="space-y-1.5">
                {wastedSpend.slice(0, 5).map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-navy-800 truncate pr-2">{String(t.search_term)}</span>
                    <span className="text-iron-500 shrink-0 tabular-nums">{fmtCurrency(t.spend)} · {fmt(t.clicks)} clicks</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {topConverters.length === 0 && wastedSpend.length === 0 && (
            <p className="text-sm text-iron-400">No search term data available</p>
          )}
        </div>
      </div>
    </div>
  )
}

function CompetitorsTab({ competitors, keywords }: Pick<DashboardData, 'competitors' | 'keywords'>) {
  const domains = Array.from(new Set(competitors.map(c => String(c.target_domain))))
  const maxTraffic = Math.max(...competitors.map(c => num(c.organic_traffic)), 1)

  return (
    <div className="space-y-6">
      {domains.slice(0, 6).map(domain => {
        const rows = competitors.filter(c => String(c.target_domain) === domain).slice(0, 8)
        const accountName = rows[0]?.account_name
        return (
          <div key={domain} className="bg-white rounded-2xl shadow-sm border border-iron-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-iron-100">
              <div className="flex items-baseline gap-2">
                <h3 className="text-sm font-semibold text-navy-900">{String(accountName)}</h3>
                <span className="text-xs text-iron-400">{domain}</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-iron-100 bg-canvas-50">
                    <th className="text-left text-xs font-semibold text-iron-500 uppercase tracking-caps px-5 py-3">Competitor</th>
                    <th className="text-right text-xs font-semibold text-iron-500 uppercase tracking-caps px-3 py-3">Organic KWs</th>
                    <th className="text-right text-xs font-semibold text-iron-500 uppercase tracking-caps px-3 py-3">Organic Traffic</th>
                    <th className="text-right text-xs font-semibold text-iron-500 uppercase tracking-caps px-3 py-3">Paid KWs</th>
                    <th className="text-right text-xs font-semibold text-iron-500 uppercase tracking-caps px-3 py-3">SOV</th>
                    <th className="px-3 py-3 w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-iron-50">
                  {rows.map((c, i) => (
                    <tr key={i} className="hover:bg-canvas-50 transition-colors duration-75">
                      <td className="px-5 py-2.5 text-navy-800 font-medium">{String(c.competitor_label)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-iron-600">{fmt(c.organic_keywords)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-iron-600">{fmt(c.organic_traffic)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-iron-600">{fmt(c.paid_keywords)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-iron-600">{fmtPct(c.organic_sov)}</td>
                      <td className="px-3 py-2.5">
                        <div className="bg-iron-100 rounded-full h-1.5 overflow-hidden w-20">
                          <div className="h-full bg-clarity-500 rounded-full" style={{ width: `${(num(c.organic_traffic) / maxTraffic) * 100}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {keywords.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-iron-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-iron-100">
            <h3 className="text-sm font-semibold text-navy-900">Collision Repair — Market Keyword Volumes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-iron-100 bg-canvas-50">
                  <th className="text-left text-xs font-semibold text-iron-500 uppercase tracking-caps px-5 py-3">Keyword</th>
                  <th className="text-right text-xs font-semibold text-iron-500 uppercase tracking-caps px-3 py-3">Monthly Volume</th>
                  <th className="text-right text-xs font-semibold text-iron-500 uppercase tracking-caps px-3 py-3">CPC</th>
                  <th className="text-right text-xs font-semibold text-iron-500 uppercase tracking-caps px-3 py-3">Competition</th>
                  <th className="text-left text-xs font-semibold text-iron-500 uppercase tracking-caps px-3 py-3">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-iron-50">
                {keywords.map((k, i) => (
                  <tr key={i} className="hover:bg-canvas-50 transition-colors duration-75">
                    <td className="px-5 py-2.5 text-navy-800">{String(k.keyword)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-iron-600">{fmt(k.search_volume)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-iron-600">{k.cpc_usd ? `$${Number(k.cpc_usd).toFixed(2)}` : '—'}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-iron-600">{k.competition ? `${(num(k.competition) * 100).toFixed(0)}%` : '—'}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center rounded-full text-xs font-medium px-2 py-0.5 ${
                        String(k.volume_tier) === 'High Volume' ? 'bg-trust-100 text-trust-700'
                        : String(k.volume_tier) === 'Medium Volume' ? 'bg-clarity-100 text-clarity-700'
                        : 'bg-iron-100 text-iron-600'
                      }`}>
                        {String(k.volume_tier)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function AlertsTab({ alerts }: Pick<DashboardData, 'alerts'>) {
  const critical = alerts.filter(a => String(a.severity).toLowerCase() === 'critical')
  const warnings = alerts.filter(a => String(a.severity).toLowerCase() !== 'critical')

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-iron-100 p-8 text-center">
        <p className="text-trust-700 font-semibold">No active alerts</p>
        <p className="text-sm text-iron-400 mt-1">All metrics are within acceptable ranges.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {critical.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden">
          <div className="px-5 py-3 bg-red-50 border-b border-red-200">
            <span className="text-sm font-semibold text-red-700">
              {critical.length} Critical Alert{critical.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="divide-y divide-iron-100">
            {critical.map((a, i) => (
              <div key={i} className="px-5 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <SeverityBadge severity={String(a.severity)} />
                  <span className="text-xs text-iron-500">{String(a.account_name)}</span>
                  <span className="text-xs text-iron-300">·</span>
                  <span className="text-xs text-iron-400">{fmt(a.hours_open)}h open</span>
                </div>
                <p className="text-sm font-semibold text-navy-900">{String(a.title)}</p>
                <p className="text-xs text-iron-500 mt-0.5">{String(a.detail)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-iron-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-iron-100">
            <span className="text-sm font-semibold text-navy-900">
              {warnings.length} Warning{warnings.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="divide-y divide-iron-100">
            {warnings.map((a, i) => (
              <div key={i} className="px-5 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <SeverityBadge severity={String(a.severity)} />
                  <span className="text-xs text-iron-500">{String(a.account_name)}</span>
                  <span className="text-xs text-iron-300">·</span>
                  <span className="text-xs text-iron-400">{fmt(a.hours_open)}h open</span>
                </div>
                <p className="text-sm font-semibold text-navy-900">{String(a.title)}</p>
                <p className="text-xs text-iron-500 mt-0.5">{String(a.detail)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function TabSwitcher({ alertCount, data }: { alertCount: number; data: DashboardData }) {
  const [activeTab, setActiveTab] = useState<Tab>('executive')

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'executive', label: 'Executive Summary' },
    { id: 'paid-search', label: 'Paid Search' },
    { id: 'competitors', label: 'Competitors' },
    { id: 'alerts', label: 'Alerts', badge: alertCount > 0 ? alertCount : undefined },
  ]

  return (
    <div>
      {/* Tab bar */}
      <div className="border-b border-iron-200 mb-6">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors duration-150
                ${activeTab === tab.id
                  ? 'border-navy-900 text-navy-900'
                  : 'border-transparent text-iron-500 hover:text-navy-700 hover:border-iron-300'
                }
              `}
            >
              {tab.label}
              {tab.badge != null && (
                <span className={`inline-flex items-center justify-center rounded-full text-xs font-semibold min-w-[1.25rem] h-5 px-1 ${
                  activeTab === tab.id ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'executive' && <ExecutiveTab portfolio={data.portfolio} accounts={data.accounts} trend={data.trend} />}
      {activeTab === 'paid-search' && <PaidSearchTab campaigns={data.campaigns} qsBands={data.qsBands} searchTerms={data.searchTerms} />}
      {activeTab === 'competitors' && <CompetitorsTab competitors={data.competitors} keywords={data.keywords} />}
      {activeTab === 'alerts' && <AlertsTab alerts={data.alerts} />}
    </div>
  )
}
