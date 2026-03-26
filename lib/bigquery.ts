import { createSign } from 'crypto'
import { readFileSync } from 'fs'
import { join } from 'path'

const BQ_BASE = 'https://bigquery.googleapis.com/bigquery/v2'
const TOKEN_URI = 'https://oauth2.googleapis.com/token'
const BQ_SCOPE = 'https://www.googleapis.com/auth/bigquery'

export const PROJECT_ID = 'bright-coyote-491316-q1'
export const DATASET = 'psg_marketing'

let tokenCache: string | null = null
let tokenExpiry = 0

function getServiceAccount() {
  // Prefer env var; fall back to file at project root (dev)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
  }
  const filePath = join(process.cwd(), 'google-ads.config.json')
  const raw = readFileSync(filePath, 'utf8')
  const cfg = JSON.parse(raw)
  // google-ads.config.json wraps the SA under service_account key
  return cfg.service_account ?? cfg
}

async function getToken(): Promise<string> {
  const now = Date.now() / 1000
  if (tokenCache && now < tokenExpiry - 60) return tokenCache

  const sa = getServiceAccount()
  const iat = Math.floor(now)
  const exp = iat + 3600

  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({ iss: sa.client_email, scope: BQ_SCOPE, aud: TOKEN_URI, exp, iat })
  ).toString('base64url')
  const sign = createSign('RSA-SHA256')
  sign.update(`${header}.${payload}`)
  const jwt = `${header}.${payload}.${sign.sign(sa.private_key, 'base64url')}`

  const res = await fetch(TOKEN_URI, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!res.ok) throw new Error(`BQ token error: ${await res.text()}`)
  const data = await res.json()
  tokenCache = data.access_token
  tokenExpiry = exp
  return tokenCache!
}

function parseRows(res: { schema?: { fields: { name: string }[] }; rows?: { f: { v: unknown }[] }[] }): Record<string, unknown>[] {
  if (!res.schema || !res.rows) return []
  const fields = res.schema.fields.map((f) => f.name)
  return res.rows.map((row) =>
    Object.fromEntries(row.f.map((cell, i) => [fields[i], cell.v]))
  )
}

export async function bqQuery(sql: string): Promise<Record<string, unknown>[]> {
  const token = await getToken()

  const res = await fetch(`${BQ_BASE}/projects/${PROJECT_ID}/queries`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql, useLegacySql: false, timeoutMs: 30000 }),
    // Next.js fetch cache: revalidate every 5 minutes
    next: { revalidate: 300 },
  })

  if (!res.ok) throw new Error(`BQ query error (${res.status}): ${await res.text()}`)
  const data = await res.json()

  if (data.jobComplete) return parseRows(data)

  // Poll for async jobs
  const jobId = data.jobReference?.jobId
  if (!jobId) throw new Error('No jobId returned from BQ')

  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 2000 * Math.min(i + 1, 3)))
    const pollRes = await fetch(`${BQ_BASE}/projects/${PROJECT_ID}/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const job = await pollRes.json()
    if (job.status?.state === 'DONE') {
      if (job.status.errorResult) throw new Error(`BQ job failed: ${JSON.stringify(job.status.errorResult)}`)
      const rowsRes = await fetch(
        `${BQ_BASE}/projects/${PROJECT_ID}/queries/${jobId}?maxResults=5000&timeoutMs=30000`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      return parseRows(await rowsRes.json())
    }
  }
  throw new Error('BQ query timed out after polling')
}
