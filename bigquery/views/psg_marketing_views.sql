-- PSG Marketing Dashboard — BigQuery Views
-- Dataset: bright-coyote-491316-q1.psg_marketing
-- These views power each layer of the Looker Studio dashboard.
-- Run via: node dashboard/create-views.js

-- ─────────────────────────────────────────────────────────────
-- Layer 1 — Executive Summary
-- One row per account per date. KPI tiles + trend lines.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW `bright-coyote-491316-q1.psg_marketing.v_executive_summary` AS
SELECT
  date,
  account_name,
  customer_id,
  SUM(cost_micros) / 1000000                                          AS spend,
  SUM(clicks)                                                          AS clicks,
  SUM(impressions)                                                     AS impressions,
  SUM(conversions)                                                     AS conversions,
  SAFE_DIVIDE(SUM(cost_micros) / 1000000, NULLIF(SUM(conversions), 0)) AS cost_per_conversion,
  SAFE_DIVIDE(SUM(clicks), NULLIF(SUM(impressions), 0))               AS ctr,
  -- Budget utilization (sum actual spend vs sum of daily budgets)
  SUM(budget_micros) / 1000000                                         AS daily_budget,
  SAFE_DIVIDE(SUM(cost_micros), NULLIF(SUM(budget_micros), 0))        AS budget_utilization_rate,
  -- Impression share (weighted by impressions)
  SAFE_DIVIDE(
    SUM(impression_share * impressions),
    NULLIF(SUM(impressions), 0)
  )                                                                    AS weighted_impression_share
FROM `bright-coyote-491316-q1.psg_marketing.ads_campaign_daily`
GROUP BY date, account_name, customer_id;

-- ─────────────────────────────────────────────────────────────
-- Layer 1 — Cross-account totals (for top-level KPI scorecards)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW `bright-coyote-491316-q1.psg_marketing.v_portfolio_summary` AS
SELECT
  date,
  'All Accounts'                                                       AS account_name,
  SUM(cost_micros) / 1000000                                          AS spend,
  SUM(clicks)                                                          AS clicks,
  SUM(impressions)                                                     AS impressions,
  SUM(conversions)                                                     AS conversions,
  SAFE_DIVIDE(SUM(cost_micros) / 1000000, NULLIF(SUM(conversions), 0)) AS cost_per_conversion,
  SAFE_DIVIDE(SUM(clicks), NULLIF(SUM(impressions), 0))               AS ctr,
  SUM(budget_micros) / 1000000                                         AS daily_budget,
  SAFE_DIVIDE(SUM(cost_micros), NULLIF(SUM(budget_micros), 0))        AS budget_utilization_rate
FROM `bright-coyote-491316-q1.psg_marketing.ads_campaign_daily`
GROUP BY date;

-- ─────────────────────────────────────────────────────────────
-- Layer 2 — Campaign Performance (spend, IS, budget burn)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW `bright-coyote-491316-q1.psg_marketing.v_campaign_performance` AS
SELECT
  date,
  account_name,
  customer_id,
  campaign_id,
  campaign_name,
  campaign_status,
  channel_type,
  bidding_strategy,
  impressions,
  clicks,
  cost_micros / 1000000                                               AS spend,
  conversions,
  impression_share,
  abs_top_is,
  budget_micros / 1000000                                             AS daily_budget,
  -- CPA
  SAFE_DIVIDE(cost_micros / 1000000, NULLIF(conversions, 0))         AS cpa,
  -- Budget burn rate
  SAFE_DIVIDE(cost_micros, NULLIF(budget_micros, 0))                  AS budget_burn_rate,
  -- CTR
  SAFE_DIVIDE(clicks, NULLIF(impressions, 0))                         AS ctr,
  -- Lead source classification based on campaign name keywords
  CASE
    WHEN LOWER(campaign_name) LIKE '%brand%' OR LOWER(campaign_name) LIKE '%[b]%'
      THEN 'Branded'
    WHEN LOWER(campaign_name) LIKE '%competitor%' OR LOWER(campaign_name) LIKE '%compet%'
      OR LOWER(campaign_name) LIKE '%vs%'
      THEN 'Competitor'
    ELSE 'Non-Branded'
  END                                                                  AS lead_source_type
FROM `bright-coyote-491316-q1.psg_marketing.ads_campaign_daily`;

-- ─────────────────────────────────────────────────────────────
-- Layer 2 — Quality Score Distribution
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW `bright-coyote-491316-q1.psg_marketing.v_quality_score_dist` AS
SELECT
  date,
  account_name,
  customer_id,
  campaign_name,
  keyword_text,
  match_type,
  quality_score,
  impressions,
  clicks,
  cost_micros / 1000000                                               AS spend,
  conversions,
  SAFE_DIVIDE(clicks, NULLIF(impressions, 0))                         AS ctr,
  -- QS band for grouping
  CASE
    WHEN quality_score >= 8 THEN 'High (8-10)'
    WHEN quality_score >= 5 THEN 'Average (5-7)'
    WHEN quality_score IS NOT NULL THEN 'Low (1-4)'
    ELSE 'Unknown'
  END                                                                  AS qs_band
FROM `bright-coyote-491316-q1.psg_marketing.ads_keyword_daily`;

-- ─────────────────────────────────────────────────────────────
-- Layer 2 — Search Term Intelligence
-- Classifies terms as: Top Converter, Wasted Spend, New Opportunity, Excluded
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW `bright-coyote-491316-q1.psg_marketing.v_search_term_intel` AS
WITH term_agg AS (
  SELECT
    account_name,
    customer_id,
    campaign_name,
    search_term,
    match_status,
    MIN(date) AS first_seen,
    MAX(date) AS last_seen,
    SUM(impressions)                AS impressions,
    SUM(clicks)                     AS clicks,
    SUM(cost_micros) / 1000000      AS spend,
    SUM(conversions)                AS conversions,
    COUNT(DISTINCT date)            AS days_active
  FROM `bright-coyote-491316-q1.psg_marketing.ads_search_term_daily`
  GROUP BY account_name, customer_id, campaign_name, search_term, match_status
)
SELECT
  *,
  SAFE_DIVIDE(conversions, NULLIF(clicks, 0))         AS conversion_rate,
  SAFE_DIVIDE(spend, NULLIF(conversions, 0))          AS cpa,
  SAFE_DIVIDE(clicks, NULLIF(impressions, 0))         AS ctr,
  CASE
    WHEN conversions >= 1 THEN 'Top Converter'
    WHEN clicks >= 5 AND conversions = 0 THEN 'Wasted Spend'
    WHEN match_status = 'EXCLUDED' THEN 'Excluded / Negative'
    WHEN first_seen >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) THEN 'New Term'
    ELSE 'Emerging'
  END                                                  AS term_category,
  -- Negative keyword recommendation flag
  CASE
    WHEN clicks >= 10 AND conversions = 0 AND spend > 20 THEN TRUE
    ELSE FALSE
  END                                                  AS negative_candidate
FROM term_agg;

-- ─────────────────────────────────────────────────────────────
-- Layer 4 — Competitor Landscape (SEMrush)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW `bright-coyote-491316-q1.psg_marketing.v_competitor_landscape` AS
SELECT
  pulled_date,
  account_name,
  target_domain,
  competitor_domain,
  COALESCE(NULLIF(competitor_name, ''), competitor_domain) AS competitor_label,
  CAST(organic_keywords AS INT64)   AS organic_keywords,
  CAST(organic_traffic AS INT64)    AS organic_traffic,
  CAST(paid_keywords AS INT64)      AS paid_keywords,
  CAST(paid_traffic AS INT64)       AS paid_traffic,
  -- Share of voice proxy: % of total organic traffic in competitive set
  SAFE_DIVIDE(
    CAST(organic_traffic AS INT64),
    SUM(CAST(organic_traffic AS INT64)) OVER (PARTITION BY pulled_date, target_domain)
  )                                  AS organic_sov
FROM `bright-coyote-491316-q1.psg_marketing.semrush_competitor_daily`;

-- ─────────────────────────────────────────────────────────────
-- Layer 4 — Keyword Volume (SEMrush collision repair market)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW `bright-coyote-491316-q1.psg_marketing.v_keyword_volume` AS
SELECT
  pulled_date,
  keyword,
  database,
  search_volume,
  cpc_usd,
  competition,
  CASE
    WHEN search_volume >= 10000 THEN 'High Volume'
    WHEN search_volume >= 1000  THEN 'Medium Volume'
    ELSE 'Low Volume'
  END AS volume_tier
FROM `bright-coyote-491316-q1.psg_marketing.semrush_keyword_volume`;

-- ─────────────────────────────────────────────────────────────
-- Layer 5 — Alerts Queue
-- Active (unresolved) alerts sorted by severity and recency
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW `bright-coyote-491316-q1.psg_marketing.v_alerts` AS
SELECT
  id,
  generated_at,
  account_name,
  customer_id,
  alert_type,
  severity,
  title,
  detail,
  action_url,
  resolved_at,
  CASE WHEN resolved_at IS NULL THEN 'Active' ELSE 'Resolved' END AS alert_status,
  CASE severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END AS severity_rank,
  TIMESTAMP_DIFF(CURRENT_TIMESTAMP(), generated_at, HOUR) AS hours_open
FROM `bright-coyote-491316-q1.psg_marketing.alerts_active`
ORDER BY severity_rank, generated_at DESC;

-- ─────────────────────────────────────────────────────────────
-- Looker Studio: Combined date-range view for filter controls
-- Used as a base connector with date dimension
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW `bright-coyote-491316-q1.psg_marketing.v_date_spine` AS
SELECT date
FROM `bright-coyote-491316-q1.psg_marketing.ads_campaign_daily`
GROUP BY date
ORDER BY date;
