#!/usr/bin/env python3
"""
Fetch economic data from FRED API for all tracked series.
Saves raw data to data/raw/{series_id}.csv
"""

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
import pandas as pd
from fredapi import Fred

ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env")

FRED_API_KEY = os.getenv("FRED_API_KEY")
if not FRED_API_KEY:
    print("ERROR: FRED_API_KEY not set in .env", file=sys.stderr)
    sys.exit(1)

RAW_DIR = ROOT / "data" / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)

LOOKBACK_YEARS = 3  # Fetch 3 years so YoY comparisons always have prior-year data

# 32 tracked series with metadata
SERIES = {
    # --- Housing (8) ---
    "MORTGAGE30US":   {"name": "30-Year Fixed Mortgage Rate",         "category": "housing",    "frequency": "weekly",    "unit": "%"},
    "MORTGAGE15US":   {"name": "15-Year Fixed Mortgage Rate",         "category": "housing",    "frequency": "weekly",    "unit": "%"},
    "HOUST":          {"name": "Housing Starts",                       "category": "housing",    "frequency": "monthly",   "unit": "thousands"},
    "PERMIT":         {"name": "Building Permits",                     "category": "housing",    "frequency": "monthly",   "unit": "thousands"},
    "HSN1F":          {"name": "New Single-Family Home Sales",         "category": "housing",    "frequency": "monthly",   "unit": "thousands"},
    "EXHOSLUSM495S":  {"name": "Existing Home Sales",                  "category": "housing",    "frequency": "monthly",   "unit": "number"},
    "CSUSHPISA":      {"name": "Case-Shiller Home Price Index",        "category": "housing",    "frequency": "monthly",   "unit": "index"},
    "HPIPONM226S":    {"name": "FHFA House Price Index",               "category": "housing",    "frequency": "monthly",   "unit": "index"},
    # --- Labor (10) ---
    "PAYEMS":         {"name": "Nonfarm Payrolls",                     "category": "labor",      "frequency": "monthly",   "unit": "thousands"},
    "UNRATE":         {"name": "Unemployment Rate",                    "category": "labor",      "frequency": "monthly",   "unit": "%"},
    "U6RATE":         {"name": "U-6 Unemployment Rate",                "category": "labor",      "frequency": "monthly",   "unit": "%"},
    "CPIAUCSL":       {"name": "CPI All Items",                        "category": "labor",      "frequency": "monthly",   "unit": "index"},
    "CPILFESL":       {"name": "Core CPI (Ex Food & Energy)",          "category": "labor",      "frequency": "monthly",   "unit": "index"},
    "PPIFIS":         {"name": "PPI Final Demand",                     "category": "labor",      "frequency": "monthly",   "unit": "index"},
    "PCEPI":          {"name": "PCE Price Index",                      "category": "labor",      "frequency": "monthly",   "unit": "index"},
    "PCEPILFE":       {"name": "Core PCE Price Index",                 "category": "labor",      "frequency": "monthly",   "unit": "index"},
    "ICSA":           {"name": "Initial Jobless Claims",               "category": "labor",      "frequency": "weekly",    "unit": "number"},
    "JTSJOL":         {"name": "JOLTS Job Openings",                   "category": "labor",      "frequency": "monthly",   "unit": "thousands"},
    # --- Rates (10) ---
    "DFF":            {"name": "Fed Funds Rate (Effective)",           "category": "rates",      "frequency": "daily",     "unit": "%"},
    "FEDFUNDS":       {"name": "Fed Funds Rate (Monthly Avg)",         "category": "rates",      "frequency": "monthly",   "unit": "%"},
    "DGS10":          {"name": "10-Year Treasury Yield",               "category": "rates",      "frequency": "daily",     "unit": "%"},
    "DGS2":           {"name": "2-Year Treasury Yield",                "category": "rates",      "frequency": "daily",     "unit": "%"},
    "DGS5":           {"name": "5-Year Treasury Yield",                "category": "rates",      "frequency": "daily",     "unit": "%"},
    "DGS30":          {"name": "30-Year Treasury Yield",               "category": "rates",      "frequency": "daily",     "unit": "%"},
    "DTB3":           {"name": "3-Month T-Bill Rate",                  "category": "rates",      "frequency": "daily",     "unit": "%"},
    "T10Y2Y":         {"name": "10Y-2Y Treasury Spread",               "category": "rates",      "frequency": "daily",     "unit": "%"},
    "T10Y3M":         {"name": "10Y-3M Treasury Spread",               "category": "rates",      "frequency": "daily",     "unit": "%"},
    "SOFR":           {"name": "SOFR",                                  "category": "rates",      "frequency": "daily",     "unit": "%"},
    # --- GDP & Income (6) ---
    "GDP":            {"name": "Nominal GDP",                          "category": "gdp_income", "frequency": "quarterly", "unit": "billions $"},
    "GDPC1":          {"name": "Real GDP (Chained 2017$)",             "category": "gdp_income", "frequency": "quarterly", "unit": "billions $"},
    "A191RL1Q225SBEA":{"name": "Real GDP Growth Rate",                 "category": "gdp_income", "frequency": "quarterly", "unit": "%"},
    "PI":             {"name": "Personal Income",                      "category": "gdp_income", "frequency": "monthly",   "unit": "billions $"},
    "PCE":            {"name": "Personal Consumption Expenditures",    "category": "gdp_income", "frequency": "monthly",   "unit": "billions $"},
    "DSPI":           {"name": "Disposable Personal Income",           "category": "gdp_income", "frequency": "monthly",   "unit": "billions $"},
}


def fetch_all(fred):
    start_year = pd.Timestamp.now().year - LOOKBACK_YEARS
    obs_start = f"{start_year}-01-01"
    fetched = {}
    failed = []

    for series_id in SERIES:
        try:
            raw = fred.get_series(series_id, observation_start=obs_start)
            df = raw.dropna().reset_index()
            df.columns = ["date", "value"]
            df.loc[:, "date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")

            out_path = RAW_DIR / f"{series_id}.csv"
            df.to_csv(out_path, index=False)
            fetched[series_id] = len(df)
            print(f"  ✓  {series_id:<20}  {len(df):>3} obs")
        except Exception as e:
            print(f"  ✗  {series_id:<20}  {e}", file=sys.stderr)
            failed.append(series_id)

    return fetched, failed


def main():
    print("Connecting to FRED API...")
    fred = Fred(api_key=FRED_API_KEY)

    print(f"\nFetching {len(SERIES)} series (since {pd.Timestamp.now().year - LOOKBACK_YEARS}-01-01)...\n")
    fetched, failed = fetch_all(fred)

    print(f"\n{'='*50}")
    print(f"Fetched: {len(fetched)}  |  Failed: {len(failed)}")
    if failed:
        print(f"Failed:  {', '.join(failed)}")
    print(f"Raw data → {RAW_DIR}")


if __name__ == "__main__":
    main()
