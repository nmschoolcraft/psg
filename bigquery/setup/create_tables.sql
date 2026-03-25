-- BigQuery Table Definitions for psg_benchmarks dataset
-- Run after create_dataset.sql.

-- ─────────────────────────────────────────────────────────────────────────────
-- shop_performance
-- Anonymized, aggregated repair-order metrics per company per calendar month.
-- company_id is a SHA-256 hex digest of the raw Supabase company UUID.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `psg_benchmarks.shop_performance` (
  company_id         STRING    NOT NULL  OPTIONS(description = 'SHA-256 hash of Supabase company UUID'),
  period             STRING    NOT NULL  OPTIONS(description = 'Calendar month in YYYY-MM format'),
  csi_avg            FLOAT64             OPTIONS(description = 'Average customer satisfaction index score (0–100)'),
  ro_count           INT64               OPTIONS(description = 'Number of completed repair orders'),
  revenue_total      FLOAT64             OPTIONS(description = 'Total revenue in USD'),
  repeat_rate        FLOAT64             OPTIONS(description = 'Fraction of customers with >1 RO in trailing 12 months'),
  referral_count     INT64               OPTIONS(description = 'Number of new customers attributed to referral'),
  pay_type_breakdown JSON                OPTIONS(description = 'JSON object: {insurance: %, private: %, fleet: %}'),
  synced_at          TIMESTAMP           OPTIONS(description = 'UTC timestamp of last ETL upsert')
)
PARTITION BY RANGE_BUCKET(CAST(REPLACE(period, '-', '') AS INT64), GENERATE_ARRAY(202001, 203001, 1))
CLUSTER BY company_id
OPTIONS (
  description = 'Per-company monthly KPIs — anonymized'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- industry_benchmarks
-- Aggregated cross-company statistics per calendar month.
-- Recomputed fully on each daily sync run.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `psg_benchmarks.industry_benchmarks` (
  period                  STRING    NOT NULL  OPTIONS(description = 'Calendar month in YYYY-MM format'),
  company_count           INT64               OPTIONS(description = 'Number of shops contributing to this period'),
  csi_avg_median          FLOAT64             OPTIONS(description = 'Median CSI across all shops'),
  csi_avg_p75             FLOAT64             OPTIONS(description = 'Top-quartile (75th pct) CSI'),
  ro_count_median         FLOAT64             OPTIONS(description = 'Median RO count'),
  ro_count_p75            FLOAT64             OPTIONS(description = '75th percentile RO count'),
  revenue_total_median    FLOAT64             OPTIONS(description = 'Median monthly revenue'),
  revenue_total_p75       FLOAT64             OPTIONS(description = '75th percentile monthly revenue'),
  repeat_rate_median      FLOAT64             OPTIONS(description = 'Median repeat customer rate'),
  repeat_rate_p75         FLOAT64             OPTIONS(description = '75th percentile repeat rate'),
  referral_count_median   FLOAT64             OPTIONS(description = 'Median referral count'),
  referral_count_p75      FLOAT64             OPTIONS(description = '75th percentile referral count'),
  pay_type_ins_median     FLOAT64             OPTIONS(description = 'Median insurance pay fraction'),
  pay_type_private_median FLOAT64             OPTIONS(description = 'Median private pay fraction'),
  recomputed_at           TIMESTAMP           OPTIONS(description = 'UTC timestamp of last recompute')
)
PARTITION BY RANGE_BUCKET(CAST(REPLACE(period, '-', '') AS INT64), GENERATE_ARRAY(202001, 203001, 1))
OPTIONS (
  description = 'Industry-wide monthly benchmark aggregates'
);
