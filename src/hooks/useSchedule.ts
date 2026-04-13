import { useState, useEffect } from 'react';
import type { WeekSchedule, DaySchedule, FerryDeparture, Direction, TimeGroup, TimeOfDay } from '../types/schedule';

interface AppGlobals {
  __APP_BASE_URL__?: string;
}

function getAppBaseUrl(): string {
  const appGlobals = globalThis as AppGlobals;
  return appGlobals.__APP_BASE_URL__ ?? '/';
}

function getScheduleUrl(): string {
  return `${getAppBaseUrl()}data/schedule.json`;
}

function getScheduleLoadError(status: number): string {
  if (status === 404) {
    return 'Schedule data is missing. Run npm run fetch-schedule locally or pull the latest public/data/schedule.json.';
  }

  return `Failed to load schedule: ${status}`;
}

export function useSchedule() {
  const [schedule, setSchedule] = useState<WeekSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(getScheduleUrl())
      .then(res => {
        if (!res.ok) throw new Error(getScheduleLoadError(res.status));
        return res.json();
      })
      .then((data: WeekSchedule) => {
        setSchedule(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { schedule, loading, error };
}

export function getDaySchedule(schedule: WeekSchedule, date: string): DaySchedule | undefined {
  return schedule.days.find(d => d.date === date);
}

export function filterByDirection(departures: FerryDeparture[], direction: Direction): FerryDeparture[] {
  return departures.filter(d => d.direction === direction);
}

export function getAvailableDepartures(departures: FerryDeparture[]): FerryDeparture[] {
  return departures.filter(d => d.available);
}

export function getUnavailableNotices(departures: FerryDeparture[]): FerryDeparture[] {
  return departures.filter(d => !d.available);
}

function getTimeOfDay(time: string): TimeOfDay {
  const hour = Number.parseInt(time.split(':')[0], 10);
  if (hour < 9) return 'morning';
  if (hour < 17) return 'midday';
  return 'evening';
}

const TIME_GROUP_LABELS: Record<TimeOfDay, string> = {
  morning: 'Morning',
  midday: 'Midday',
  evening: 'Evening',
};

export function groupByTimeOfDay(departures: FerryDeparture[]): TimeGroup[] {
  const available = getAvailableDepartures(departures);
  const sorted = [...available].sort((a, b) => a.time.localeCompare(b.time));

  const groups: Record<TimeOfDay, FerryDeparture[]> = {
    morning: [],
    midday: [],
    evening: [],
  };

  for (const dep of sorted) {
    groups[getTimeOfDay(dep.time)].push(dep);
  }

  return (['morning', 'midday', 'evening'] as TimeOfDay[])
    .filter(tod => groups[tod].length > 0)
    .map(tod => ({
      label: TIME_GROUP_LABELS[tod],
      timeOfDay: tod,
      departures: groups[tod],
    }));
}

export function getNextDeparture(departures: FerryDeparture[]): FerryDeparture | null {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const available = getAvailableDepartures(departures);
  const sorted = [...available].toSorted((a, b) => a.time.localeCompare(b.time));

  return sorted.find(d => d.time >= currentTime) ?? null;
}

export function getTodayDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTime12h(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  let hour12 = h;
  if (h === 0) hour12 = 12;
  else if (h > 12) hour12 = h - 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}
