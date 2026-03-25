/**
 * Analytics Benchmarks API
 *
 * GET /api/analytics/benchmarks?companyId={id}&period={YYYY-MM}
 *
 * Returns a benchmark comparison object for the given company + period.
 * Results are cached in the `analytics_cache` Supabase table (TTL: 1 h).
 * On cache miss, queries BigQuery directly.
 *
 * Required env vars:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   GCP_PROJECT_ID
 *   GCP_SA_KEY_JSON          — base64-encoded GCP service account JSON
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { BigQuery } from "@google-cloud/bigquery";
import { createHash } from "crypto";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BenchmarkResponse {
  companyId: string;    // raw (un-hashed) company ID from request
  period: string;
  company: CompanyKPIs;
  industry: IndustryKPIs;
  cachedAt?: string;
}

interface CompanyKPIs {
  csi: number | null;
  roCount: number;
  revenueTotal: number;
  repeatRate: number;
  referralCount: number;
  payTypeMix: { insurance: number; private: number; fleet: number };
}

interface IndustryKPIs {
  csiMedian: number | null;
  csiP75: number | null;
  roCountMedian: number;
  roCountP75: number;
  revenueTotalMedian: number;
  revenueTotalP75: number;
  repeatRateMedian: number;
  repeatRateP75: number;
  referralCountMedian: number;
  referralCountP75: number;
  payTypeInsMedian: number;
  payTypePrivateMedian: number;
  companyCount: number;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID!;
const GCP_SA_KEY_JSON = process.env.GCP_SA_KEY_JSON!;
const DATASET = "psg_benchmarks";
const CACHE_TTL_SECONDS = 3600; // 1 hour

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hashCompanyId(id: string): string {
  return createHash("sha256").update(id).digest("hex");
}

function buildCacheKey(companyId: string, period: string): string {
  return `benchmarks:${hashCompanyId(companyId)}:${period}`;
}

function initBigQuery(): BigQuery {
  const credentials = JSON.parse(
    Buffer.from(GCP_SA_KEY_JSON, "base64").toString("utf8")
  );
  return new BigQuery({ projectId: GCP_PROJECT_ID, credentials });
}

// ─── Cache ───────────────────────────────────────────────────────────────────

async function getCache(
  supabase: SupabaseClient,
  cacheKey: string
): Promise<BenchmarkResponse | null> {
  const { data } = await supabase
    .from("analytics_cache")
    .select("payload, cached_at")
    .eq("cache_key", cacheKey)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!data) return null;
  return { ...data.payload, cachedAt: data.cached_at };
}

async function setCache(
  supabase: SupabaseClient,
  cacheKey: string,
  payload: BenchmarkResponse
): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CACHE_TTL_SECONDS * 1000);

  await supabase.from("analytics_cache").upsert(
    {
      cache_key: cacheKey,
      payload,
      cached_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    },
    { onConflict: "cache_key" }
  );
}

// ─── BigQuery Query ───────────────────────────────────────────────────────────

async function queryBenchmarks(
  bq: BigQuery,
  companyId: string,
  period: string
): Promise<BenchmarkResponse | null> {
  const hashedId = hashCompanyId(companyId);

  const query = `
    SELECT
      sp.company_id,
      sp.period,
      sp.csi_avg,
      sp.ro_count,
      sp.revenue_total,
      sp.repeat_rate,
      sp.referral_count,
      sp.pay_type_breakdown,
      ib.csi_avg_median,
      ib.csi_avg_p75,
      ib.ro_count_median,
      ib.ro_count_p75,
      ib.revenue_total_median,
      ib.revenue_total_p75,
      ib.repeat_rate_median,
      ib.repeat_rate_p75,
      ib.referral_count_median,
      ib.referral_count_p75,
      ib.pay_type_ins_median,
      ib.pay_type_private_median,
      ib.company_count
    FROM \`${GCP_PROJECT_ID}.${DATASET}.shop_performance\` sp
    JOIN \`${GCP_PROJECT_ID}.${DATASET}.industry_benchmarks\` ib
      ON sp.period = ib.period
    WHERE sp.company_id = @hashedId
      AND sp.period = @period
    LIMIT 1
  `;

  const [rows] = await bq.query({
    query,
    params: { hashedId, period },
    location: "US",
  });

  if (!rows.length) return null;

  const r = rows[0];
  let payTypeMix = { insurance: 0, private: 0, fleet: 0 };
  try {
    payTypeMix = JSON.parse(r.pay_type_breakdown);
  } catch {}

  return {
    companyId,
    period: r.period,
    company: {
      csi: r.csi_avg ?? null,
      roCount: Number(r.ro_count),
      revenueTotal: Number(r.revenue_total),
      repeatRate: Number(r.repeat_rate),
      referralCount: Number(r.referral_count),
      payTypeMix,
    },
    industry: {
      csiMedian: r.csi_avg_median ?? null,
      csiP75: r.csi_avg_p75 ?? null,
      roCountMedian: Number(r.ro_count_median),
      roCountP75: Number(r.ro_count_p75),
      revenueTotalMedian: Number(r.revenue_total_median),
      revenueTotalP75: Number(r.revenue_total_p75),
      repeatRateMedian: Number(r.repeat_rate_median),
      repeatRateP75: Number(r.repeat_rate_p75),
      referralCountMedian: Number(r.referral_count_median),
      referralCountP75: Number(r.referral_count_p75),
      payTypeInsMedian: Number(r.pay_type_ins_median),
      payTypePrivateMedian: Number(r.pay_type_private_median),
      companyCount: Number(r.company_count),
    },
  };
}

// ─── Request Handler ─────────────────────────────────────────────────────────

/**
 * Express/Hono-compatible route handler.
 * Expects `req.query.companyId` and `req.query.period`.
 */
export async function getBenchmarks(
  companyId: string | undefined,
  period: string | undefined
): Promise<{ status: number; body: object }> {
  if (!companyId || !period) {
    return {
      status: 400,
      body: { error: "companyId and period (YYYY-MM) are required" },
    };
  }

  if (!/^\d{4}-\d{2}$/.test(period)) {
    return { status: 400, body: { error: "period must be in YYYY-MM format" } };
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const cacheKey = buildCacheKey(companyId, period);

  const cached = await getCache(supabase, cacheKey);
  if (cached) {
    return { status: 200, body: cached };
  }

  const bq = initBigQuery();
  const result = await queryBenchmarks(bq, companyId, period);

  if (!result) {
    return {
      status: 404,
      body: { error: "No benchmark data found for the given companyId and period" },
    };
  }

  await setCache(supabase, cacheKey, result);

  return { status: 200, body: result };
}
