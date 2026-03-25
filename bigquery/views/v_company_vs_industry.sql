-- v_company_vs_industry
-- For a given company, their KPIs vs. industry median and top quartile.
-- Usage: SELECT * FROM `psg_benchmarks.v_company_vs_industry`
--        WHERE company_id = '<hashed-id>' AND period = '2026-02'

CREATE OR REPLACE VIEW `psg_benchmarks.v_company_vs_industry` AS
SELECT
  sp.company_id,
  sp.period,

  -- CSI
  sp.csi_avg                                    AS csi,
  ib.csi_avg_median                             AS csi_industry_median,
  ib.csi_avg_p75                                AS csi_industry_p75,
  ROUND((sp.csi_avg - ib.csi_avg_median) / NULLIF(ib.csi_avg_median, 0) * 100, 2)
                                                AS csi_vs_median_pct,

  -- Repair order volume
  sp.ro_count                                   AS ro_count,
  ib.ro_count_median                            AS ro_count_industry_median,
  ib.ro_count_p75                               AS ro_count_industry_p75,
  ROUND((sp.ro_count - ib.ro_count_median) / NULLIF(ib.ro_count_median, 0) * 100, 2)
                                                AS ro_count_vs_median_pct,

  -- Revenue
  sp.revenue_total                              AS revenue_total,
  ib.revenue_total_median                       AS revenue_industry_median,
  ib.revenue_total_p75                          AS revenue_industry_p75,
  ROUND((sp.revenue_total - ib.revenue_total_median) / NULLIF(ib.revenue_total_median, 0) * 100, 2)
                                                AS revenue_vs_median_pct,

  -- Repeat rate
  sp.repeat_rate                                AS repeat_rate,
  ib.repeat_rate_median                         AS repeat_rate_industry_median,
  ib.repeat_rate_p75                            AS repeat_rate_industry_p75,

  -- Referrals
  sp.referral_count                             AS referral_count,
  ib.referral_count_median                      AS referral_count_industry_median,
  ib.referral_count_p75                         AS referral_count_industry_p75,

  -- Pay mix
  sp.pay_type_breakdown                         AS pay_type_breakdown,
  ib.pay_type_ins_median                        AS pay_type_ins_industry_median,
  ib.pay_type_private_median                    AS pay_type_private_industry_median

FROM `psg_benchmarks.shop_performance` sp
JOIN `psg_benchmarks.industry_benchmarks` ib
  ON sp.period = ib.period;
