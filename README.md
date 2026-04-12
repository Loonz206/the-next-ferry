# The Next Ferry

A single-page app that combines the **Washington State Ferries (WSF) Bremerton route** and the **Kitsap Transit Fast Ferry** into one unified weekly schedule — so you always know what's leaving, when, and whether it's a car ferry or an express passenger boat.

## What it does

The Bremerton corridor has two distinct ferry services running between Seattle and Bremerton:

| Service | Operator | Crossing time | Vehicles |
|---|---|---|---|
| **Slow ferry** | Washington State Ferries | ~60 min | Yes (cars + walk-on) |
| **Fast ferry** | Kitsap Transit | ~30 min | Walk-on only |

Checking two separate websites to piece together the full picture is a pain. This app pulls both schedules into a single view, color-coded and broken down by direction (eastbound to Seattle / westbound to Bremerton).

- **Green** — Kitsap Transit Fast Ferry (⚡)
- **Blue** — Washington State Ferries slow ferry (🚗)
- **Gray** — Unavailable / cancelled

On mobile you see a day-at-a-time view with a day selector strip. On desktop (≥768px) it expands to a 7-column weekly calendar so you can plan ahead.

## Data freshness

Schedule data is fetched daily via a GitHub Actions cron job and committed as `public/data/schedule.json`. WSF data comes from the [WSDOT Ferries REST API](https://www.wsdot.wa.gov/ferries/api/schedule/documentation/). Fast ferry data is a hardcoded fallback from the published Kitsap Transit schedule (updated manually when the schedule changes).

## Local development

```bash
npm install
npm run dev
```

### Fetch live schedule data

Requires a free [WSDOT API key](https://wsdot.wa.gov/traffic/api/).

```bash
# Using an env var
WSDOT_API_KEY=your_key npx tsx scripts/fetch-schedule.ts

# Or store it in ~/.zshrc / ~/.zshenv
export WSDOT_API_KEY=your_key
npx tsx scripts/fetch-schedule.ts
```

Without a key the script falls back to the hardcoded fast ferry data + whatever is already in `public/data/schedule.json`.

## Deployment

The app deploys to GitHub Pages automatically on every push to `main`. The cron job runs daily at 5am UTC to refresh the schedule.

### Required GitHub setup

1. **Settings → Pages → Source** — set to `GitHub Actions`
2. **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `WSDOT_API_KEY`
   - Value: your WSDOT API access code

### Trigger a manual run

Go to **Actions → Fetch Schedule & Deploy → Run workflow** to fire a run on demand.
