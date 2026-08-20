import { useState, useEffect } from 'react';
import type { WeekSchedule } from '../types/schedule';

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
