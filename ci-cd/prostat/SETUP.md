# ProStat CI/CD — Setup Instructions

**Target:** `app.prostatgun.com`
**Server:** `144.76.216.70` (PSG Dev Server, cPanel)
**Docroot:** `/home/prostatgun/public_html/`
**Repo:** `Phoenix-Solutions-Group/prostat_files`

---

## One-Time Setup Checklist

### Step 1 — Verify docroot is a git repo pointed at `prostat_files`

SSH into the server:

```bash
ssh root@144.76.216.70
cd /home/prostatgun/public_html
git remote -v
git status
```

Expected output should show `origin` pointing to `git@github.com:Phoenix-Solutions-Group/prostat_files.git`.

If the directory is **not** a git repo, initialise it:

```bash
cd /home/prostatgun/public_html
git init
git remote add origin git@github.com:Phoenix-Solutions-Group/prostat_files.git
git fetch origin main
git reset --hard origin/main
```

If it is a git repo but pointing somewhere else, update the remote:

```bash
git remote set-url origin git@github.com:Phoenix-Solutions-Group/prostat_files.git
```

---

### Step 2 — Set up the deploy SSH keypair

The existing deploy key is at `/home/prostatgun/.ssh/prostat_files_deploy`.

Check if it still works:

```bash
ssh -T -i /home/prostatgun/.ssh/prostat_files_deploy git@github.com
```

If it fails, generate a new one:

```bash
ssh-keygen -t ed25519 -C "prostat-deploy@144.76.216.70" -f /home/prostatgun/.ssh/prostat_files_deploy -N ""
cat /home/prostatgun/.ssh/prostat_files_deploy.pub
```

Add the public key to GitHub:
`Phoenix-Solutions-Group/prostat_files` → Settings → Deploy keys → Add deploy key
Title: `PSG Dev Server Deploy`
Key: (paste public key contents)
Allow write access: **No** (read-only is sufficient for pull)

Ensure the deploy user's SSH config uses this key for GitHub:

```bash
cat >> /home/prostatgun/.ssh/config << 'EOF'
Host github.com
  IdentityFile /home/prostatgun/.ssh/prostat_files_deploy
  StrictHostKeyChecking no
EOF
```

---

### Step 3 — Add GitHub Actions secrets

Go to: `Phoenix-Solutions-Group/prostat_files` → Settings → Secrets and variables → Actions

Add these 4 secrets:

| Secret name      | Value                                                |
|------------------|------------------------------------------------------|
| `DEPLOY_HOST`    | `144.76.216.70`                                      |
| `DEPLOY_USER`    | `prostatgun` (or `root` if preferred)                |
| `DEPLOY_SSH_KEY` | Contents of `/home/prostatgun/.ssh/prostat_files_deploy` (the **private** key) |
| `DEPLOY_PORT`    | `22` (confirm with your hosting — cPanel may use a different port) |

To get the private key contents:

```bash
cat /home/prostatgun/.ssh/prostat_files_deploy
```

Copy the full output (including `-----BEGIN...` and `-----END...` lines) as the secret value.

---

### Step 4 — Add the workflow file to the repo

Copy `deploy.yml` from this directory into the repo at `.github/workflows/deploy.yml`.

If you have a local checkout of `prostat_files`:

```bash
mkdir -p .github/workflows
cp /path/to/ci-cd/prostat/deploy.yml .github/workflows/deploy.yml
git add .github/workflows/deploy.yml
git commit -m "Add ProStat deploy pipeline

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
git push origin main
```

Alternatively, create the file directly in the GitHub UI:
- Navigate to the repo → Add file → Create new file
- Path: `.github/workflows/deploy.yml`
- Paste the contents of `deploy.yml`
- Commit to `main`

---

### Step 5 — Remove the old pipeline

Delete or disable the old workflow files:

```bash
# In the prostat_files repo checkout:
git rm .github/workflows/deploy.yml  # (old one, if it exists under a different name)
# or rename to .disabled:
mv .github/workflows/old-deploy.yml .github/workflows/old-deploy.yml.disabled
git add -A
git commit -m "Remove old CI/CD pipeline (replaced with clean deploy workflow)

Co-Authored-By: Paperclip <noreply@paperclip.ing>"
git push origin main
```

---

### Step 6 — Test the pipeline

1. Go to: `Phoenix-Solutions-Group/prostat_files` → Actions → Deploy ProStat
2. Click **Run workflow**
3. In the `confirm` field, type `deploy`
4. Click **Run workflow**
5. Watch the job log — confirm it completes and the smoke test passes

---

## Ongoing Use

To deploy:

1. Push code to `main` branch of `prostat_files` (or make changes directly on the server and push)
2. Go to Actions → Deploy ProStat → Run workflow → type `deploy` → confirm
3. Done

Auto-deploy on push can be enabled later by adding `push: branches: [main]` to the workflow trigger.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| SSH auth failure in pipeline | Re-check `DEPLOY_SSH_KEY` secret — must include full key with header/footer lines |
| `git reset` fails with dirty index | Check for uncommitted local changes on the server; run `git status` on the server |
| Smoke test fails (5xx) | Check Apache error logs: `tail -100 /home/prostatgun/logs/error_log` |
| Port 22 refused | cPanel may use port 21098 — update `DEPLOY_PORT` secret accordingly |
