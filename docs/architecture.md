# Architecture Reference

This document explains how the econ-dashboard data pipeline, automation, and static site fit together.

---

## Data flow

```
FRED API (fred.stlouisfed.org)
    │
    │  HTTP requests with FRED_API_KEY
    ▼
scripts/fetch_fred.py
    │  Fetches 34 series × 3 years of history
    │  Saves raw CSVs to data/raw/{series_id}.csv  ← gitignored
    ▼
BLS API (api.bls.gov)
    │
    │  HTTP POST with BLS_API_KEY (or v1 fallback without key)
    ▼
scripts/fetch_bls.py
    │  Fetches 6 Portland/regional series × 5 years
    │  Saves raw JSON to data/raw/bls_{series_id}.json  ← gitignored
    │  continue-on-error in GitHub Actions (supplementary data)
    ▼
scripts/build_dashboard_data.py
    │  Loads raw CSVs (FRED) + raw JSON (BLS)
    │  Computes: latest value, prev value, MoM/WoW/QoQ change,
    │            bps change (rate series), YoY% (inflation/HPI/regional CPI),
    │            full history array for charting
    │  BLS files missing → skipped gracefully, FRED data still outputs
    │  Writes to TWO locations (kept in sync):
    ├─→ data/processed/dashboard_data.json   (canonical, committed)
    └─→ dashboard/data/dashboard_data.json   (served by GitHub Pages)
    ▼
scripts/build_release_calendar.py
    │  Calls FRED release/dates API with realtime_start=today
    │  Gets scheduled release dates for 8 key releases (next 30 days)
    │  Caps H.15 at 1 entry (daily routine, not a market event)
    ├─→ dashboard/data/release_calendar.json  (for dashboard panel)
    └─→ dashboard/release-calendar.ics        (RFC-5545 iCal, 60-min VALARM)
    ▼
git commit + push to main
    │
    ▼
GitHub Pages rebuilds → https://danieldiebel.github.io/econ-dashboard/
```

---

## File structure

```
econ-dashboard/
│
├── index.html                        ← root redirect → /dashboard/
│
├── scripts/
│   ├── fetch_fred.py                 ← SERIES metadata dict lives here
│   ├── fetch_bls.py                  ← BLS regional fetcher (6 series)
│   ├── build_dashboard_data.py       ← imports SERIES from fetch_fred + BLS JSON
│   └── build_release_calendar.py
│
├── dashboard/                        ← GitHub Pages serves this folder
│   ├── index.html
│   ├── css/style.css
│   ├── js/app.js
│   ├── data/
│   │   ├── dashboard_data.json       ← auto-updated by GitHub Actions
│   │   └── release_calendar.json    ← auto-updated by GitHub Actions
│   └── release-calendar.ics         ← auto-updated by GitHub Actions
│
├── data/
│   ├── processed/dashboard_data.json ← canonical copy
│   └── raw/                          ← gitignored, regenerable
│       ├── {SERIES_ID}.csv           ← FRED raw data
│       └── bls_{SERIES_ID}.json      ← BLS raw data
│
├── .github/
│   └── workflows/fetch-data.yml
│
├── docs/
│   ├── architecture.md               ← this file
│   ├── data-catalog.md               ← full glossary for all 40 series
│   └── session-log/
│
├── .env                              ← gitignored, local only
├── .env.example
├── requirements.txt
└── CLAUDE.md
```

---

## GitHub Actions schedule

File: `.github/workflows/fetch-data.yml`

| Trigger | Schedule | Purpose |
|---|---|---|
| `cron: '30 13 * * 1-5'` | Weekdays 1:30 PM UTC (8:30 AM ET) | Catches BLS, BEA, GDP morning releases |
| `cron: '0 17 * * 4'` | Thursdays 5:00 PM UTC (noon ET) | Catches Freddie Mac PMMS mortgage rates |
| `workflow_dispatch` | Manual | Ad-hoc runs, debugging |

**What the workflow does:**
1. Checks out repo
2. Sets up Python 3.11, installs `requirements.txt`
3. Runs `fetch_fred.py` with `FRED_API_KEY` from repo secrets
4. Runs `fetch_bls.py` with `BLS_API_KEY` — `continue-on-error: true` (supplementary)
5. Runs `build_dashboard_data.py` (ingests FRED CSVs + BLS JSON; skips missing BLS files gracefully)
6. Runs `build_release_calendar.py` (also needs `FRED_API_KEY`)
7. `git add` the four output files, commits only if content changed, pushes

The push triggers GitHub Pages to rebuild the static site automatically.

---

## BLS Direct API Integration

### Why BLS direct instead of FRED?

FRED carries many BLS series (PAYEMS, UNRATE, CPI, etc.) for national data. However, **metro area (MSA) series and West Region CPI** are not available on FRED. To get Portland-specific data, we call the BLS API directly.

### Scripts

**`scripts/fetch_bls.py`** — Fetches 6 BLS series via POST to:
- v2 endpoint: `https://api.bls.gov/publicAPI/v2/timeseries/data/` (when `BLS_API_KEY` is set)
- v1 endpoint: `https://api.bls.gov/publicAPI/v1/timeseries/data/` (25 req/day fallback)

Saves raw JSON to `data/raw/bls_{series_id}.json` (gitignored). If the API fails, the script exits gracefully (`sys.exit(0)`) — it does not crash the pipeline.

**`scripts/build_dashboard_data.py`** — After building FRED entries, reads `bls_{series_id}.json` files if they exist. BLS data uses the same `dashboard_data.json` schema as FRED series. Missing BLS files are skipped without error.

### BLS series IDs fetched

| Series ID | Description |
|---|---|
| OESM41102300 | Portland MSA Mean Annual Wage (annual, OES) |
| SMU41389200000000001 | Portland MSA Total Nonfarm Employment (monthly, SA) |
| SMU41389200600000001 | Portland MSA Government Employment (monthly, SA) |
| LAUMT413892000000003 | Portland MSA Unemployment Rate (monthly, SA) |
| CUURS49ASA0 | West Region CPI — All Items (monthly, NSA) |
| CUURS49ASA0L1E | West Region Core CPI (monthly, NSA) |

### Adding more BLS series

1. Find the series ID using the [BLS Data Finder](https://beta.bls.gov/dataQuery) or [Series ID Formats guide](https://www.bls.gov/help/hlpforma.htm)
2. Add the series ID to `BLS_SERIES` list in `scripts/fetch_bls.py`
3. Add metadata to `BLS_SERIES_META` in `scripts/build_dashboard_data.py`:
   ```python
   "SERIES_ID": {
       "name": "Human-readable name",
       "category": "regional",   # or "labor" / "housing" etc.
       "unit": "%" | "thousands" | "index" | "$",
       "frequency": "monthly" | "annual",
   },
   ```
4. If it's an inflation series, add to `BLS_YOY_SERIES` in `build_dashboard_data.py`
5. Add a glossary entry in `GLOSSARY` in `dashboard/js/app.js`
6. Run pipeline locally to verify

### BLS_API_KEY setup

**Local:** Add `BLS_API_KEY=your_key_here` to `.env`

**GitHub Actions:** Go to repo → Settings → Secrets and variables → Actions → New repository secret → Name: `BLS_API_KEY`

Register at [data.bls.gov/registrationEngine](https://data.bls.gov/registrationEngine/) — free, instant.

---

## Key design decisions

**Why two copies of dashboard_data.json?**
`data/processed/` is the canonical location (committed to git, version-controlled). `dashboard/data/` is the copy GitHub Pages actually serves. `build_dashboard_data.py` writes both in one run so they're always identical.

**Why is `data/raw/` gitignored?**
Raw CSVs and JSON files are large and fully regenerable by re-running `fetch_fred.py` and `fetch_bls.py`. Only the processed output is committed.

**Why is BLS `continue-on-error: true` in the workflow?**
BLS data is supplementary regional data. If the BLS API is down or the key is invalid, the pipeline must still produce valid FRED-only output. The dashboard gracefully handles missing BLS entries (they simply don't appear as KPI cards).

**Why category="regional" for BLS series instead of "labor"?**
BLS Portland series needed their own dashboard tab. Using `category="regional"` routes them to the Portland/Regional tab rather than mixing them with national Labor series. The Glossary panel and data-catalog.md both reflect this grouping.

**Why is SERIES metadata in `fetch_fred.py` specifically?**
`build_dashboard_data.py` imports `SERIES` from `fetch_fred` at module level. The `FRED_API_KEY` guard must be inside `main()` — not at module level — to avoid `sys.exit(1)` when the module is imported without the key in scope.

**Why no build step / bundler?**
The dashboard uses Chart.js and chartjs-adapter-date-fns from CDN. No npm, no webpack. Any browser can open `dashboard/index.html` directly with a local HTTP server.

---

## How to add a new FRED series

1. Find the series ID on [fred.stlouisfed.org](https://fred.stlouisfed.org)
2. In `scripts/fetch_fred.py`, add an entry to the `SERIES` dict:
   ```python
   "SERIES_ID": {
       "name":      "Human-readable name",
       "category":  "housing" | "labor" | "rates" | "gdp_income",
       "frequency": "daily" | "weekly" | "monthly" | "quarterly",
       "unit":      "%" | "thousands" | "billions $" | "index" | "number",
   },
   ```
3. If it's an inflation or home-price index series, add its ID to `YOY_SERIES` in `build_dashboard_data.py`
4. Add a `GLOSSARY` entry in `dashboard/js/app.js` and a section in `docs/data-catalog.md`
5. Run the pipeline locally to verify: `python scripts/fetch_fred.py && python scripts/build_dashboard_data.py`

---

## How to add a new release to the calendar

In `scripts/build_release_calendar.py`, add an entry to the `RELEASES` dict:

```python
123: {
    "name":        "Release Name",
    "category":    "housing" | "labor" | "rates" | "gdp_income",
    "time_et":     "HH:MM",   # standard release time, Eastern
    "max_entries": 5,          # 1 for daily series, 5 for monthly/weekly
},
```

Find the FRED release ID at: `https://api.stlouisfed.org/fred/releases?api_key=KEY&file_type=json`

---

## How to debug a failed GitHub Actions run

1. Go to **Actions** tab → failed run → click the job name → expand each step
2. Common failures:
   - **`FRED_API_KEY not set`** → secret not added to repo, or wrong step missing `env:` block
   - **`HTTP 429`** → FRED API rate limit; re-run in a few minutes
   - **`ModuleNotFoundError`** → dependency missing from `requirements.txt`
   - **`git push` rejected** → workflow ran while you were pushing locally; next cron run will succeed
   - **BLS step failed** → expected if `BLS_API_KEY` not set; `continue-on-error: true` means dashboard still publishes with FRED-only data
3. Always trigger a **new** `workflow_dispatch` run after fixing and pushing — "Re-run jobs" reuses the old commit hash

---

## How to subscribe to the Apple Calendar feed

**URL:** `https://danieldiebel.github.io/econ-dashboard/dashboard/release-calendar.ics`

**Apple Calendar:**
1. File → New Calendar Subscription
2. Paste the URL → Subscribe
3. Set auto-refresh to "Every Hour" or "Every Day"

The `.ics` file includes a `VALARM` set to 60 minutes before each event. The file is regenerated daily by GitHub Actions.

---

## API keys

| Key | Required for | Get it at |
|---|---|---|
| `FRED_API_KEY` | All FRED data fetching + release calendar | [fred.stlouisfed.org/docs/api/api_key.html](https://fred.stlouisfed.org/docs/api/api_key.html) — free |
| `BLS_API_KEY` | BLS regional series (Portland tab) — optional, falls back to v1 | [data.bls.gov/registrationEngine](https://data.bls.gov/registrationEngine/) — free |
| `BEA_API_KEY` | Not yet used | [apps.bea.gov/API/signup](https://apps.bea.gov/API/signup/) — free |
| `CENSUS_API_KEY` | Not yet used | [api.census.gov/data/key_signup.html](https://api.census.gov/api/key_signup.html) — free |

Local: store in `.env` (gitignored).
GitHub Actions: store in **Settings → Secrets and variables → Actions → Repository secrets**.
