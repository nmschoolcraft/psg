# PSG Portal — Infrastructure Runbook

## Services

| Service | Purpose | URL / Location |
|---|---|---|
| Vercel | App hosting | portal.psgweb.me |
| Cloudflare | DNS + CDN | psgweb.me zone |
| Supabase (prod) | DB + Auth | TBD after provisioning |
| Supabase (staging) | DB + Auth | TBD after provisioning |
| Sentry | Error monitoring | psg / psg-portal project |
| UptimeRobot | Health monitoring | TBD after provisioning |
| GitHub Actions | CI/CD | .github/workflows/ |

---

## Vercel Setup (One-time)

1. Log into Vercel → New Project
2. Import GitHub repo: `nmschoolcraft/psg`
3. Framework preset: **Next.js**
4. Configure domains:
   - Add `portal.psgweb.me` as a custom domain
   - Vercel will provide CNAME/A record values for Cloudflare
5. Copy **Org ID** and **Project ID** from Vercel project settings
6. Create a Vercel token: Vercel → Account Settings → Tokens
7. Add to GitHub Secrets:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

---

## Cloudflare DNS Setup

After getting Vercel's domain verification values:

```
Type: CNAME
Name: portal
Value: cname.vercel-dns.com
Proxy: Enabled (orange cloud)
TTL: Auto
```

SSL/TLS settings in Cloudflare:
- Mode: **Full (Strict)**
- Always Use HTTPS: On
- Minimum TLS Version: 1.2

---

## Supabase Setup (One-time per environment)

### Production

1. Create new project: `psg-portal-prod`
2. Region: US East (closest to shop owners)
3. Copy credentials from Settings → API:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service Role Key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret)
4. Add all three to GitHub Secrets and Vercel Environment Variables (Production)

### Staging

1. Create new project: `psg-portal-staging`
2. Same region
3. Copy credentials → add to GitHub Secrets and Vercel Environment Variables (Preview)

---

## Sentry Setup (One-time)

1. Create project in Sentry org: `psg`
   - Platform: **Next.js**
   - Project name: `psg-portal`
2. Copy DSN → `NEXT_PUBLIC_SENTRY_DSN`
3. Create auth token: Sentry → Settings → Auth Tokens (scopes: `project:releases`, `org:read`)
   → `SENTRY_AUTH_TOKEN`
4. Add all three to GitHub Secrets:
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `SENTRY_AUTH_TOKEN`
   - `SENTRY_ORG` = `psg`
   - `SENTRY_PROJECT` = `psg-portal`

---

## UptimeRobot Setup (One-time)

1. Create monitor:
   - Type: HTTP(s)
   - URL: `https://portal.psgweb.me/api/health`
   - Interval: **5 minutes**
   - Alert: on **2+ consecutive failures**
2. Alert contacts: add team email / Slack webhook
3. Status page: create public status page (optional)

---

## GitHub Actions Summary

| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | Every PR | Lint, typecheck, build |
| `deploy.yml` | Merge to main | Deploy to Vercel prod + upload Sentry source maps |
| `deploy.yml` | Pull request | Deploy preview + comment URL on PR |

Expected PR → production deploy time: **< 3 minutes**

---

## Required GitHub Secrets

| Secret | Source | Used by |
|---|---|---|
| `VERCEL_TOKEN` | Vercel account settings | deploy.yml |
| `VERCEL_ORG_ID` | Vercel project settings | deploy.yml |
| `VERCEL_PROJECT_ID` | Vercel project settings | deploy.yml |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard | ci.yml, deploy.yml |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard | ci.yml, deploy.yml |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard | deploy.yml |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry project | ci.yml, deploy.yml |
| `SENTRY_AUTH_TOKEN` | Sentry auth tokens | ci.yml, deploy.yml |
| `SENTRY_ORG` | Sentry org slug | ci.yml, deploy.yml |
| `SENTRY_PROJECT` | Sentry project slug | ci.yml, deploy.yml |

---

## Health Check Endpoint

`GET /api/health`

Returns `200 OK` when all checks pass, `503` when degraded.

```json
{
  "status": "ok",
  "timestamp": "2026-03-25T17:00:00Z",
  "uptime_seconds": 3600,
  "version": "abc1234",
  "checks": {
    "database": { "status": "ok", "latency_ms": 12 }
  }
}
```
