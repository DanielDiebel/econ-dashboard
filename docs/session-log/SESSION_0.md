# SESSION_0.md — Phase 0: Repo + Environment Setup

**Date:** 2026-03-18
**Phase:** 0 — Repo + Local Environment Setup
**Duration:** ~30 min
**Status:** ✅ Complete (files generated, Daniel pushes to GitHub)

---

## What was accomplished

- Defined full project architecture and 6-phase execution plan
- Created all Phase 0 files: `.gitignore`, `requirements.txt`, `.env.example`, `README.md`, `CLAUDE.md`
- Created placeholder folder structure
- Created `docs/data-catalog.md` with 40+ FRED series, all API endpoints, release calendars
- Established CLAUDE.md protocol for session handoffs

## Decisions made

| Decision | Rationale |
|---|---|
| GitHub Pages over Streamlit | No server to maintain, docs live in same repo, free URL |
| FRED as primary API | Single endpoint for BLS, BEA, Freddie Mac, Fed Board, FHFA data |
| Pure HTML/CSS/JS dashboard (no npm) | Zero build step, works on GitHub Pages with no CI complexity |
| `data/raw/` gitignored | Large files, fully regenerable from API |
| CLAUDE.md protocol | ADHD-friendly session continuity — no re-explaining context |

## Files created
```
.gitignore
requirements.txt
.env.example
README.md
CLAUDE.md
docs/data-catalog.md
docs/session-log/SESSION_0.md
```

## Next session (Phase 1) starting point
Open `scripts/fetch_fred.py` — it doesn't exist yet. Phase 1 creates it.
Tell Claude: "Starting Phase 1 — FRED API + Data Pipeline. Here is my CLAUDE.md: [paste]"

---

## ⚠️ Action items for Daniel before Phase 1

1. **Regenerate FRED API key** at https://fred.stlouisfed.org/docs/api/api_key.html (key was shared in chat)
2. Create GitHub repo: `github.com/DanielDiebel/econ-dashboard` (public)
3. Run these terminal commands in order (see Phase 0 terminal commands below)
4. Add new FRED key to local `.env` file

---

## Phase 0 terminal commands (run in order)

```bash
# 1. Navigate to your projects folder
cd ~/projects

# 2. Create the project folder
mkdir econ-dashboard && cd econ-dashboard

# 3. Initialize git
git init

# 4. Copy all generated files into this folder
# (Claude will provide these as downloadable files)

# 5. Create folder structure
mkdir -p scripts data/raw data/processed dashboard/css dashboard/js dashboard/data
mkdir -p docs/session-log .github/workflows

# 6. Create your .env file with your FRED key
echo "FRED_API_KEY=YOUR_NEW_KEY_HERE" > .env
echo "BLS_API_KEY=" >> .env
echo "BEA_API_KEY=" >> .env
echo "CENSUS_API_KEY=" >> .env

# 7. Install Python dependencies
pip install -r requirements.txt

# 8. Connect to GitHub (after creating repo at github.com)
git remote add origin https://github.com/DanielDiebel/econ-dashboard.git

# 9. Initial commit
git add .
git commit -m "Phase 0: repo setup, folder structure, config files"
git push -u origin main
```
