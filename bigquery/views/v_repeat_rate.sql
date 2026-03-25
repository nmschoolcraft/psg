-- v_repeat_rate
-- Repeat customer rate trend for a company vs. industry.

CREATE OR REPLACE VIEW `psg_benchmarks.v_repeat_rate` AS
SELECT
  sp.company_id,
  sp.period,
  ROUND(sp.repeat_rate * 100, 2)              AS repeat_rate_pct,
  ROUND(ib.repeat_rate_median * 100, 2)       AS industry_median_pct,
  ROUND(ib.repeat_rate_p75 * 100, 2)          AS industry_p75_pct,
  -- Company vs. industry gap in percentage points
  ROUND((sp.repeat_rate - ib.repeat_rate_median) * 100, 2)
                                              AS vs_median_pp
FROM `psg_benchmarks.shop_performance` sp
JOIN `psg_benchmarks.industry_benchmarks` ib
  ON sp.period = ib.period
ORDER BY sp.company_id, sp.period;
