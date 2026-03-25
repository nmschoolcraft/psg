-- v_claimant_growth
-- Monthly repair order volume trend for a company, with industry context.
-- "Claimant growth" = growth in RO count (each RO = one claimant/customer event).

CREATE OR REPLACE VIEW `psg_benchmarks.v_claimant_growth` AS
SELECT
  sp.company_id,
  sp.period,
  sp.ro_count,
  -- Month-over-month absolute change
  sp.ro_count - LAG(sp.ro_count) OVER (
    PARTITION BY sp.company_id ORDER BY sp.period
  )                              AS ro_count_mom_delta,
  -- Month-over-month % growth
  ROUND(
    (sp.ro_count - LAG(sp.ro_count) OVER (PARTITION BY sp.company_id ORDER BY sp.period))
    / NULLIF(LAG(sp.ro_count) OVER (PARTITION BY sp.company_id ORDER BY sp.period), 0) * 100,
    2
  )                              AS ro_count_mom_growth_pct,
  ib.ro_count_median             AS industry_median,
  ib.ro_count_p75                AS industry_p75
FROM `psg_benchmarks.shop_performance` sp
JOIN `psg_benchmarks.industry_benchmarks` ib
  ON sp.period = ib.period
ORDER BY sp.company_id, sp.period;
