# CLAUDE.md — Econ Dashboard State

## Last updated: 2026-03-18
## Last session: Phase 2 — Static Dashboard (GitHub Pages)

---

## What exists and works
- [x] Full folder structure defined
- [x] `.gitignore` — secrets and raw data excluded
- [x] `requirements.txt` — fredapi, pandas, requests, python-dotenv
- [x] `.env.example` — API key template
- [x] `.env` — FRED key set locally (never committed)
- [x] `.venv/` — local Python virtualenv with all deps installed
- [x] `README.md` — project overview
- [x] `CLAUDE.md` — this file
- [x] `docs/session-log/SESSION_0.md` — Phase 0 recap
- [x] `scripts/fetch_fred.py` — fetches all 34 series from FRED, saves to `data/raw/`
- [x] `scripts/build_dashboard_data.py` — builds `dashboard_data.json` (with history arrays) to both output paths
- [x] `data/processed/dashboard_data.json` — canonical data file (committed)
- [x] `dashboard/data/dashboard_data.json` — copy served by GitHub Pages (committed)
- [x] `dashboard/index.html` — static dashboard entry point
- [x] `dashboard/css/style.css` — dark theme, IBM Plex, domain accent colours
- [x] `dashboard/js/app.js` — Chart.js 4 dashboard, 4 domain tabs, KPI cards, chart, checkboxes
- [ ] GitHub Pages enabled from `/dashboard` on `main` (Daniel enables in repo Settings)

## What's in progress
- [ ] Phase 3: GitHub Actions Automation

## What comes next (Phase 3)
- [ ] Write `.github/workflows/fetch-data.yml`
- [ ] Add `FRED_API_KEY` secret to GitHub repo
- [ ] Test cron run
- [ ] Verify `dashboard_data.json` auto-commits on schedule

## Running the pipeline locally
```bash
source .venv/bin/activate
python scripts/fetch_fred.py                # fetch raw → data/raw/
python scripts/build_dashboard_data.py      # build → data/processed/ + dashboard/data/

# Preview dashboard
cd dashboard && python3 -m http.server 8000
# open http://localhost:8000
```

## Key file locations
| File | Purpose |
|---|---|
| `scripts/fetch_fred.py` | FRED API fetcher — defines all 34 SERIES with metadata |
| `scripts/build_dashboard_data.py` | Reads raw CSVs, computes changes + history, writes JSON to both locations |
| `data/processed/dashboard_data.json` | Canonical data file — committed |
| `dashboard/data/dashboard_data.json` | Same file — served by GitHub Pages |
| `data/raw/{series_id}.csv` | Raw FRED data — gitignored, regenerable |
| `dashboard/index.html` | Static site entry point |
| `dashboard/css/style.css` | Dark theme styles — IBM Plex Mono/Sans, domain colours |
| `dashboard/js/app.js` | All dashboard logic — Chart.js 4, tabs, KPI cards, chart, checkboxes |
| `.github/workflows/fetch-data.yml` | GitHub Actions cron (Phase 3 — not yet created) |

## API keys needed
| Key | Where stored | Variable name | Status |
|---|---|---|---|
| FRED | Local `.env` + GitHub Secret (Phase 3) | `FRED_API_KEY` | ✅ Set in `.env` |
| BLS | Local `.env` | `BLS_API_KEY` | Phase 5 — not yet needed |
| BEA | Local `.env` | `BEA_API_KEY` | Phase 5 — not yet needed |
| Census | Local `.env` | `CENSUS_API_KEY` | Phase 5 — not yet needed |

## Series being tracked (34 total)
### Housing (8)
MORTGAGE30US, MORTGAGE15US, HOUST, PERMIT, HSN1F, EXHOSLUSM495S, CSUSHPISA, HPIPONM226S

### Labor (10)
PAYEMS, UNRATE, U6RATE, CPIAUCSL, CPILFESL, PPIFIS, PCEPI, PCEPILFE, ICSA, JTSJOL

### Rates (10)
DFF, FEDFUNDS, DGS10, DGS2, DGS5, DGS30, DTB3, T10Y2Y, T10Y3M, SOFR

### GDP & Income (6)
GDP, GDPC1, A191RL1Q225SBEA, PI, PCE, DSPI

## dashboard_data.json schema (after Phase 2 update)
```json
{
  "meta": { "updated_at": "ISO8601Z", "series_count": 34 },
  "series": {
    "SERIES_ID": {
      "id", "name", "category", "frequency", "unit",
      "latest_value", "latest_date",
      "prev_value", "prev_date",
      "change", "change_pct",
      "change_bps",       // only for unit="%"
      "yoy_change_pct",   // only for inflation/home price series
      "history": [{"date": "YYYY-MM-DD", "value": float}, ...]
    }
  }
}
```

## Dashboard design
- Dark theme: `#0d1117` background
- Domain accent colours: Housing=amber `#f59e0b`, Labor=cyan `#06b6d4`, Rates=green `#22c55e`, GDP=violet `#a855f7`
- Fonts: IBM Plex Mono (values), IBM Plex Sans (labels) — Google Fonts CDN
- Chart.js v4 + chartjs-adapter-date-fns — CDN, no build step
- Multi-series normalization: when selected series have different units, chart normalizes to index=100 at window start
- Default chart series: Housing → 30Y+15Y mortgage; Labor → UNRATE+CPI; Rates → 10Y+2Y Treasury; GDP → Nominal+Real GDP

## Architecture (current state)
```
[Local] .env (FRED key)
  → scripts/fetch_fred.py        → data/raw/{series}.csv
  → scripts/build_dashboard_data.py
      → data/processed/dashboard_data.json   (canonical)
      → dashboard/data/dashboard_data.json   (served by GH Pages)
          → dashboard/index.html + css/ + js/
              → https://danieldiebel.github.io/econ-dashboard
```

## Known issues / decisions
- `SERIES` metadata defined once in `fetch_fred.py`; `build_dashboard_data.py` imports it
- YoY change computed for inflation series (CPI, PCE, PPI, Core variants) and home price indices
- `data/raw/` is gitignored (large, regenerable) — only `data/processed/` and `dashboard/data/` are committed
- ICSA and EXHOSLUSM495S unit labels fixed: FRED returns raw counts for both (not thousands/millions)
- GitHub Pages must be enabled from `/dashboard` folder on `main` branch in repo Settings
- FRED API key must stay out of git (`.env` is gitignored)

## Phase roadmap
| Phase | Name | Status |
|---|---|---|
| 0 | Repo + Environment Setup | ✅ Complete |
| 1 | FRED API + Data Pipeline | ✅ Complete — 34/34 series, JSON built |
| 2 | Static Dashboard (GitHub Pages) | ✅ Complete — all 3 files built, local server tested |
| 3 | GitHub Actions Automation | 🔜 Next |
| 4 | Apple Calendar Notifications | ⬜ |
| 5 | BLS / BEA / Census Layers | ⬜ |
| 6 | Documentation + Public Launch | ⬜ |
