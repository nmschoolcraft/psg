import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { bqQuery, PROJECT_ID, DATASET } from '@/lib/bigquery'
import TabSwitcher, { type DashboardData } from './TabSwitcher'

const P = `\`${PROJECT_ID}.${DATASET}\``

// ─── Queries ─────────────────────────────────────────────────────────────────

const Q = {
  portfolio: `
    SELECT
      SUM(spend) AS total_spend, SUM(clicks) AS total_clicks,
      SUM(impressions) AS total_impressions, SUM(conversions) AS total_conversions,
      SUM(daily_budget) AS total_budget,
      SAFE_DIVIDE(SUM(spend), NULLIF(SUM(daily_budget), 0)) AS portfolio_burn_rate
    FROM ${P}.v_portfolio_summary
    WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  `,
  accounts: `
    SELECT account_name,
      SUM(spend) AS spend, SUM(clicks) AS clicks, SUM(impressions) AS impressions,
      SUM(conversions) AS conversions, AVG(budget_utilization_rate) AS avg_budget_util,
      SAFE_DIVIDE(SUM(clicks), NULLIF(SUM(impressions), 0)) AS avg_ctr
    FROM ${P}.v_executive_summary
    WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
    GROUP BY account_name ORDER BY spend DESC
  `,
  trend: `
    SELECT date, SUM(spend) AS spend, SUM(clicks) AS clicks
    FROM ${P}.v_portfolio_summary
    WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
    GROUP BY date ORDER BY date
  `,
  campaigns: `
    SELECT campaign_name, account_name,
      SUM(spend) AS spend, SUM(clicks) AS clicks, SUM(impressions) AS impressions,
      SUM(conversions) AS conversions,
      SAFE_DIVIDE(SUM(clicks), NULLIF(SUM(impressions), 0)) AS ctr,
      SAFE_DIVIDE(SUM(spend), NULLIF(SUM(conversions), 0)) AS cpa,
      AVG(impression_share) AS avg_is, AVG(budget_burn_rate) AS avg_budget_burn
    FROM ${P}.v_campaign_performance
    WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
    GROUP BY campaign_name, account_name ORDER BY spend DESC LIMIT 25
  `,
  qsBands: `
    SELECT qs_band, COUNT(DISTINCT keyword_text) AS keywords,
      SUM(impressions) AS impressions, SUM(spend) AS spend
    FROM ${P}.v_quality_score_dist
    WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
    GROUP BY qs_band
  `,
  searchTerms: `
    SELECT search_term, account_name, campaign_name, term_category,
      spend, clicks, conversions, cpa, negative_candidate
    FROM ${P}.v_search_term_intel
    WHERE term_category IN ('Top Converter', 'Wasted Spend')
    ORDER BY CASE term_category WHEN 'Top Converter' THEN 0 ELSE 1 END, spend DESC
    LIMIT 60
  `,
  competitors: `
    SELECT account_name, target_domain, competitor_label,
      organic_keywords, organic_traffic, paid_keywords, paid_traffic, organic_sov
    FROM ${P}.v_competitor_landscape
    WHERE pulled_date = (SELECT MAX(pulled_date) FROM ${P}.v_competitor_landscape)
    ORDER BY target_domain, organic_traffic DESC
  `,
  keywords: `
    SELECT keyword, search_volume, cpc_usd, competition, volume_tier
    FROM ${P}.v_keyword_volume
    WHERE pulled_date = (SELECT MAX(pulled_date) FROM ${P}.v_keyword_volume)
    ORDER BY search_volume DESC LIMIT 30
  `,
  alerts: `
    SELECT account_name, alert_type, severity, title, detail, hours_open, generated_at
    FROM ${P}.v_alerts WHERE resolved_at IS NULL
    ORDER BY severity_rank, generated_at DESC
  `,
}

async function safe(sql: string): Promise<Record<string, unknown>[]> {
  try {
    return await bqQuery(sql)
  } catch (e) {
    console.error('BQ query failed:', e)
    return []
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MarketingDashboardPage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  // Parallel fetch — failures return empty arrays (safe())
  const [portfolio, accounts, trend, campaigns, qsBands, searchTerms, competitors, keywords, alerts] =
    await Promise.all([
      safe(Q.portfolio),
      safe(Q.accounts),
      safe(Q.trend),
      safe(Q.campaigns),
      safe(Q.qsBands),
      safe(Q.searchTerms),
      safe(Q.competitors),
      safe(Q.keywords),
      safe(Q.alerts),
    ])

  const data: DashboardData = {
    portfolio: portfolio[0] ?? {},
    accounts,
    trend,
    campaigns,
    qsBands,
    searchTerms,
    competitors,
    keywords,
    alerts,
  }

  const alertCount = alerts.filter(a => String(a.severity).toLowerCase() === 'critical').length

  return (
    <div className="min-h-screen bg-canvas-100">
      <nav className="bg-navy-900 border-b border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">P</span>
            </div>
            <span className="font-display text-white font-semibold">PSG Portal</span>
            <span className="text-iron-500 text-sm hidden sm:block">/ Marketing</span>
          </div>
          <a href="/dashboard" className="text-iron-400 hover:text-white text-sm transition-colors duration-150">
            ← Back
          </a>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-navy-900">Marketing Dashboard</h1>
            <p className="text-iron-500 text-sm mt-0.5">
              Google Ads + SEMrush · Last 30 days · Data refreshes daily
            </p>
          </div>
          {alertCount > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2 shrink-0">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-semibold text-red-700">
                {alertCount} critical alert{alertCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        <TabSwitcher alertCount={alertCount} data={data} />
      </main>
    </div>
  )
}
