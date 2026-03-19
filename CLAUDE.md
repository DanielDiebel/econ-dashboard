# CLAUDE.md — Econ Dashboard State

## Last updated: 2026-03-19
## Last session: Phase 7 — BLS Regional Layer + Series Glossary Panel

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
- [x] `scripts/fetch_bls.py` — fetches 6 BLS Portland/regional series; v2 with key, v1 fallback; graceful on failure
- [x] `scripts/build_dashboard_data.py` — builds `dashboard_data.json` from FRED CSVs + BLS JSON; skips missing BLS files gracefully
- [x] `data/processed/dashboard_data.json` — canonical data file (committed); 36 series without BLS key, 40 with
- [x] `dashboard/data/dashboard_data.json` — copy served by GitHub Pages (committed)
- [x] `dashboard/index.html` — static dashboard entry point (6 tabs: 4 domain + Portland + Glossary)
- [x] `dashboard/css/style.css` — dark theme, IBM Plex, domain accent colours + `--regional: #f43f5e` + glossary styles
- [x] `dashboard/js/app.js` — Chart.js 4 dashboard, 5 domain tabs, KPI cards, chart, Glossary panel (40 entries), G keyboard shortcut
- [ ] GitHub Pages enabled from `/dashboard` on `main` (Daniel enables in repo Settings)
- [x] `.github/workflows/fetch-data.yml` — daily cron + Thursday PMMS + workflow_dispatch; BLS step with continue-on-error
- [x] `scripts/build_release_calendar.py` — fetches upcoming FRED release dates, writes JSON + iCal
- [x] `dashboard/data/release_calendar.json` — upcoming releases for dashboard panel
- [x] `dashboard/release-calendar.ics` — iCal subscription file for Apple Calendar
- [x] `index.html` — root redirect to `./dashboard/` (GitHub Pages root fix)
- [x] `README.md` — public-launch quality with pipeline diagram, fork instructions, data sources
- [x] `docs/architecture.md` — full system documentation including BLS direct API section
- [x] `docs/data-catalog.md` — markdown reference for all 40 series (Phase 7)
- [x] `LICENSE` — MIT, Daniel Diebel 2026
- [x] About modal in dashboard — data sources, update schedule, iCal copy button, GitHub link

## What's in progress
- Nothing — Phase 7 complete. 4 Portland MSA BLS series (employment, unemployment, wage) need `BLS_API_KEY` to populate.

## Maintenance guide

### Adding a new FRED series
1. Add to `SERIES` dict in `scripts/fetch_fred.py` (single source of truth)
2. Assign a `category` matching an existing domain key (`housing`, `labor`, `rates`, `gdp_income`)
3. Run pipeline locally; verify in `dashboard_data.json`
4. Add a `GLOSSARY` entry in `dashboard/js/app.js` and a section in `docs/data-catalog.md`
5. Commit both JSON files

### Adding a new BLS series
1. Find the BLS series ID at [beta.bls.gov/dataQuery](https://beta.bls.gov/dataQuery) or [bls.gov/help/hlpforma.htm](https://www.bls.gov/help/hlpforma.htm)
2. Add the series ID to `BLS_SERIES` list in `scripts/fetch_bls.py`
3. Add metadata to `BLS_SERIES_META` in `scripts/build_dashboard_data.py`:
   - `category`: use `"regional"` for Portland/MSA series so they appear in the Portland tab
   - `unit`: `"%"` | `"thousands"` | `"index"` | `"$"`
4. If it's an inflation series, add to `BLS_YOY_SERIES` in `build_dashboard_data.py`
5. Add a `GLOSSARY` entry in `dashboard/js/app.js` with `bls_id` and `bls_url` fields (not `fred_id`/`fred_url`)
6. Add a section to `docs/data-catalog.md`
7. Run pipeline locally to verify

### Modifying the dashboard layout
- KPI cards: `renderKpiCards()` in `dashboard/js/app.js`
- Chart: `renderChart()` and `DEFAULT_SELECTED` in `app.js`
- Glossary: `GLOSSARY` constant and `renderGlossary()` in `app.js`
- Styles: `dashboard/css/style.css` — CSS custom properties at top for colours/spacing

### Debugging GitHub Actions
- Go to repo → Actions tab → click failed run → expand failed step
- Most common issues: stale `FRED_API_KEY` secret (regenerate at fred.stlouisfed.org/docs/api/api_key.html), API rate limit (retry manually)
- BLS step failing is OK (`continue-on-error: true`) — dashboard still publishes with FRED-only data
- Force a fresh run: Actions tab → "Fetch FRED Data" → "Run workflow"

### Updating release IDs
- FRED release IDs in `scripts/build_release_calendar.py` → `RELEASES` dict
- Find IDs at fred.stlouisfed.org/releases

## Running the pipeline locally
```bash
source .venv/bin/activate
python scripts/fetch_fred.py                # fetch raw → data/raw/{series_id}.csv
python scripts/fetch_bls.py                 # fetch BLS → data/raw/bls_{series_id}.json (needs BLS_API_KEY for MSA series)
python scripts/build_dashboard_data.py      # build → data/processed/ + dashboard/data/
python scripts/build_release_calendar.py   # build release_calendar.json + .ics

# Preview dashboard
cd dashboard && python3 -m http.server 8000
# open http://localhost:8000
# Press G on the dashboard to open the Glossary tab
```

## Apple Calendar subscription
- iCal URL (after GitHub Pages): `https://danieldiebel.github.io/econ-dashboard/dashboard/release-calendar.ics`
- Apple Calendar → File → New Calendar Subscription → paste URL
- Alerts: 60 min before each release (built into the .ics VALARM)

## Key file locations
| File | Purpose |
|---|---|
| `scripts/fetch_fred.py` | FRED API fetcher — defines all 34 SERIES with metadata |
| `scripts/fetch_bls.py` | BLS API fetcher — 6 Portland/regional series; v2 with key, v1 fallback |
| `scripts/build_dashboard_data.py` | Reads raw CSVs (FRED) + JSON (BLS), computes changes + history, writes JSON to both locations |
| `data/processed/dashboard_data.json` | Canonical data file — committed |
| `dashboard/data/dashboard_data.json` | Same file — served by GitHub Pages |
| `data/raw/{series_id}.csv` | Raw FRED data — gitignored, regenerable |
| `data/raw/bls_{series_id}.json` | Raw BLS data — gitignored, regenerable |
| `dashboard/index.html` | Static site entry point — 6 tabs |
| `dashboard/css/style.css` | Dark theme styles — IBM Plex Mono/Sans, domain colours, glossary styles |
| `dashboard/js/app.js` | All dashboard logic — Chart.js 4, 5 domain tabs + Glossary, GLOSSARY constant (40 entries) |
| `.github/workflows/fetch-data.yml` | Daily cron + Thursday PMMS + manual trigger; BLS step with continue-on-error |
| `scripts/build_release_calendar.py` | Fetches FRED release schedule, outputs JSON + RFC-5545 iCal |
| `dashboard/data/release_calendar.json` | Upcoming release events for dashboard panel |
| `dashboard/release-calendar.ics` | Apple Calendar subscription file (60-min VALARM per event) |
| `docs/architecture.md` | Full system documentation including BLS direct API section |
| `docs/data-catalog.md` | Markdown reference for all 40 series |

## API keys needed
| Key | Where stored | Variable name | Status |
|---|---|---|---|
| FRED | Local `.env` + GitHub Secret | `FRED_API_KEY` | ✅ Set in `.env` |
| BLS | Local `.env` + GitHub Secret | `BLS_API_KEY` | ⚠️ Needed for 4 Portland MSA series — register free at data.bls.gov/registrationEngine |
| BEA | Local `.env` | `BEA_API_KEY` | ⬜ Not yet needed |
| Census | Local `.env` | `CENSUS_API_KEY` | ⬜ Not yet needed |

**To enable Portland MSA series (employment, unemployment, wage):**
1. Register at [data.bls.gov/registrationEngine](https://data.bls.gov/registrationEngine/) — free, instant
2. Add `BLS_API_KEY=your_key` to `.env`
3. Add `BLS_API_KEY` as a GitHub Actions repository secret
4. Re-run the pipeline

## Series being tracked (40 total; 36 active without BLS key)
### Housing (8)
MORTGAGE30US, MORTGAGE15US, HOUST, PERMIT, HSN1F, EXHOSLUSM495S, CSUSHPISA, HPIPONM226S

### Labor (10)
PAYEMS, UNRATE, U6RATE, CPIAUCSL, CPILFESL, PPIFIS, PCEPI, PCEPILFE, ICSA, JTSJOL

### Rates (10)
DFF, FEDFUNDS, DGS10, DGS2, DGS5, DGS30, DTB3, T10Y2Y, T10Y3M, SOFR

### GDP & Income (6)
GDP, GDPC1, A191RL1Q225SBEA, PI, PCE, DSPI

### Portland / Regional (6 BLS direct — 4 need BLS_API_KEY)
OESM41102300 ⚠️, SMU41389200000000001 ⚠️, SMU41389200600000001 ⚠️, LAUMT413892000000003 ⚠️, CUURS49ASA0 ✅, CUURS49ASA0L1E ✅

## dashboard_data.json schema
```json
{
  "meta": { "updated_at": "ISO8601Z", "series_count": 36 },
  "series": {
    "SERIES_ID": {
      "id", "name", "category", "frequency", "unit",
      "latest_value", "latest_date",
      "prev_value", "prev_date",
      "change", "change_pct",
      "change_bps",       // only for unit="%"
      "yoy_change_pct",   // only for inflation/home price/regional CPI series
      "history": [{"date": "YYYY-MM-DD", "value": float}, ...]
    }
  }
}
```

## Dashboard design
- Dark theme: `#0d1117` background
- Domain accent colours: Housing=amber `#f59e0b`, Labor=cyan `#06b6d4`, Rates=green `#22c55e`, GDP=violet `#a855f7`, Portland=rose `#f43f5e`, Glossary=neutral `#6b7280`
- Fonts: IBM Plex Mono (values), IBM Plex Sans (labels) — Google Fonts CDN
- Chart.js v4 + chartjs-adapter-date-fns — CDN, no build step
- Multi-series normalization: when selected series have different units, chart normalizes to index=100 at window start
- Default chart series: Housing → 30Y+15Y mortgage; Labor → UNRATE+CPI; Rates → 10Y+2Y Treasury; GDP → Nominal+Real GDP; Portland → Portland unemployment + West CPI
- Keyboard shortcut: press `G` to open Glossary tab

## Architecture (current state)
```
[Local / GitHub Actions] FRED_API_KEY
  → scripts/fetch_fred.py        → data/raw/{series}.csv  (gitignored)

[Local / GitHub Actions] BLS_API_KEY (optional — v1 fallback without key)
  → scripts/fetch_bls.py         → data/raw/bls_{series}.json  (gitignored)

  → scripts/build_dashboard_data.py
      → data/processed/dashboard_data.json   (committed)
      → dashboard/data/dashboard_data.json   (committed, served by GH Pages)
          → dashboard/index.html + css/ + js/
              → https://danieldiebel.github.io/econ-dashboard

[Automation]
  .github/workflows/fetch-data.yml
    cron: weekdays 13:30 UTC + Thursdays 17:00 UTC
    → fetch_fred.py (required)
    → fetch_bls.py (continue-on-error: true — supplementary)
    → build_dashboard_data.py
    → build_release_calendar.py
    → git commit + push → triggers GH Pages rebuild
```

## Known issues / decisions
- `SERIES` metadata defined once in `fetch_fred.py`; `build_dashboard_data.py` imports it
- BLS metadata defined separately in `BLS_SERIES_META` in `build_dashboard_data.py`
- YoY change computed for inflation series (CPI, PCE, PPI, Core variants), home price indices, and West Region CPI series
- BLS Portland MSA series use `category="regional"` (not "labor") so they appear in the Portland tab, not mixed with national Labor data
- `data/raw/` is gitignored (large, regenerable) — only `data/processed/` and `dashboard/data/` are committed
- ICSA and EXHOSLUSM495S unit labels fixed: FRED returns raw counts for both (not thousands/millions)
- GitHub Pages must be enabled from `/dashboard` folder on `main` branch in repo Settings
- FRED API key must stay out of git (`.env` is gitignored)
- BLS v1 API (no key) returns data for national CPI series but not MSA series — those need v2 + key

## Phase roadmap
| Phase | Name | Status |
|---|---|---|
| 0 | Repo + Environment Setup | ✅ Complete |
| 1 | FRED API + Data Pipeline | ✅ Complete — 34/34 series, JSON built |
| 2 | Static Dashboard (GitHub Pages) | ✅ Complete — all 3 files built, local server tested |
| 3 | GitHub Actions Automation | ✅ Complete — workflow committed, secret needed in repo |
| 4 | Apple Calendar Notifications | ✅ Complete — iCal + dashboard panel + workflow integrated |
| 5 | BLS / BEA / Census Layers | ✅ Phase 7 scope — BLS direct API integrated (Portland MSA + West CPI) |
| 6 | Documentation + Public Launch | ✅ Complete — redirect, README, architecture docs, About modal, MIT license |
| 7 | BLS Regional Layer + Series Glossary | ✅ Complete — fetch_bls.py, Portland tab, 40-entry Glossary panel, data-catalog.md |
