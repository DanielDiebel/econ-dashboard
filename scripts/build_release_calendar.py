#!/usr/bin/env python3
"""
Fetch upcoming FRED release dates for the next 30 days.

Outputs:
  dashboard/data/release_calendar.json  — for the dashboard panel
  dashboard/release-calendar.ics        — iCal file for Apple Calendar
"""

import json
import os
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import requests
from dotenv import load_dotenv

ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env")

ET          = ZoneInfo("America/New_York")
DAYS_AHEAD  = 30
FRED_BASE   = "https://api.stlouisfed.org/fred"
OUT_JSON    = ROOT / "dashboard" / "data" / "release_calendar.json"
OUT_ICS     = ROOT / "dashboard" / "release-calendar.ics"

# FRED release IDs with standard release times (ET) and dashboard category.
# max_entries caps how many dates we include (H.15 is daily — only next occurrence needed).
RELEASES = {
    50:  {"name": "Employment Situation",     "category": "labor",      "time_et": "08:30", "max_entries": 5},
    10:  {"name": "Consumer Price Index",      "category": "labor",      "time_et": "08:30", "max_entries": 5},
    53:  {"name": "GDP",                       "category": "gdp_income", "time_et": "08:30", "max_entries": 5},
    54:  {"name": "Personal Income & Outlays", "category": "gdp_income", "time_et": "08:30", "max_entries": 5},
    190: {"name": "PMMS Mortgage Rates",       "category": "housing",    "time_et": "12:00", "max_entries": 5},
    199: {"name": "Case-Shiller HPI",          "category": "housing",    "time_et": "09:00", "max_entries": 5},
    296: {"name": "Existing Home Sales",       "category": "housing",    "time_et": "10:00", "max_entries": 5},
    18:  {"name": "Interest Rates (H.15)",     "category": "rates",      "time_et": "16:15", "max_entries": 1},
}


# ─── FRED API ─────────────────────────────────────────────────────────────────

def fetch_release_dates(release_id, api_key, today, end_date):
    """Return sorted list of date objects falling in [today, end_date]."""
    try:
        resp = requests.get(
            f"{FRED_BASE}/release/dates",
            params={
                "release_id":     release_id,
                "api_key":        api_key,
                "file_type":      "json",
                "sort_order":     "asc",
                "limit":          20,
                "realtime_start": today.isoformat(),   # skip historical dates
                "realtime_end":   "9999-12-31",
                "include_release_dates_with_no_data": "true",
            },
            timeout=10,
        )
        resp.raise_for_status()
        return [
            date.fromisoformat(item["date"])
            for item in resp.json().get("release_dates", [])
            if today <= date.fromisoformat(item["date"]) <= end_date
        ]
    except Exception as e:
        print(f"  ✗  Release {release_id}: {e}", file=sys.stderr)
        return []


def build_events(api_key):
    today    = date.today()
    end_date = today + timedelta(days=DAYS_AHEAD)
    events   = []

    for release_id, meta in RELEASES.items():
        dates = fetch_release_dates(release_id, api_key, today, end_date)
        dates = dates[: meta.get("max_entries", 5)]
        for d in dates:
            h, m    = map(int, meta["time_et"].split(":"))
            dt_et   = datetime(d.year, d.month, d.day, h, m, tzinfo=ET)
            dt_utc  = dt_et.astimezone(timezone.utc)
            events.append({
                "release_id":   release_id,
                "name":         meta["name"],
                "category":     meta["category"],
                "date":         d.isoformat(),
                "time_et":      meta["time_et"],
                "datetime_utc": dt_utc.strftime("%Y-%m-%dT%H:%M:%SZ"),
            })
            print(f"  ✓  {d}  {meta['time_et']} ET  {meta['name']}")

    events.sort(key=lambda e: e["datetime_utc"])
    return events


# ─── JSON output ──────────────────────────────────────────────────────────────

def write_json(events):
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_JSON, "w") as f:
        json.dump({
            "meta": {
                "updated_at":  datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "window_days": DAYS_AHEAD,
            },
            "releases": events,
        }, f, indent=2)
    print(f"\nJSON → {OUT_JSON}")


# ─── iCal output ──────────────────────────────────────────────────────────────

def ics_stamp(iso_utc):
    """'2026-04-03T12:30:00Z' → '20260403T123000Z'"""
    return iso_utc.replace("-", "").replace(":", "").replace("Z", "") + "Z"


def write_ics(events):
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//econ-dashboard//US Economic Releases//EN",
        "X-WR-CALNAME:US Economic Releases",
        "X-WR-TIMEZONE:America/New_York",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
        "X-PUBLISHED-TTL:PT6H",
    ]

    for ev in events:
        dt_utc = datetime.fromisoformat(ev["datetime_utc"].replace("Z", "+00:00"))
        dt_end = dt_utc + timedelta(minutes=30)
        dt_et  = dt_utc.astimezone(ET)

        # Stable UID — same release on same date always produces the same UID
        uid        = f"fred-{ev['release_id']}-{ev['date']}@econ-dashboard"
        time_label = dt_et.strftime("%-I:%M %p ET")
        desc       = (f"Release time: {time_label}\\n"
                      f"Source: FRED (Release ID {ev['release_id']})")

        lines += [
            "BEGIN:VEVENT",
            f"UID:{uid}",
            f"DTSTART:{ics_stamp(ev['datetime_utc'])}",
            f"DTEND:{ics_stamp(dt_end.strftime('%Y-%m-%dT%H:%M:%SZ'))}",
            f"SUMMARY:{ev['name']}",
            f"DESCRIPTION:{desc}",
            "BEGIN:VALARM",
            "TRIGGER:-PT60M",
            "ACTION:DISPLAY",
            "DESCRIPTION:Upcoming economic release",
            "END:VALARM",
            "END:VEVENT",
        ]

    lines.append("END:VCALENDAR")

    OUT_ICS.parent.mkdir(parents=True, exist_ok=True)
    # RFC 5545 requires CRLF line endings
    with open(OUT_ICS, "w", newline="") as f:
        for line in lines:
            f.write(line + "\r\n")
    print(f"iCal → {OUT_ICS}")


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    api_key = os.getenv("FRED_API_KEY")
    if not api_key:
        print("ERROR: FRED_API_KEY not set", file=sys.stderr)
        sys.exit(1)

    print(f"Fetching release dates (next {DAYS_AHEAD} days)...\n")
    events = build_events(api_key)

    write_json(events)
    write_ics(events)

    print(f"\n{'='*50}")
    print(f"Done: {len(events)} upcoming releases")


if __name__ == "__main__":
    main()
