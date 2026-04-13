/// <reference types="node" />

/**
 * Fetch a rolling 7-day ferry schedule window from the WSDOT schedule REST API and the
 * checked-in Kitsap fast-ferry schedule file.
 *
 * WSDOT schedule docs:
 *   https://www.wsdot.wa.gov/ferries/api/schedule/rest/help
 *
 * Supported usage:
 *   npm run fetch-schedule
 *   npm run fetch-schedule -- --api-key YOUR_KEY
 *   WSDOT_API_KEY=YOUR_KEY npx tsx scripts/fetch-schedule.ts
 *
 * For local development, create a gitignored .env file with:
 *   WSDOT_API_KEY=your_wsdot_api_key_here
 *
 * dotenv/config loads .env automatically for this script. The production build
 * does not fetch schedule data; it bundles the committed public/data/schedule.json.
 */

import 'dotenv/config';
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
      'Create a local .env file (gitignored) with WSDOT_API_KEY=YOUR_KEY, then run npm run fetch-schedule.',
      'The script loads .env automatically via dotenv/config.',
    ].join(' '),
  );
}

// --- Date helpers ---
function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

function isFastFerryAvailable(dateStr: string): boolean {
  if (isWeekday(dateStr)) return true;
  if (isSaturday(dateStr)) {
    const month = new Date(dateStr + 'T12:00:00').getMonth();
    return month >= 4 && month <= 8; // May–September
  }
  return false;
}

function parseWsdotDate(dateStr: string): Date {
  // WSDOT schedule endpoints return Microsoft JSON dates like /Date(1712807400000-0700)/.
  const match = /\/Date\((\d+)([+-]\d{4})\)\//.exec(dateStr);
  if (!match) {
    throw new Error(`Unexpected WSDOT time format: ${dateStr}`);
  }
  const ts = Number.parseInt(match[1], 10);
  return new Date(ts);
}

function formatPacificTime(date: Date): string {
  // Convert to Pacific time
  const pacific = new Date(date.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  return `${String(pacific.getHours()).padStart(2, '0')}:${String(pacific.getMinutes()).padStart(2, '0')}`;
}

function parseTimeFromWsdot(dateStr: string): string {
  return formatPacificTime(parseWsdotDate(dateStr));
}

function getDerivedArrivalTime(departingTime: string, arrivingTime: string | null | undefined): string {
  if (arrivingTime) {
    return parseTimeFromWsdot(arrivingTime);
  }

  const departureDate = parseWsdotDate(departingTime);
  return formatPacificTime(new Date(departureDate.getTime() + 60 * 60 * 1000));
}

function buildSlowDeparture(
  direction: Direction,
  departingTime: string,
  arrivingTime?: string | null,
  vesselName?: string | null,
  vehicleCapacity?: number | null,
): FerryDeparture {
  return {
    time: parseTimeFromWsdot(departingTime),
    arrivalTime: getDerivedArrivalTime(departingTime, arrivingTime),
    direction,
    type: 'slow',
    available: true,
    vessel: vesselName ?? undefined,
    vehicleCapacity: vehicleCapacity ?? undefined,
    crossingMinutes: 60,
  };
}

function parseLegacyScheduleRoute(data: unknown): FerryDeparture[] {
  const scheduleDates = (data as { ScheduleRoute?: { Date?: Array<{ Sailings?: Array<{ DepartingTime: string; ArrivingTime?: string | null; DepartingTerminalID: number; VesselName?: string | null; VesselCapacity?: number | null }> }> } })
    .ScheduleRoute?.Date;

  if (!scheduleDates) {
    return [];
  }

  return scheduleDates.flatMap(scheduleDate =>
    (scheduleDate.Sailings ?? []).map(sailing =>
      buildSlowDeparture(
        sailing.DepartingTerminalID === BREMERTON_TERMINAL_ID ? 'eastbound' : 'westbound',
        sailing.DepartingTime,
        sailing.ArrivingTime,
        sailing.VesselName,
        sailing.VesselCapacity,
      ),
    ),
  );
}

function parseTerminalCombos(data: unknown): FerryDeparture[] {
  const terminalCombos = (data as { TerminalCombos?: Array<{ DepartingTerminalID: number; Times?: Array<{ DepartingTime: string; ArrivingTime?: string | null; VesselName?: string | null }> }> }).TerminalCombos;

  if (!terminalCombos) {
    return [];
  }

  return terminalCombos.flatMap(terminalCombo => {
    const direction = terminalCombo.DepartingTerminalID === BREMERTON_TERMINAL_ID ? 'eastbound' : 'westbound';
    return (terminalCombo.Times ?? []).map(sailing =>
      buildSlowDeparture(direction, sailing.DepartingTime, sailing.ArrivingTime, sailing.VesselName),
    );
  });
}

// --- Fast ferry data ---
function loadFastFerryFallback() {
  const raw = readFileSync(join(__dirname, 'fast-ferry-fallback.json'), 'utf-8');
  return JSON.parse(raw);
}

function buildFastFerryDepartures(dateStr: string): FerryDeparture[] {
  const data = loadFastFerryFallback();
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

  const dailySchedule = isWeekday(dateStr) ? data.weekday : data.saturday;
  for (const direction of ['eastbound', 'westbound'] as Direction[]) {
    for (const sailing of dailySchedule[direction]) {
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

  if (departures.length === 0) {
    const reason = isSaturday(dateStr)
      ? 'Saturday fast ferry schedule is not configured in scripts/fast-ferry-fallback.json.'
      : 'Fast ferry schedule data is missing from scripts/fast-ferry-fallback.json.';

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

  return departures;
}

// --- WSDOT API fetch ---
async function fetchWsdotScheduleForRoute(
  apiKey: string,
  dateStr: string,
  departingTerminalId: number,
  arrivingTerminalId: number,
): Promise<FerryDeparture[]> {
  const d = new Date(dateStr + 'T12:00:00');
  const tripDate = formatWsdotDate(d);

  const url = `${WSDOT_API_BASE}/schedule/${tripDate}/${departingTerminalId}/${arrivingTerminalId}?apiaccesscode=${encodeURIComponent(apiKey)}`;

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`WSDOT API error for ${dateStr}: ${resp.status} ${resp.statusText}`);
  }

  const data = await resp.json();
  const departures = [...parseLegacyScheduleRoute(data), ...parseTerminalCombos(data)];

  if (departures.length === 0) {
    throw new Error(
      `No WSDOT sailings parsed for ${dateStr}. Response did not match the expected schedule payload shape.`,
    );
  }

  return departures;
}

async function fetchWsdotSchedule(apiKey: string, dateStr: string): Promise<FerryDeparture[]> {
  const [westboundDepartures, eastboundDepartures] = await Promise.all([
    fetchWsdotScheduleForRoute(apiKey, dateStr, SEATTLE_TERMINAL_ID, BREMERTON_TERMINAL_ID),
    fetchWsdotScheduleForRoute(apiKey, dateStr, BREMERTON_TERMINAL_ID, SEATTLE_TERMINAL_ID),
  ]);

  return [...westboundDepartures, ...eastboundDepartures];
}

// --- Main ---
async function main() {
  const apiKey = requireApiKey();
  const startDate = new Date();
  startDate.setHours(12, 0, 0, 0);

  console.log('Using WSDOT schedule REST API for WSF sailings');
  console.log(`Generating 7-day schedule starting ${formatDate(startDate)}`);

  const days: DaySchedule[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
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
    weekStart: formatDate(startDate),
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

try {
  await main();
} catch (err) {
  console.error('Failed to generate schedule:', err);
  process.exit(1);
}
