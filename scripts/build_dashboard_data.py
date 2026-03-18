#!/usr/bin/env python3
"""
Build data/processed/dashboard_data.json from raw FRED CSVs.
Run after fetch_fred.py.
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


def load_series(series_id):
    path = RAW_DIR / f"{series_id}.csv"
    if not path.exists():
        return None
    df = pd.read_csv(path, parse_dates=["date"])
    df = df.sort_values("date").dropna(subset=["value"]).reset_index(drop=True)
    return df


def get_obs(df, n_back):
    """Return (value, date_str) for the observation n periods back, or (None, None)."""
    idx = len(df) - 1 - n_back
    if idx < 0:
        return None, None
    row = df.iloc[idx]
    return float(row["value"]), row["date"].strftime("%Y-%m-%d")


def r(v, digits=4):
    return round(v, digits) if v is not None else None


def build_entry(series_id, meta):
    df = load_series(series_id)
    if df is None or df.empty:
        return None

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

    # YoY for inflation / home price series
    if series_id in YOY_SERIES:
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


def main():
    print("Building dashboard_data.json...\n")

    output = {
        "meta": {
            "updated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "series_count": len(SERIES),
        },
        "series": {},
    }

    missing = []
    for series_id, meta in SERIES.items():
        entry = build_entry(series_id, meta)
        if entry:
            output["series"][series_id] = entry
            val_str = f"{entry['latest_value']} {entry['unit']}"
            print(f"  ✓  {series_id:<20}  {val_str:<22}  ({entry['latest_date']})")
        else:
            print(f"  ✗  {series_id:<20}  no data")
            missing.append(series_id)

    for out_path in (OUT_FILE, DASHBOARD_FILE):
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with open(out_path, "w") as f:
            json.dump(output, f, indent=2)

    print(f"\n{'='*50}")
    print(f"Built: {len(output['series'])}  |  Missing: {len(missing)}")
    print(f"Output → {OUT_FILE}")
    print(f"Output → {DASHBOARD_FILE}")

    # Spot-check
    print("\nSpot-check:")
    for sid in ["MORTGAGE30US", "UNRATE", "GDP"]:
        if sid in output["series"]:
            s = output["series"][sid]
            chg = f"  Δ {s.get('change_bps', s.get('change'))} {'bps' if 'change_bps' in s else s['unit']}" if s.get("change") is not None else ""
            print(f"  {sid:<20}  {s['latest_value']} {s['unit']}  ({s['latest_date']}){chg}")
        else:
            print(f"  {sid:<20}  NOT FOUND")


if __name__ == "__main__":
    main()
