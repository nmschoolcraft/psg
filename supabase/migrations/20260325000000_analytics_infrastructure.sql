-- Migration: analytics infrastructure
-- Creates the analytics_cache and sync_alerts tables used by the
-- bq-daily-sync edge function and the analytics API.

-- ─────────────────────────────────────────────────────────────────────────────
-- analytics_cache
-- Supabase-side cache for BigQuery benchmark query results.
-- Avoids redundant BQ queries; TTL is enforced by the API layer (default 1 h).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_cache (
  cache_key   TEXT        PRIMARY KEY,            -- e.g. "benchmarks:<hashed_company_id>:<period>"
  payload     JSONB       NOT NULL,
  cached_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS analytics_cache_expires_idx
  ON analytics_cache (expires_at);

-- Cleanup function: purge stale cache entries (call from a pg_cron job)
CREATE OR REPLACE FUNCTION purge_expired_analytics_cache()
RETURNS void LANGUAGE sql AS $$
  DELETE FROM analytics_cache WHERE expires_at < now();
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- sync_alerts
-- Failures recorded by the bq-daily-sync edge function.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sync_alerts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type      TEXT        NOT NULL,
  message         TEXT,
  function_name   TEXT        NOT NULL,
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at     TIMESTAMPTZ,
  resolved_by     TEXT
);

CREATE INDEX IF NOT EXISTS sync_alerts_unresolved_idx
  ON sync_alerts (occurred_at)
  WHERE resolved_at IS NULL;

-- Row-level security: analytics_cache is service-role only (no anon reads)
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_alerts     ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS by default; no additional policies needed for now.
