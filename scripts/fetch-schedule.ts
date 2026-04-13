/**
 * Fetch schedule data from WSDOT API + static Kitsap fast ferry schedule.
 *
 * Usage:
 *   npx tsx scripts/fetch-schedule.ts --api-key YOUR_KEY
 *   WSDOT_API_KEY=YOUR_KEY npx tsx scripts/fetch-schedule.ts
 *
 * WSDOT_API_KEY is required for slow-ferry schedule generation.
 */

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { WeekSchedule, DaySchedule, FerryDeparture, Direction } from '../src/types/schedule';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Config ---
const SEATTLE_TERMINAL_ID = 7;
const BREMERTON_TERMINAL_ID = 4;
const WSDOT_API_BASE = 'https://www.wsdot.wa.gov/Ferries/API/Schedule/rest';

// --- CLI / env ---
function getApiKey(): string | null {
  const cliIdx = process.argv.indexOf('--api-key');
  if (cliIdx !== -1 && process.argv[cliIdx + 1]) {
    return process.argv[cliIdx + 1];
  }
  return process.env.WSDOT_API_KEY ?? null;
}

function requireApiKey(): string {
  const apiKey = getApiKey()?.trim() ?? '';
  if (apiKey.length > 0) {
    return apiKey;
  }

  throw new Error(
    [
      'WSDOT_API_KEY is required to generate schedule data.',
      'Create a local .env file (gitignored) with WSDOT_API_KEY=YOUR_KEY and export it before running fetch-schedule.',
      'Example: set -a && source .env && set +a && npx tsx scripts/fetch-schedule.ts',
    ].join(' '),
  );
}

// --- Date helpers ---
function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatWsdotDate(d: Date): string {
  // WSDOT expects MM-DD-YYYY
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}-${dd}-${d.getFullYear()}`;
}

function getDayOfWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
}

function isWeekday(dateStr: string): boolean {
  const dow = new Date(dateStr + 'T12:00:00').getDay();
  return dow >= 1 && dow <= 5;
}

function isSaturday(dateStr: string): boolean {
  return new Date(dateStr + 'T12:00:00').getDay() === 6;
}

function getMonday(fromDate: Date): Date {
  const d = new Date(fromDate);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function isFastFerryAvailable(dateStr: string): boolean {
  if (isWeekday(dateStr)) return true;
  if (isSaturday(dateStr)) {
    const month = new Date(dateStr + 'T12:00:00').getMonth();
    return month >= 4 && month <= 8; // May–September
  }
  return false;
}

function parseTimeFromWsdot(dateStr: string): string {
  // WSDOT returns "/Date(timestamp-offset)/" format
  const match = /\/Date\((\d+)([+-]\d{4})\)\//.exec(dateStr);
  if (!match) {
    throw new Error(`Unexpected WSDOT time format: ${dateStr}`);
  }
  const ts = Number.parseInt(match[1], 10);
  const d = new Date(ts);
  // Convert to Pacific time
  const pacific = new Date(d.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  return `${String(pacific.getHours()).padStart(2, '0')}:${String(pacific.getMinutes()).padStart(2, '0')}`;
}

// --- Fast ferry data ---
function loadFastFerryFallback() {
  const raw = readFileSync(join(__dirname, 'fast-ferry-fallback.json'), 'utf-8');
  return JSON.parse(raw);
}

function buildFastFerryDepartures(dateStr: string): FerryDeparture[] {
  const departures: FerryDeparture[] = [];
  const available = isFastFerryAvailable(dateStr);

  if (!available) {
    const reason = isSaturday(dateStr)
      ? 'Saturday fast ferry runs May–Sep only'
      : 'No Sunday fast ferry service';
    for (const direction of ['eastbound', 'westbound'] as Direction[]) {
      departures.push({
        time: '00:00',
        arrivalTime: '00:00',
        direction,
        type: 'fast',
        available: false,
        crossingMinutes: 30,
        unavailableReason: reason,
      });
    }
    return departures;
  }

  const data = loadFastFerryFallback();
  if (isWeekday(dateStr)) {
    for (const direction of ['eastbound', 'westbound'] as Direction[]) {
      for (const sailing of data.weekday[direction]) {
        departures.push({
          time: sailing.depart,
          arrivalTime: sailing.arrive,
          direction,
          type: 'fast',
          available: true,
          crossingMinutes: 30,
        });
      }
    }
  }

  return departures;
}

// --- WSDOT API fetch ---
async function fetchWsdotSchedule(apiKey: string, dateStr: string): Promise<FerryDeparture[]> {
  const d = new Date(dateStr + 'T12:00:00');
  const tripDate = formatWsdotDate(d);

  const url = `${WSDOT_API_BASE}/schedule/${tripDate}/${SEATTLE_TERMINAL_ID}/${BREMERTON_TERMINAL_ID}?apiaccesscode=${encodeURIComponent(apiKey)}`;

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`WSDOT API error for ${dateStr}: ${resp.status} ${resp.statusText}`);
  }

  const data = await resp.json();
  const departures: FerryDeparture[] = [];

  // Parse the WSDOT schedule response
  if (data?.ScheduleRoute?.Date) {
    for (const sailing of data.ScheduleRoute.Date) {
      if (!sailing.Sailings) continue;
      for (const s of sailing.Sailings) {
        const departTime = parseTimeFromWsdot(s.DepartingTime);
        const arriveTime = parseTimeFromWsdot(s.ArrivingTime);
        const isEastbound = s.DepartingTerminalID === BREMERTON_TERMINAL_ID;

        departures.push({
          time: departTime,
          arrivalTime: arriveTime,
          direction: isEastbound ? 'eastbound' : 'westbound',
          type: 'slow',
          available: true,
          vessel: s.VesselName ?? undefined,
          vehicleCapacity: s.VesselCapacity ?? undefined,
          crossingMinutes: 60,
        });
      }
    }
  }

  if (departures.length === 0) {
    throw new Error(
      `No WSDOT sailings parsed for ${dateStr}. Response did not match expected schema (ScheduleRoute.Date.Sailings).`,
    );
  }

  return departures;
}

// --- Main ---
async function main() {
  const apiKey = requireApiKey();
  const today = new Date();
  const monday = getMonday(today);

  console.log('Using WSDOT API for slow ferry data');
  console.log(`Generating schedule for week of ${formatDate(monday)}`);

  const days: DaySchedule[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = formatDate(d);

    const slowDepartures = await fetchWsdotSchedule(apiKey, dateStr);

    const fastDepartures = buildFastFerryDepartures(dateStr);

    days.push({
      date: dateStr,
      dayOfWeek: getDayOfWeek(dateStr),
      departures: [...slowDepartures, ...fastDepartures],
    });
  }

  const schedule: WeekSchedule = {
    weekStart: formatDate(monday),
    generated: new Date().toISOString(),
    days,
  };

  const outDir = join(__dirname, '..', 'public', 'data');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'schedule.json'), JSON.stringify(schedule, null, 2));

  console.log(`Written to public/data/schedule.json`);
  const daySummary = days.map(d => `${d.dayOfWeek} (${d.date})`).join(', ');
  console.log(`  Days: ${daySummary}`);
  const totalDepartures = days.reduce((sum, d) => sum + d.departures.filter(dep => dep.available).length, 0);
  console.log(`  Total available departures: ${totalDepartures}`);
}

main().catch(err => {
  console.error('Failed to generate schedule:', err);
  process.exit(1);
});
