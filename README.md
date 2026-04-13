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

Passenger fares are shown above the direction filter so you can compare typical adult walk-on costs quickly:

- WSF (Seattle to Bremerton): $11.05
- WSF (Bremerton to Seattle): No charge
- Kitsap Fast Ferry (Seattle to Bremerton): $13.00
- Kitsap Fast Ferry (Bremerton to Seattle): $2.00

## Schedule data flow

The app always renders the checked-in `public/data/schedule.json` file at runtime.

- Local development: `npm run dev` serves the committed `public/data/schedule.json`. If you want fresher WSF data locally, run `npm run fetch-schedule` first.
- Production build: `npm run build` bundles the existing `public/data/schedule.json`. The build does not call WSDOT directly.
- Push to `main`: GitHub Actions validates `WSDOT_API_KEY`, regenerates `public/data/schedule.json`, commits it if needed, then builds and deploys the app.

WSF schedule data comes from the official [WSDOT Ferries schedule REST help](https://www.wsdot.wa.gov/ferries/api/schedule/rest/help) via the `/schedule/{TripDate}/{DepartingTerminalID}/{ArrivingTerminalID}` endpoint. Because WSDOT only serves schedules from today forward, the generated artifact is a rolling 7-day window starting on the generation date. Fast ferry data is still maintained locally in `scripts/fast-ferry-fallback.json` and should be updated manually when Kitsap Transit changes service.

## Footer fallback links

The app footer includes links to primary data and live service updates, so users can still reach official sources if schedule data is unavailable in the UI:

- Washington State Department of Transportation - Bremerton / Seattle: https://wsdot.com/ferries/schedule/scheduledetailbyroute.aspx?route=sea-br
- WSDOT fare details (Seattle -> Bremerton): https://www.wsdot.wa.gov/ferries/fares/faresdetail.aspx?departingterm=7&arrivingterm=4
- WSDOT fare details (Bremerton -> Seattle): https://www.wsdot.wa.gov/ferries/fares/faresdetail.aspx?departingterm=4&arrivingterm=7
- Kitsap Transit Fast Ferry service page: https://www.kitsaptransit.com/service/fast-ferry
- Kitsap Transit fares page: https://www.kitsaptransit.com/fares/fares
- WSF announcements on Bluesky: https://bsky.app/profile/ferries.wsdot.wa.gov
- Kitsap Transit announcements on X: https://x.com/KitsapTransit

## Local development

```bash
npm install
npm run dev
```

If `public/data/schedule.json` is missing, the app will tell you to run `npm run fetch-schedule` locally or pull the latest generated file.

## Testing and quality

This project uses Jest + React Testing Library for unit and integration tests.

```bash
# Run test suite once
npm test

# Watch mode
npm run test:watch

# Coverage report (enforced thresholds)
npm run test:coverage

# Linting with TypeScript + SonarSource maintainability rules
npm run lint
```

Coverage thresholds are enforced globally and per file at 80%+ for statements, branches, functions, and lines.

### Regenerate WSF schedule data

Requires a free [WSDOT API key](https://wsdot.wa.gov/traffic/api/).

```bash
# 1) Create a local .env file from the example
cp .env.example .env

# 2) Add your key in .env
# WSDOT_API_KEY=your_key

# 3) Generate the current 7-day schedule artifact
npm run fetch-schedule
```

`scripts/fetch-schedule.ts` loads `.env` automatically via `dotenv/config`, so there is no need to `source` the file first. The script fails fast if `WSDOT_API_KEY` is missing or WSDOT data cannot be parsed for the requested week.

Do not commit secrets. Keep `.env` local only.

## Deployment

The app deploys to GitHub Pages automatically on every push to `main`. The cron job runs daily at `10:30 UTC` to refresh `public/data/schedule.json` before the build.

### Required GitHub setup

1. **Settings → Pages → Source** — set to `GitHub Actions`
2. **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `WSDOT_API_KEY`
   - Value: your WSDOT API access code

### Trigger a manual run

Go to **Actions → Fetch Schedule & Deploy → Run workflow** to fire a run on demand.
