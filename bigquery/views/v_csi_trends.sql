-- v_csi_trends
-- Monthly CSI trend for a company vs. the industry median.
-- Usage: SELECT * FROM `psg_benchmarks.v_csi_trends`
--        WHERE company_id = '<hashed-id>'
--        ORDER BY period

CREATE OR REPLACE VIEW `psg_benchmarks.v_csi_trends` AS
SELECT
  sp.company_id,
  sp.period,
  sp.csi_avg                  AS csi,
  ib.csi_avg_median           AS industry_median,
  ib.csi_avg_p75              AS industry_p75,
  -- Month-over-month delta for the company
  sp.csi_avg - LAG(sp.csi_avg) OVER (
    PARTITION BY sp.company_id ORDER BY sp.period
  )                           AS csi_mom_delta
FROM `psg_benchmarks.shop_performance` sp
JOIN `psg_benchmarks.industry_benchmarks` ib
  ON sp.period = ib.period
ORDER BY sp.company_id, sp.period;
