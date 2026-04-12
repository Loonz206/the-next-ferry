import { renderHook, waitFor } from '@testing-library/react';
import {
  filterByDirection,
  formatTime12h,
  getAvailableDepartures,
  getDaySchedule,
  getNextDeparture,
  getTodayDate,
  getUnavailableNotices,
  groupByTimeOfDay,
  useSchedule,
} from './useSchedule';
import { cloneSchedule } from '../test/fixtures/schedule';

describe('useSchedule hook', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    (globalThis as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    delete (globalThis as { __APP_BASE_URL__?: string }).__APP_BASE_URL__;
    jest.restoreAllMocks();
  });

  it('loads schedule successfully', async () => {
    const mockSchedule = cloneSchedule();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockSchedule,
    } as Response);

    const { result } = renderHook(() => useSchedule());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.schedule).toEqual(mockSchedule);
    expect(fetchMock).toHaveBeenCalledWith('/data/schedule.json');
  });

  it('uses custom base URL when provided', async () => {
    const mockSchedule = cloneSchedule();
    (globalThis as { __APP_BASE_URL__?: string }).__APP_BASE_URL__ = '/the-next-ferry/';

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockSchedule,
    } as Response);

    const { result } = renderHook(() => useSchedule());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchMock).toHaveBeenCalledWith('/the-next-ferry/data/schedule.json');
  });

  it('sets error when response is not ok', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const { result } = renderHook(() => useSchedule());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.schedule).toBeNull();
    expect(result.current.error).toBe('Failed to load schedule: 500');
  });

  it('sets error on fetch rejection', async () => {
    fetchMock.mockRejectedValue(new Error('Network down'));

    const { result } = renderHook(() => useSchedule());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.schedule).toBeNull();
    expect(result.current.error).toBe('Network down');
  });
});

describe('schedule helper functions', () => {
  const schedule = cloneSchedule();
  const monday = schedule.days[0];

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('finds a day by date', () => {
    expect(getDaySchedule(schedule, monday.date)).toEqual(monday);
    expect(getDaySchedule(schedule, '2026-04-30')).toBeUndefined();
  });

  it('filters departures by direction', () => {
    const eastbound = filterByDirection(monday.departures, 'eastbound');
    expect(eastbound).toHaveLength(2);
    expect(eastbound.every(dep => dep.direction === 'eastbound')).toBe(true);
  });

  it('returns available and unavailable departures separately', () => {
    const available = getAvailableDepartures(monday.departures);
    const unavailable = getUnavailableNotices(monday.departures);

    expect(available).toHaveLength(3);
    expect(unavailable).toHaveLength(1);
    expect(unavailable[0].unavailableReason).toBe('Maintenance');
  });

  it('groups departures by morning, midday, evening and sorts by time', () => {
    const groups = groupByTimeOfDay([
      {
        ...monday.departures[0],
        time: '15:00',
      },
      {
        ...monday.departures[0],
        time: '08:59',
      },
      {
        ...monday.departures[0],
        time: '09:00',
      },
      {
        ...monday.departures[0],
        time: '14:59',
      },
      {
        ...monday.departures[0],
        time: '16:00',
      },
    ]);

    expect(groups.map(group => group.timeOfDay)).toEqual(['morning', 'midday', 'evening']);
    expect(groups[0].departures.map(dep => dep.time)).toEqual(['08:59']);
    expect(groups[1].departures.map(dep => dep.time)).toEqual(['09:00', '14:59']);
    expect(groups[2].departures.map(dep => dep.time)).toEqual(['15:00', '16:00']);
  });

  it('returns next available departure based on current time', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-06T08:30:00'));

    const next = getNextDeparture([
      {
        ...monday.departures[0],
        time: '08:00',
        available: true,
      },
      {
        ...monday.departures[1],
        time: '08:45',
        available: true,
      },
      {
        ...monday.departures[1],
        time: '09:15',
        available: false,
      },
    ]);

    expect(next?.time).toBe('08:45');
  });

  it('returns null when no future available departure exists', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-06T20:00:00'));

    const next = getNextDeparture([
      {
        ...monday.departures[0],
        time: '07:00',
      },
      {
        ...monday.departures[1],
        time: '09:15',
      },
    ]);

    expect(next).toBeNull();
  });

  it('formats times to 12-hour clock', () => {
    expect(formatTime12h('00:00')).toBe('12:00 AM');
    expect(formatTime12h('12:00')).toBe('12:00 PM');
    expect(formatTime12h('23:59')).toBe('11:59 PM');
  });

  it('returns today date in YYYY-MM-DD format', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-12T12:00:00.000Z'));

    expect(getTodayDate()).toBe('2026-04-12');
  });
});
