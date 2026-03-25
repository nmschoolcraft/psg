import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const startTime = Date.now()

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface HealthStatus {
  status: 'ok' | 'degraded' | 'error'
  timestamp: string
  uptime_seconds: number
  version: string
  checks: {
    database: CheckResult
  }
}

interface CheckResult {
  status: 'ok' | 'error'
  latency_ms?: number
  error?: string
}

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    // Lightweight ping — just check connectivity
    const { error } = await supabase.from('_health_check').select('1').limit(1).maybeSingle()
    // If the table doesn't exist, that's fine — connection succeeded
    if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
      throw error
    }
    return { status: 'ok', latency_ms: Date.now() - start }
  } catch (err) {
    return {
      status: 'error',
      latency_ms: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

export async function GET() {
  const dbCheck = await checkDatabase()

  const allOk = dbCheck.status === 'ok'
  const overallStatus: HealthStatus['status'] = allOk ? 'ok' : 'degraded'

  const body: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? 'unknown',
    checks: {
      database: dbCheck,
    },
  }

  const httpStatus = overallStatus === 'ok' ? 200 : 503

  return NextResponse.json(body, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}
