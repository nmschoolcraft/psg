# PSG CI/CD — Pipeline Registry

This directory holds workflow files and setup instructions for all PSG app deployment pipelines.

---

## Status Overview

| App | URL | Repo | Pipeline | Status |
|-----|-----|------|----------|--------|
| PSG Portal | portal.psgweb.me | `nmschoolcraft/psg` | `.github/workflows/deploy.yml` | ✅ LIVE |
| PSG Portal CI | portal.psgweb.me | `nmschoolcraft/psg` | `.github/workflows/ci.yml` | ✅ LIVE |
| PSG Portal API | api.psghub.me | `nmschoolcraft/psg` (api/) | `ci-cd/portal-api/deploy.yml` | ⏳ Ready to wire — needs SSH key secret |
| ProStat | app.prostatgun.com | Phoenix-Solutions-Group/prostat_files | `ci-cd/prostat/deploy.yml` | ⏳ Draft — client app, board direction needed |

---

## Directories

```
ci-cd/
├── README.md              — this file
├── portal-api/
│   ├── deploy.yml         — GitHub Actions workflow for api/ Express service
│   └── SETUP.md           — one-time setup instructions
└── prostat/
    ├── deploy.yml         — GitHub Actions workflow for app.prostatgun.com
    └── SETUP.md           — one-time setup instructions
```

---

## To activate Portal API pipeline

1. Add 4 GitHub secrets to `nmschoolcraft/psg` (see `portal-api/SETUP.md`)
2. Copy `portal-api/deploy.yml` → `.github/workflows/deploy-api.yml` in the repo
3. Push — pipeline activates on the next `api/` change

That's it. The workflow is already written and tested against the known server layout.
