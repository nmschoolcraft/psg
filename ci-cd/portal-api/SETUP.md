# PSG Portal API — CI/CD Setup Instructions

**Target:** `api.psghub.me` (Express service in `api/` subdir)
**Server:** `128.140.81.55` (apps server)
**Deploy dir:** `/srv/dev/psg/portal/api/`
**Repo:** `nmschoolcraft/psg`

---

## Prerequisites

The PSG Portal CI/CD (`deploy.yml` for the Next.js portal) is already live.
This adds a second workflow for the Express API service in the `api/` subdirectory.

---

## One-Time Setup Checklist

### Step 1 — Verify API dir on apps server

```bash
ssh root@128.140.81.55
ls /srv/dev/psg/portal/api/
pm2 list
```

Confirm the API service exists and check how it's currently running (PM2 process name).
If the process is named differently than `psg-portal-api`, update the workflow accordingly.

---

### Step 2 — Create a deploy SSH keypair

On the apps server, generate a dedicated deploy key:

```bash
ssh root@128.140.81.55
ssh-keygen -t ed25519 -C "github-actions-deploy@psg" -f /root/.ssh/gha_deploy -N ""
cat /root/.ssh/gha_deploy.pub >> /root/.ssh/authorized_keys
cat /root/.ssh/gha_deploy  # copy this — it's your GitHub secret
```

> **Note:** Using the existing agent key is also fine if you prefer not to generate a new one.
> Get it with: `cat /paperclip/.ssh/agent_key` on the Paperclip server.

---

### Step 3 — Add GitHub Actions secrets

Go to: `nmschoolcraft/psg` → Settings → Secrets and variables → Actions

Add these 4 secrets:

| Secret name      | Value                                          |
|------------------|------------------------------------------------|
| `DEPLOY_SSH_KEY` | Private key from Step 2 (full contents)        |
| `DEPLOY_HOST`    | `128.140.81.55`                                |
| `DEPLOY_USER`    | `root`                                         |
| `DEPLOY_PORT`    | `22`                                           |

> The portal `deploy.yml` uses Vercel — no SSH secrets needed for it.
> These secrets are only used by `deploy-api.yml`.

---

### Step 4 — Add the workflow file to the repo

Copy `deploy.yml` from this directory into the repo:

```bash
# From a checkout of nmschoolcraft/psg:
mkdir -p .github/workflows
cp ci-cd/portal-api/deploy.yml .github/workflows/deploy-api.yml
git add .github/workflows/deploy-api.yml
git commit -m "Add Portal API deploy pipeline

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
git push origin main
```

---

### Step 5 — Add a /health endpoint (optional but recommended)

The smoke test checks `https://api.psghub.me/health`. Add this to `api/src/index.ts`:

```typescript
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

---

### Step 6 — Test the pipeline

1. Make a small change to `api/` (e.g. add a comment)
2. Push to `main`
3. Go to `nmschoolcraft/psg` → Actions → **Deploy Portal API**
4. Watch the run — confirm SSH connect, build, and PM2 restart succeed

---

## How the pipeline works

- **Trigger:** Any push to `main` that touches `api/**` or the workflow file itself
- **Manual:** Can also trigger via Actions → Deploy Portal API → Run workflow
- **Concurrency:** `cancel-in-progress: false` — no concurrent API deploys
- **Steps:** git pull → npm ci → npm run build → pm2 restart
- **Smoke test:** Hits `https://api.psghub.me/health` and fails if 5xx

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| SSH auth failure | Re-check `DEPLOY_SSH_KEY` secret — must include full header/footer |
| PM2 process not found | SSH to server, `pm2 list`, update process name in workflow |
| Build fails | Check `api/tsconfig.json` and that `npm run build` works locally |
| Smoke test 404 | Add `GET /health` route to `api/src/index.ts` |
