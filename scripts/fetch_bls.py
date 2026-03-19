#!/usr/bin/env python3
"""
Fetch 6 BLS regional/supplementary series via the BLS public API.
Uses v2 API if BLS_API_KEY is set; falls back to v1 (25 req/day limit) otherwise.
Saves raw JSON to data/raw/bls_{series_id}.json (gitignored).

Series fetched:
  OESM41102300        Portland MSA Mean Annual Wage (annual)
  SMU41389200000000001 Portland MSA Total Nonfarm Employment (monthly, SA)
  SMU41389200600000001 Portland MSA Government Employment (monthly, SA)
  LAUMT413892000000003 Portland MSA Unemployment Rate (monthly, SA)
  CUURS49ASA0         CPI-U West Urban All Items (monthly, NSA)
  CUURS49ASA0L1E      CPI-U West Urban Core (monthly, NSA)

Usage:
    python scripts/fetch_bls.py
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

import requests

ROOT = Path(__file__).parent.parent
RAW_DIR = ROOT / "data" / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)

BLS_SERIES = [
    "OESM41102300",           # Portland MSA Mean Annual Wage
    "SMU41389200000000001",   # Portland MSA Total Nonfarm Employment
    "SMU41389200600000001",   # Portland MSA Government Employment
    "LAUMT413892000000003",   # Portland MSA Unemployment Rate
    "CUURS49ASA0",            # CPI-U West Urban All Items
    "CUURS49ASA0L1E",         # CPI-U West Urban Core
]

API_URL_V2 = "https://api.bls.gov/publicAPI/v2/timeseries/data/"
API_URL_V1 = "https://api.bls.gov/publicAPI/v1/timeseries/data/"


def fetch_bls(series_ids, api_key=None):
    """POST to BLS API and return the parsed JSON response."""
    current_year = datetime.now().year
    payload = {
        "seriesid": series_ids,
        "startyear": str(current_year - 5),
        "endyear": str(current_year),
    }

    if api_key:
        url = API_URL_V2
        payload["registrationkey"] = api_key
    else:
        url = API_URL_V1
        print("  WARNING: BLS_API_KEY not set — using v1 API (25 req/day limit)\n")

    headers = {"Content-type": "application/json"}
    resp = requests.post(url, json=payload, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.json()


def main():
    api_key = os.environ.get("BLS_API_KEY", "").strip() or None
    if not api_key:
        print("WARNING: BLS_API_KEY is not set. Falling back to BLS v1 API (25 req/day limit).")

    fetched = 0
    errors = []

    print(f"Fetching {len(BLS_SERIES)} BLS series...\n")

    try:
        data = fetch_bls(BLS_SERIES, api_key)
    except Exception as e:
        print(f"  ERROR: BLS API request failed: {e}")
        print(f"\nFetched 0/{len(BLS_SERIES)} BLS series — check network or API status.")
        sys.exit(0)  # Graceful exit — do not crash the pipeline

    if data.get("status") != "REQUEST_SUCCEEDED":
        msgs = data.get("message", [])
        print(f"  ERROR: BLS API returned status '{data.get('status')}': {msgs}")
        print(f"\nFetched 0/{len(BLS_SERIES)} BLS series")
        sys.exit(0)

    results = {r["seriesID"]: r for r in data.get("Results", {}).get("series", [])}

    for series_id in BLS_SERIES:
        if series_id not in results:
            print(f"  ✗  {series_id:<32}  no data returned by API")
            errors.append(series_id)
            continue

        series_data = results[series_id]
        n_obs = len(series_data.get("data", []))

        if n_obs == 0:
            print(f"  ✗  {series_id:<32}  0 observations returned")
            errors.append(series_id)
            continue

        out_path = RAW_DIR / f"bls_{series_id}.json"
        with open(out_path, "w") as f:
            json.dump(series_data, f, indent=2)

        print(f"  ✓  {series_id:<32}  {n_obs} observations → {out_path.name}")
        fetched += 1

    print(f"\nFetched {fetched}/{len(BLS_SERIES)} BLS series")
    if errors:
        print(f"Errors ({len(errors)}): {', '.join(errors)}")


if __name__ == "__main__":
    main()
