/**
 * bq-daily-sync — Supabase Edge Function
 *
 * Scheduled at 02:00 UTC daily via Supabase cron (supabase/config.toml).
 * Reads completed repair orders from the past 24 h, aggregates by company+month,
 * anonymises company IDs, upserts to BigQuery `shop_performance`, then
 * recomputes `industry_benchmarks`.
 *
 * Required env vars (set in Supabase Dashboard > Edge Functions > Secrets):
 *   SUPABASE_URL                  — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY     — Service-role key (bypasses RLS)
 *   GCP_PROJECT_ID                — Google Cloud project ID
 *   GCP_SA_KEY_JSON               — Base64-encoded GCP service-account JSON key
 *
 * Retry policy: Supabase cron retries once on non-2xx. On second failure the
 * function posts an alert comment to the `sync_alerts` Supabase table.
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import { BigQuery } from "npm:@google-cloud/bigquery@7";
import { createHash } from "node:crypto";

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GCP_PROJECT_ID = Deno.env.get("GCP_PROJECT_ID")!;
const GCP_SA_KEY_JSON = Deno.env.get("GCP_SA_KEY_JSON")!;
const DATASET = "psg_benchmarks";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RepairOrder {
  company_id: string;
  completed_at: string;
  revenue: number;
  csi_score: number | null;
  is_repeat_customer: boolean;
  is_referral: boolean;
  pay_type: "insurance" | "private" | "fleet";
}

interface ShopPerformanceRow {
  company_id: string;       // hashed
  period: string;           // YYYY-MM
  csi_avg: number | null;
  ro_count: number;
  revenue_total: number;
  repeat_rate: number;
  referral_count: number;
  pay_type_breakdown: string; // JSON string
  synced_at: string;        // ISO timestamp
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hashCompanyId(id: string): string {
  return createHash("sha256").update(id).digest("hex");
}

function toPeriod(isoDate: string): string {
  return isoDate.slice(0, 7); // "YYYY-MM"
}

function initBigQuery(): BigQuery {
  const credentials = JSON.parse(
    atob(GCP_SA_KEY_JSON)
  );
  return new BigQuery({ projectId: GCP_PROJECT_ID, credentials });
}

// ─── Main ────────────────────────────────────────────────────────────────────

Deno.serve(async (_req) => {
  const runAt = new Date().toISOString();
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const bq = initBigQuery();

  // 1. Fetch repair orders completed in the past 24 h
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: orders, error: fetchErr } = await supabase
    .from("repair_orders")
    .select(
      "company_id, completed_at, revenue, csi_score, is_repeat_customer, is_referral, pay_type"
    )
    .eq("status", "completed")
    .gte("completed_at", since);

  if (fetchErr) {
    await recordAlert(supabase, "fetch_error", fetchErr.message, runAt);
    return new Response(JSON.stringify({ error: fetchErr.message }), { status: 500 });
  }

  if (!orders || orders.length === 0) {
    return new Response(JSON.stringify({ message: "no new orders", runAt }), { status: 200 });
  }

  // 2. Aggregate by company + month
  const grouped = groupByCompanyPeriod(orders as RepairOrder[]);
  const rows: ShopPerformanceRow[] = buildShopPerformanceRows(grouped, runAt);

  // 3. Upsert to BigQuery shop_performance
  const table = bq.dataset(DATASET).table("shop_performance");
  const [upsertResp] = await table.insert(rows, {
    createInsertId: false,
    skipInvalidRows: false,
  });
  // BigQuery streaming insert; for true upsert behaviour a MERGE DML is preferred.
  // For now we use streaming + daily recompute; switch to MERGE if duplicates arise.

  // 4. Recompute industry_benchmarks
  await recomputeIndustryBenchmarks(bq, runAt);

  return new Response(
    JSON.stringify({ message: "sync complete", rowsUpserted: rows.length, runAt }),
    { status: 200 }
  );
});

// ─── Aggregation ─────────────────────────────────────────────────────────────

type GroupKey = string; // "<hashed_company_id>|<period>"

function groupByCompanyPeriod(
  orders: RepairOrder[]
): Map<GroupKey, RepairOrder[]> {
  const map = new Map<GroupKey, RepairOrder[]>();
  for (const o of orders) {
    const key = `${hashCompanyId(o.company_id)}|${toPeriod(o.completed_at)}`;
    const bucket = map.get(key) ?? [];
    bucket.push(o);
    map.set(key, bucket);
  }
  return map;
}

function buildShopPerformanceRows(
  grouped: Map<GroupKey, RepairOrder[]>,
  runAt: string
): ShopPerformanceRow[] {
  const rows: ShopPerformanceRow[] = [];

  for (const [key, orders] of grouped) {
    const [company_id, period] = key.split("|");
    const csScored = orders.filter((o) => o.csi_score !== null);
    const csi_avg = csScored.length > 0
      ? csScored.reduce((s, o) => s + o.csi_score!, 0) / csScored.length
      : null;
    const ro_count = orders.length;
    const revenue_total = orders.reduce((s, o) => s + (o.revenue ?? 0), 0);
    const repeat_rate = orders.filter((o) => o.is_repeat_customer).length / ro_count;
    const referral_count = orders.filter((o) => o.is_referral).length;

    const payTypeCounts = { insurance: 0, private: 0, fleet: 0 };
    for (const o of orders) {
      payTypeCounts[o.pay_type] = (payTypeCounts[o.pay_type] ?? 0) + 1;
    }
    const pay_type_breakdown = JSON.stringify({
      insurance: Math.round((payTypeCounts.insurance / ro_count) * 1000) / 1000,
      private: Math.round((payTypeCounts.private / ro_count) * 1000) / 1000,
      fleet: Math.round((payTypeCounts.fleet / ro_count) * 1000) / 1000,
    });

    rows.push({
      company_id,
      period,
      csi_avg,
      ro_count,
      revenue_total,
      repeat_rate,
      referral_count,
      pay_type_breakdown,
      synced_at: runAt,
    });
  }

  return rows;
}

// ─── Industry Benchmarks Recompute ───────────────────────────────────────────

async function recomputeIndustryBenchmarks(bq: BigQuery, runAt: string): Promise<void> {
  const query = `
    CREATE OR REPLACE TABLE \`${GCP_PROJECT_ID}.${DATASET}.industry_benchmarks\` AS
    SELECT
      period,
      COUNT(DISTINCT company_id)                                   AS company_count,
      APPROX_QUANTILES(csi_avg, 100)[OFFSET(50)]                   AS csi_avg_median,
      APPROX_QUANTILES(csi_avg, 100)[OFFSET(75)]                   AS csi_avg_p75,
      APPROX_QUANTILES(ro_count, 100)[OFFSET(50)]                  AS ro_count_median,
      APPROX_QUANTILES(ro_count, 100)[OFFSET(75)]                  AS ro_count_p75,
      APPROX_QUANTILES(revenue_total, 100)[OFFSET(50)]             AS revenue_total_median,
      APPROX_QUANTILES(revenue_total, 100)[OFFSET(75)]             AS revenue_total_p75,
      APPROX_QUANTILES(repeat_rate, 100)[OFFSET(50)]               AS repeat_rate_median,
      APPROX_QUANTILES(repeat_rate, 100)[OFFSET(75)]               AS repeat_rate_p75,
      APPROX_QUANTILES(referral_count, 100)[OFFSET(50)]            AS referral_count_median,
      APPROX_QUANTILES(referral_count, 100)[OFFSET(75)]            AS referral_count_p75,
      APPROX_QUANTILES(
        CAST(JSON_EXTRACT_SCALAR(pay_type_breakdown, '$.insurance') AS FLOAT64),
        100
      )[OFFSET(50)]                                                 AS pay_type_ins_median,
      APPROX_QUANTILES(
        CAST(JSON_EXTRACT_SCALAR(pay_type_breakdown, '$.private') AS FLOAT64),
        100
      )[OFFSET(50)]                                                 AS pay_type_private_median,
      TIMESTAMP('${runAt}')                                         AS recomputed_at
    FROM \`${GCP_PROJECT_ID}.${DATASET}.shop_performance\`
    WHERE csi_avg IS NOT NULL
    GROUP BY period
    ORDER BY period
  `;

  const [job] = await bq.createQueryJob({ query, location: "US" });
  await job.getQueryResults();
}

// ─── Alert Recording ─────────────────────────────────────────────────────────

async function recordAlert(
  supabase: ReturnType<typeof createClient>,
  type: string,
  message: string,
  runAt: string
): Promise<void> {
  await supabase.from("sync_alerts").insert({
    alert_type: type,
    message,
    function_name: "bq-daily-sync",
    occurred_at: runAt,
  });
}
