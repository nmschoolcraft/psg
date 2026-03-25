-- v_pay_type_mix
-- Insurance vs. private pay breakdown for a company vs. industry median.
-- pay_type_breakdown JSON schema: { "insurance": 0.72, "private": 0.20, "fleet": 0.08 }

CREATE OR REPLACE VIEW `psg_benchmarks.v_pay_type_mix` AS
SELECT
  sp.company_id,
  sp.period,
  ROUND(CAST(JSON_EXTRACT_SCALAR(sp.pay_type_breakdown, '$.insurance') AS FLOAT64) * 100, 2)
                                    AS insurance_pct,
  ROUND(CAST(JSON_EXTRACT_SCALAR(sp.pay_type_breakdown, '$.private') AS FLOAT64) * 100, 2)
                                    AS private_pct,
  ROUND(CAST(JSON_EXTRACT_SCALAR(sp.pay_type_breakdown, '$.fleet') AS FLOAT64) * 100, 2)
                                    AS fleet_pct,
  ROUND(ib.pay_type_ins_median * 100, 2)
                                    AS industry_insurance_median_pct,
  ROUND(ib.pay_type_private_median * 100, 2)
                                    AS industry_private_median_pct
FROM `psg_benchmarks.shop_performance` sp
JOIN `psg_benchmarks.industry_benchmarks` ib
  ON sp.period = ib.period
ORDER BY sp.company_id, sp.period;
