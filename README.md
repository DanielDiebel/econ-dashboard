# US Economic Dashboard

A live, self-updating dashboard tracking 34 key U.S. economic indicators across Housing, Labor, Interest Rates, and GDP & Income. Built as a static site on GitHub Pages, refreshed daily via GitHub Actions.

**→ [Live Dashboard](https://danieldiebel.github.io/econ-dashboard/)**

<!-- After taking a screenshot, save it as dashboard/screenshot.png and it will appear here -->
<!-- ![Dashboard screenshot](dashboard/screenshot.png) -->

---

## What it tracks

| Domain | Indicators |
|---|---|
| 🏠 **Housing** | 30Y & 15Y mortgage rates, housing starts, building permits, new & existing home sales, Case-Shiller HPI, FHFA HPI |
| 👷 **Labor** | Nonfarm payrolls, unemployment (U-3 & U-6), CPI, core CPI, PPI, PCE, core PCE, initial jobless claims, JOLTS |
| 📈 **Rates** | Fed funds rate, 2/5/10/30Y Treasuries, 3M T-Bill, 10Y-2Y spread, 10Y-3M spread, SOFR |
| 💰 **GDP & Income** | Nominal GDP, real GDP, GDP growth rate, personal income, PCE, disposable personal income |

All data sourced from the [FRED API](https://fred.stlouisfed.org) (Federal Reserve Bank of St. Louis).

---

## How it works

```
                    ┌─────────────────────────────────────────────────┐
                    │  GitHub Actions  (weekdays 8:30 AM ET + Thu noon) │
                    └─────────────────┬───────────────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────────────┐
                    │  scripts/fetch_fred.py                          │
                    │  → fetches 34 series via FRED API               │
                    │  → saves raw CSVs to data/raw/ (gitignored)     │
                    └─────────────────┬───────────────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────────────┐
                    │  scripts/build_dashboard_data.py                │
                    │  → computes changes, bps, YoY                   │
                    │  → embeds 3-year history arrays for charts      │
                    │  → writes dashboard_data.json to two locations  │
                    └─────────────────┬───────────────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────────────┐
                    │  scripts/build_release_calendar.py              │
                    │  → fetches FRED release schedule (next 30 days) │
                    │  → writes release_calendar.json + .ics          │
                    └─────────────────┬───────────────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────────────┐
                    │  git commit + push → GitHub Pages rebuild       │
                    │  → https://danieldiebel.github.io/econ-dashboard│
                    └─────────────────────────────────────────────────┘
```

No server required. Everything is static files.

---

## Features

- **KPI cards** — latest value, period-over-period change (bps for rates, YoY% for inflation, MoM for everything else)
- **Interactive chart** — 2Y / 5Y / All time windows; multi-series with auto-normalization when units differ
- **Upcoming releases panel** — next 7 days of economic releases, color-coded by domain
- **Apple Calendar feed** — subscribe to get 60-minute alerts before each major release

---

## Fork & run locally

### Prerequisites
- Python 3.9+
- Free [FRED API key](https://fred.stlouisfed.org/docs/api/api_key.html)

### Setup

```bash
# 1. Clone
git clone https://github.com/DanielDiebel/econ-dashboard.git
cd econ-dashboard

# 2. Create virtual environment and install dependencies
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 3. Add your FRED API key
cp .env.example .env
# Edit .env — set FRED_API_KEY=your_key_here

# 4. Run the pipeline
python scripts/fetch_fred.py
python scripts/build_dashboard_data.py
python scripts/build_release_calendar.py

# 5. Preview the dashboard
cd dashboard && python3 -m http.server 8000
# Open http://localhost:8000
```

### Deploy your own GitHub Pages version

1. Fork this repo
2. Add `FRED_API_KEY` to **Settings → Secrets and variables → Actions**
3. Enable GitHub Pages from **Settings → Pages → Source: Deploy from branch `main`, folder `/dashboard`**
4. The workflow runs automatically — your dashboard will be live at `https://{you}.github.io/econ-dashboard/`

---

## Project structure

```
econ-dashboard/
├── scripts/
│   ├── fetch_fred.py              # FRED API fetcher (defines all series metadata)
│   ├── build_dashboard_data.py    # Builds dashboard_data.json with history arrays
│   └── build_release_calendar.py  # Builds release_calendar.json + .ics
├── dashboard/
│   ├── index.html                 # Static site entry point
│   ├── css/style.css              # Dark theme, IBM Plex fonts, domain colours
│   ├── js/app.js                  # Chart.js 4 app — tabs, KPI cards, chart, calendar
│   ├── data/
│   │   ├── dashboard_data.json    # All 34 series with history (auto-updated)
│   │   └── release_calendar.json  # Upcoming FRED release schedule (auto-updated)
│   └── release-calendar.ics       # Apple Calendar subscription file (auto-updated)
├── data/
│   ├── processed/dashboard_data.json  # Canonical copy of dashboard data
│   └── raw/                           # Raw CSVs from FRED — gitignored
├── .github/workflows/fetch-data.yml   # Daily automation
├── docs/
│   ├── architecture.md            # Full system documentation
│   └── data-catalog.md            # All 34 series with FRED IDs and metadata
├── requirements.txt
└── .env.example
```

---

## Data sources

| Source | What's sourced |
|---|---|
| [FRED / St. Louis Fed](https://fred.stlouisfed.org) | All 34 series |
| [Freddie Mac](https://www.freddiemac.com/pmms) | PMMS weekly mortgage rates (via FRED) |
| [BLS](https://www.bls.gov) | CPI, payrolls, unemployment (via FRED) |
| [BEA](https://www.bea.gov) | GDP, PCE, personal income (via FRED) |
| [FHFA](https://www.fhfa.gov) | House Price Index (via FRED) |
| [NY Fed](https://www.newyorkfed.org) | SOFR (via FRED) |

---

## Apple Calendar subscription

Subscribe to get 60-minute alerts before every major economic release:

```
https://danieldiebel.github.io/econ-dashboard/dashboard/release-calendar.ics
```

**Apple Calendar:** File → New Calendar Subscription → paste URL

---

## License

MIT — see [LICENSE](LICENSE)

---

## Author

**Daniel Diebel** — CRE data strategist & econometrician, Portland OR

[LinkedIn](https://linkedin.com/in/danieldiebel) · [GitHub](https://github.com/DanielDiebel)

---

*Data updated daily on weekdays via GitHub Actions. All data sourced from public U.S. government and Federal Reserve APIs. This project is not affiliated with or endorsed by the Federal Reserve, BLS, BEA, or any other government agency.*
