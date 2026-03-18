# CLAUDE.md — Econ Dashboard State

## Last updated: 2026-03-18
## Last session: Phase 0 — Repo + Local Environment Setup

---

## What exists and works
- [x] Full folder structure defined
- [x] `.gitignore` — secrets and raw data excluded
- [x] `requirements.txt` — fredapi, pandas, requests, python-dotenv
- [x] `.env.example` — API key template
- [x] `README.md` — project overview
- [x] `CLAUDE.md` — this file
- [x] Placeholder directories: scripts/, data/raw/, data/processed/, dashboard/, docs/session-log/
- [x] `docs/data-catalog.md` — full 40+ series reference with FRED IDs
- [x] `docs/session-log/SESSION_0.md` — Phase 0 recap
- [ ] `.env` — Daniel adds FRED key locally (never committed)
- [ ] GitHub repo created and pushed (Daniel does this)

## What's in progress
- [ ] Phase 1: FRED API fetcher script

## What comes next (Phase 1)
- [ ] Write `scripts/fetch_fred.py`
- [ ] Write `scripts/build_dashboard_data.py`
- [ ] Run locally, verify `data/processed/dashboard_data.json` is created
- [ ] Spot-check MORTGAGE30US, UNRATE, GDP values
- [ ] Commit + push

## Key file locations
| File | Purpose |
|---|---|
| `scripts/fetch_fred.py` | FRED API fetcher (Phase 1 — not yet created) |
| `scripts/build_dashboard_data.py` | Data cleaner/merger (Phase 1 — not yet created) |
| `data/processed/dashboard_data.json` | Dashboard data source (Phase 1 — not yet created) |
| `dashboard/index.html` | Static site entry point (Phase 2 — not yet created) |
| `.github/workflows/fetch-data.yml` | GitHub Actions cron (Phase 3 — not yet created) |
| `docs/data-catalog.md` | Master series reference with all FRED IDs |

## API keys needed
| Key | Where stored | Variable name | Status |
|---|---|---|---|
| FRED | Local `.env` + GitHub Secret (Phase 3) | `FRED_API_KEY` | ✅ Daniel has key — add to `.env` |
| BLS | Local `.env` | `BLS_API_KEY` | Phase 5 — not yet needed |
| BEA | Local `.env` | `BEA_API_KEY` | Phase 5 — not yet needed |
| Census | Local `.env` | `CENSUS_API_KEY` | Phase 5 — not yet needed |

## Series being tracked (32 total)
### Housing (8)
MORTGAGE30US, MORTGAGE15US, HOUST, PERMIT, HSN1F, EXHOSLUSM495S, CSUSHPISA, HPIPONM226S

### Labor (9)
PAYEMS, UNRATE, U6RATE, CPIAUCSL, CPILFESL, PPIFIS, PCEPI, PCEPILFE, ICSA, JTSJOL

### Rates (10)
DFF, FEDFUNDS, DGS10, DGS2, DGS5, DGS30, DTB3, T10Y2Y, T10Y3M, SOFR

### GDP & Income (6)
GDP, GDPC1, A191RL1Q225SBEA, PI, PCE, DSPI

## Architecture (current state)
```
[Local] .env (FRED key) → scripts/fetch_fred.py → data/processed/dashboard_data.json
```

## Known issues / decisions
- FRED API key must be regenerated after Phase 0 (was shared in chat — security precaution)
- MBA Mortgage Applications excluded — paid/proprietary, not on FRED
- `data/raw/` is gitignored (large, regenerable) — only `data/processed/` is committed
- GitHub Pages will serve from `/dashboard` folder on `main` branch (configured in Phase 2)

## Phase roadmap
| Phase | Name | Status |
|---|---|---|
| 0 | Repo + Environment Setup | ✅ Files created — Daniel pushes to GitHub |
| 1 | FRED API + Data Pipeline | 🔜 Next |
| 2 | Static Dashboard (GitHub Pages) | ⬜ |
| 3 | GitHub Actions Automation | ⬜ |
| 4 | Apple Calendar Notifications | ⬜ |
| 5 | BLS / BEA / Census Layers | ⬜ |
| 6 | Documentation + Public Launch | ⬜ |
