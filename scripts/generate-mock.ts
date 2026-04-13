/// <reference types="node" />

import type { WeekSchedule, DaySchedule, FerryDeparture, Direction } from '../src/types/schedule';

// Non-production helper for local UI/testing experiments only.
// The canonical schedule generation path is scripts/fetch-schedule.ts.

// WSDOT Bremerton Ferry (slow) — daily schedule, ~60 min crossing
// Valid Mar 22 – Jun 13, 2026. Vessels: Kaleetan, Issaquah
const slowFerrySchedule: Record<Direction, Array<{ depart: string; arrive: string; vessel: string; vehicleCapacity: number }>> = {
  eastbound: [
    { depart: '04:50', arrive: '05:50', vessel: 'Kaleetan', vehicleCapacity: 202 },
    { depart: '05:30', arrive: '06:30', vessel: 'Kaleetan', vehicleCapacity: 202 },
    { depart: '06:20', arrive: '07:20', vessel: 'Issaquah', vehicleCapacity: 124 },
    { depart: '06:40', arrive: '07:40', vessel: 'Issaquah', vehicleCapacity: 124 },
    { depart: '07:20', arrive: '08:20', vessel: 'Kaleetan', vehicleCapacity: 202 },
    { depart: '07:55', arrive: '08:55', vessel: 'Kaleetan', vehicleCapacity: 202 },
    { depart: '08:45', arrive: '09:45', vessel: 'Issaquah', vehicleCapacity: 124 },
    { depart: '09:00', arrive: '10:00', vessel: 'Issaquah', vehicleCapacity: 124 },
    { depart: '09:50', arrive: '10:50', vessel: 'Kaleetan', vehicleCapacity: 202 },
    { depart: '11:10', arrive: '12:10', vessel: 'Issaquah', vehicleCapacity: 124 },
    { depart: '11:40', arrive: '12:40', vessel: 'Issaquah', vehicleCapacity: 124 },
    { depart: '12:20', arrive: '13:20', vessel: 'Kaleetan', vehicleCapacity: 202 },
    { depart: '13:30', arrive: '14:30', vessel: 'Issaquah', vehicleCapacity: 124 },
    { depart: '15:00', arrive: '16:00', vessel: 'Kaleetan', vehicleCapacity: 202 },
    { depart: '16:15', arrive: '17:15', vessel: 'Issaquah', vehicleCapacity: 124 },
  ],
  westbound: [
    { depart: '06:05', arrive: '07:05', vessel: 'Kaleetan', vehicleCapacity: 202 },
    { depart: '07:35', arrive: '08:35', vessel: 'Issaquah', vehicleCapacity: 124 },
    { depart: '08:35', arrive: '09:35', vessel: 'Kaleetan', vehicleCapacity: 202 },
    { depart: '10:00', arrive: '11:00', vessel: 'Issaquah', vehicleCapacity: 124 },
    { depart: '10:30', arrive: '11:30', vessel: 'Issaquah', vehicleCapacity: 124 },
    { depart: '11:10', arrive: '12:10', vessel: 'Kaleetan', vehicleCapacity: 202 },
    { depart: '12:20', arrive: '13:20', vessel: 'Issaquah', vehicleCapacity: 124 },
    { depart: '12:50', arrive: '13:50', vessel: 'Issaquah', vehicleCapacity: 124 },
    { depart: '13:30', arrive: '14:30', vessel: 'Kaleetan', vehicleCapacity: 202 },
    { depart: '14:50', arrive: '15:50', vessel: 'Issaquah', vehicleCapacity: 124 },
    { depart: '16:15', arrive: '17:15', vessel: 'Kaleetan', vehicleCapacity: 202 },
    { depart: '17:30', arrive: '18:30', vessel: 'Issaquah', vehicleCapacity: 124 },
    { depart: '18:45', arrive: '19:45', vessel: 'Kaleetan', vehicleCapacity: 202 },
    { depart: '19:50', arrive: '20:50', vessel: 'Issaquah', vehicleCapacity: 124 },
  ],
};

// Fast ferry fallback (manually maintained; see scripts/fast-ferry-fallback.json)
import fastFerryData from './fast-ferry-fallback.json';

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
    const month = new Date(dateStr + 'T12:00:00').getMonth(); // 0-indexed
    return month >= 4 && month <= 8; // May (4) through September (8)
  }
  return false; // Sunday
}

function getFastFerryUnavailableDepartures(reason: string): FerryDeparture[] {
  return (['eastbound', 'westbound'] as Direction[]).map(direction => ({
    time: '00:00',
    arrivalTime: '00:00',
    direction,
    type: 'fast',
    available: false,
    crossingMinutes: 30,
    unavailableReason: reason,
  }));
}

function buildFastFerryDepartures(dateStr: string): FerryDeparture[] {
  const fastAvailable = isFastFerryAvailable(dateStr);

  if (!fastAvailable) {
    const reason = isSaturday(dateStr)
      ? 'Saturday fast ferry runs May–Sep only'
      : 'No Sunday fast ferry service';
    return getFastFerryUnavailableDepartures(reason);
  }

  const dailySchedule = isWeekday(dateStr) ? fastFerryData.weekday : fastFerryData.saturday;
  const departures = (['eastbound', 'westbound'] as Direction[]).flatMap(direction =>
    dailySchedule[direction].map((sailing: { depart: string; arrive: string }) => ({
      time: sailing.depart,
      arrivalTime: sailing.arrive,
      direction,
      type: 'fast' as const,
      available: true,
      crossingMinutes: 30,
    })),
  );

  if (departures.length > 0) {
    return departures;
  }

  const reason = isSaturday(dateStr)
    ? 'Saturday fast ferry schedule is not configured in scripts/fast-ferry-fallback.json.'
    : 'Fast ferry schedule data is missing from scripts/fast-ferry-fallback.json.';
  return getFastFerryUnavailableDepartures(reason);
}

function buildDaySchedule(dateStr: string): DaySchedule {
  const departures: FerryDeparture[] = [];

  // Add slow ferry departures (daily — same every day)
  for (const direction of ['eastbound', 'westbound'] as Direction[]) {
    for (const sailing of slowFerrySchedule[direction]) {
      departures.push({
        time: sailing.depart,
        arrivalTime: sailing.arrive,
        direction,
        type: 'slow',
        available: true,
        vessel: sailing.vessel,
        vehicleCapacity: sailing.vehicleCapacity,
        crossingMinutes: 60,
      });
    }
  }

  departures.push(...buildFastFerryDepartures(dateStr));

  return {
    date: dateStr,
    dayOfWeek: getDayOfWeek(dateStr),
    departures,
  };
}

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generate a 7-day rolling schedule window starting from the reference date
const startDate = new Date('2026-04-12T12:00:00');

const days: DaySchedule[] = [];
for (let i = 0; i < 7; i++) {
  const d = new Date(startDate);
  d.setDate(startDate.getDate() + i);
  days.push(buildDaySchedule(formatDate(d)));
}

const schedule: WeekSchedule = {
  weekStart: formatDate(startDate),
  generated: new Date().toISOString(),
  days,
};

// Write to public/data/schedule.json
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'data');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'schedule.json'), JSON.stringify(schedule, null, 2));

console.log(`Generated schedule.json for week of ${schedule.weekStart}`);
const daySummary = days.map(d => `${d.dayOfWeek} (${d.date})`).join(', ');
console.log(`  Days: ${daySummary}`);
console.log(`  Total departures: ${days.reduce((sum, d) => sum + d.departures.length, 0)}`);
