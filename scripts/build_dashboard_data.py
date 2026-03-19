#!/usr/bin/env python3
"""
Build data/processed/dashboard_data.json from raw FRED CSVs and BLS JSON files.
Run after fetch_fred.py (and optionally fetch_bls.py).
"""

import json
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).parent.parent
RAW_DIR = ROOT / "data" / "raw"
OUT_FILE = ROOT / "data" / "processed" / "dashboard_data.json"
DASHBOARD_FILE = ROOT / "dashboard" / "data" / "dashboard_data.json"

# Pull series metadata from fetch_fred so there's one source of truth
import sys
sys.path.insert(0, str(Path(__file__).parent))
from fetch_fred import SERIES

# Series where YoY % change is the primary reported metric (inflation, home prices)
YOY_SERIES = {"CPIAUCSL", "CPILFESL", "PPIFIS", "PCEPI", "PCEPILFE", "CSUSHPISA", "HPIPONM226S"}

# Periods back for YoY by frequency
YOY_LOOKBACK = {"monthly": 12, "weekly": 52, "quarterly": 4}

# ─── BLS series metadata ──────────────────────────────────────────────────────
# Decision: category="regional" (not "labor") so they appear in the
# Portland/Regional dashboard tab rather than mixing with national Labor data.

BLS_SERIES_META = {
    "OESM41102300": {
        "name": "Portland MSA Mean Annual Wage",
        "category": "regional",
        "unit": "$",
        "frequency": "annual",
    },
    "SMU41389200000000001": {
        "name": "Portland MSA Nonfarm Employment",
        "category": "regional",
        "unit": "thousands",
        "frequency": "monthly",
    },
    "SMU41389200600000001": {
        "name": "Portland MSA Government Employment",
        "category": "regional",
        "unit": "thousands",
        "frequency": "monthly",
    },
    "LAUMT413892000000003": {
        "name": "Portland MSA Unemployment Rate",
        "category": "regional",
        "unit": "%",
        "frequency": "monthly",
    },
    "CUURS49ASA0": {
        "name": "West Region CPI (All Items)",
        "category": "regional",
        "unit": "index",
        "frequency": "monthly",
    },
    "CUURS49ASA0L1E": {
        "name": "West Region Core CPI",
        "category": "regional",
        "unit": "index",
        "frequency": "monthly",
    },
}

# YoY for regional CPI series
BLS_YOY_SERIES = {"CUURS49ASA0", "CUURS49ASA0L1E"}


# ─── FRED data helpers ────────────────────────────────────────────────────────

def load_series(series_id):
    path = RAW_DIR / f"{series_id}.csv"
    if not path.exists():
        return None
    df = pd.read_csv(path, parse_dates=["date"])
    df = df.sort_values("date").dropna(subset=["value"]).reset_index(drop=True)
    return df


# ─── BLS data helpers ─────────────────────────────────────────────────────────

def load_bls_series(series_id):
    """Load a BLS series from raw JSON and return a sorted DataFrame (date, value)."""
    path = RAW_DIR / f"bls_{series_id}.json"
    if not path.exists():
        return None

    with open(path) as f:
        data = json.load(f)

    observations = data.get("data", [])
    if not observations:
        return None

    rows = []
    for obs in observations:
        year = obs.get("year", "")
        period = obs.get("period", "")
        value_str = obs.get("value", "")

        # Skip annual averages embedded in monthly/semi-annual series
        if period in ("M13", "S03", "Q05", "A13"):
            continue

        try:
            value = float(value_str)
        except (ValueError, TypeError):
            continue

        # Convert BLS period codes to calendar dates
        if period.startswith("M") and len(period) == 3:
            month = int(period[1:])
            date_str = f"{year}-{month:02d}-01"
        elif period == "A01":
            date_str = f"{year}-07-01"  # Use midyear for annual series
        elif period.startswith("Q") and len(period) == 3:
            quarter = int(period[1:])
            month = (quarter - 1) * 3 + 1
            date_str = f"{year}-{month:02d}-01"
        else:
            continue  # Skip unknown period codes

        rows.append({"date": pd.Timestamp(date_str), "value": value})

    if not rows:
        return None

    df = pd.DataFrame(rows).sort_values("date").drop_duplicates("date").reset_index(drop=True)
    return df


# ─── Shared computation helpers ───────────────────────────────────────────────

def get_obs(df, n_back):
    """Return (value, date_str) for the observation n periods back, or (None, None)."""
    idx = len(df) - 1 - n_back
    if idx < 0:
        return None, None
    row = df.iloc[idx]
    return float(row["value"]), row["date"].strftime("%Y-%m-%d")


def r(v, digits=4):
    return round(v, digits) if v is not None else None


def compute_entry(series_id, meta, df, yoy_set):
    """Build a dashboard series entry dict from a DataFrame (date, value columns)."""
    freq = meta["frequency"]
    latest_val, latest_date = get_obs(df, 0)
    prev_val, prev_date = get_obs(df, 1)

    entry = {
        "id": series_id,
        "name": meta["name"],
        "category": meta["category"],
        "frequency": freq,
        "unit": meta["unit"],
        "latest_value": r(latest_val),
        "latest_date": latest_date,
        "prev_value": r(prev_val),
        "prev_date": prev_date,
    }

    if prev_val is not None and prev_val != 0:
        change = latest_val - prev_val
        entry["change"] = r(change)
        entry["change_pct"] = r(change / abs(prev_val) * 100)
        if meta["unit"] == "%":
            entry["change_bps"] = r(change * 100)
    else:
        entry["change"] = None
        entry["change_pct"] = None

    # YoY for inflation / home price / regional CPI series
    if series_id in yoy_set:
        n_yoy = YOY_LOOKBACK.get(freq, 12)
        yoy_val, yoy_date = get_obs(df, n_yoy)
        if yoy_val is not None and yoy_val != 0:
            yoy_change = latest_val - yoy_val
            entry["yoy_value"] = r(yoy_val)
            entry["yoy_date"] = yoy_date
            entry["yoy_change"] = r(yoy_change)
            entry["yoy_change_pct"] = r(yoy_change / abs(yoy_val) * 100)

    # Full history for chart rendering
    entry["history"] = [
        {"date": row["date"].strftime("%Y-%m-%d"), "value": round(float(row["value"]), 4)}
        for _, row in df.iterrows()
    ]

    return entry


def build_entry(series_id, meta):
    """Build entry for a FRED series."""
    df = load_series(series_id)
    if df is None or df.empty:
        return None
    return compute_entry(series_id, meta, df, YOY_SERIES)


def build_bls_entry(series_id, meta):
    """Build entry for a BLS series."""
    df = load_bls_series(series_id)
    if df is None or df.empty:
        return None
    return compute_entry(series_id, meta, df, BLS_YOY_SERIES)


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("Building dashboard_data.json...\n")

    output = {
        "meta": {
            "updated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "series_count": 0,  # Updated at end to reflect actual built count
        },
        "series": {},
    }

    # ── FRED series ────────────────────────────────────────────────────────────
    fred_missing = []
    for series_id, meta in SERIES.items():
        entry = build_entry(series_id, meta)
        if entry:
            output["series"][series_id] = entry
            val_str = f"{entry['latest_value']} {entry['unit']}"
            print(f"  ✓  {series_id:<22}  {val_str:<22}  ({entry['latest_date']})")
        else:
            print(f"  ✗  {series_id:<22}  no data")
            fred_missing.append(series_id)

    # ── BLS series ─────────────────────────────────────────────────────────────
    print("\nBuilding BLS regional series...\n")
    bls_built = 0
    bls_missing = []
    for series_id, meta in BLS_SERIES_META.items():
        entry = build_bls_entry(series_id, meta)
        if entry:
            output["series"][series_id] = entry
            val_str = f"{entry['latest_value']} {entry['unit']}"
            print(f"  ✓  {series_id:<32}  {val_str:<22}  ({entry['latest_date']})")
            bls_built += 1
        else:
            print(f"  ✗  {series_id:<32}  no data (run fetch_bls.py first)")
            bls_missing.append(series_id)

    # Update series_count to reflect actual built series
    output["meta"]["series_count"] = len(output["series"])

    for out_path in (OUT_FILE, DASHBOARD_FILE):
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with open(out_path, "w") as f:
            json.dump(output, f, indent=2)

    print(f"\n{'='*55}")
    fred_built = len(SERIES) - len(fred_missing)
    print(f"FRED:  {fred_built}/{len(SERIES)} built  |  Missing: {len(fred_missing)}")
    print(f"BLS:   {bls_built}/{len(BLS_SERIES_META)} built  |  Missing: {len(bls_missing)}")
    print(f"Total: {len(output['series'])} series in output")
    print(f"Output → {OUT_FILE}")
    print(f"Output → {DASHBOARD_FILE}")

    # Spot-check
    print("\nSpot-check:")
    for sid in ["MORTGAGE30US", "UNRATE", "GDP", "LAUMT413892000000003"]:
        if sid in output["series"]:
            s = output["series"][sid]
            chg = f"  Δ {s.get('change_bps', s.get('change'))} {'bps' if 'change_bps' in s else s['unit']}" if s.get("change") is not None else ""
            print(f"  {sid:<32}  {s['latest_value']} {s['unit']}  ({s['latest_date']}){chg}")
        else:
            print(f"  {sid:<32}  NOT FOUND")


if __name__ == "__main__":
    main()
