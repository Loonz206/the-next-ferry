import type { WeekSchedule, DaySchedule, FerryDeparture, Direction } from '../src/types/schedule';

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

// Fast ferry fallback (weekdays only, Oct 2025 schedule)
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

function buildDaySchedule(dateStr: string): DaySchedule {
  const departures: FerryDeparture[] = [];
  const fastAvailable = isFastFerryAvailable(dateStr);

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

  // Add fast ferry departures
  if (fastAvailable && isWeekday(dateStr)) {
    for (const direction of ['eastbound', 'westbound'] as Direction[]) {
      const sailings = fastFerryData.weekday[direction];
      for (const sailing of sailings) {
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
  } else if (!fastAvailable) {
    // Add a single "unavailable" marker for fast ferry
    const reason = isSaturday(dateStr)
      ? 'Saturday fast ferry runs May–Sep only'
      : 'No Sunday fast ferry service';
    departures.push({
      time: '00:00',
      arrivalTime: '00:00',
      direction: 'eastbound',
      type: 'fast',
      available: false,
      crossingMinutes: 30,
      unavailableReason: reason,
    });
    departures.push({
      time: '00:00',
      arrivalTime: '00:00',
      direction: 'westbound',
      type: 'fast',
      available: false,
      crossingMinutes: 30,
      unavailableReason: reason,
    });
  }

  return {
    date: dateStr,
    dayOfWeek: getDayOfWeek(dateStr),
    departures,
  };
}

function getMonday(fromDate: Date): Date {
  const d = new Date(fromDate);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

// Generate a week of schedule data starting from the Monday of the current week
const today = new Date('2026-04-12T12:00:00');
const monday = getMonday(today);

const days: DaySchedule[] = [];
for (let i = 0; i < 7; i++) {
  const d = new Date(monday);
  d.setDate(monday.getDate() + i);
  days.push(buildDaySchedule(formatDate(d)));
}

const schedule: WeekSchedule = {
  weekStart: formatDate(monday),
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
