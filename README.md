# U.S. Economic Dashboard

A GitHub Pages–hosted economic data dashboard tracking 30+ key U.S. indicators across Housing, Labor, Credit/Rates, and GDP & Income.

**Live dashboard:** https://danieldiebel.github.io/econ-dashboard

## What it tracks

| Domain | Key Series |
|---|---|
| 🏠 Housing | Mortgage rates, housing starts, permits, home sales, HPI |
| 👷 Labor | Payrolls, unemployment, CPI, PCE, jobless claims, JOLTS |
| 📈 Rates | Fed funds, Treasury curve, SOFR, yield spreads |
| 💰 GDP & Income | Real GDP, personal income, PCE, disposable income |

## How it works

```
FRED API → fetch_fred.py → dashboard_data.json → GitHub Pages dashboard
                ↑
     GitHub Actions (daily cron, weekdays 8:30 AM ET)
```

Data is fetched daily via GitHub Actions, committed to this repo, and served as a static site via GitHub Pages. No server required.

## Setup (local development)

```bash
# 1. Clone
git clone https://github.com/DanielDiebel/econ-dashboard.git
cd econ-dashboard

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure API keys
cp .env.example .env
# Edit .env and add your FRED API key (free at https://fred.stlouisfed.org/docs/api/api_key.html)

# 4. Fetch data
python scripts/fetch_fred.py

# 5. Preview dashboard locally
cd dashboard && python -m http.server 8000
# Open http://localhost:8000
```

## Data sources

- **FRED** (Federal Reserve Bank of St. Louis) — primary source for all series
- **Freddie Mac** — PMMS weekly mortgage rates (via FRED)
- **BLS** — CPI, payrolls, unemployment (via FRED)
- **BEA** — GDP, PCE, personal income (via FRED)
- **FHFA** — House Price Index (via FRED)
- **NY Fed** — SOFR (via FRED)

## Project structure

```
scripts/        Python data fetchers
data/processed/ Dashboard-ready JSON (committed, auto-updated)
dashboard/      Static site (HTML/CSS/JS) served via GitHub Pages
docs/           Data catalog, architecture notes, session logs
.github/        GitHub Actions workflow
```

## Documentation

- [Data Catalog](docs/data-catalog.md) — all series, FRED IDs, release schedules
- [Architecture](docs/architecture.md) — how the pipeline works
- [Session Log](docs/session-log/) — build history

## Author

Daniel Diebel — CRE data strategist & econometrician, Portland OR  
[LinkedIn](https://linkedin.com/in/danieldiebel) | [GitHub](https://github.com/DanielDiebel)

---

*Data is updated daily on weekdays. All data sourced from public U.S. government and Federal Reserve APIs.*
