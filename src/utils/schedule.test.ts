import {
  filterByDirection,
  formatTime12h,
  getAvailableDepartures,
  getDaySchedule,
  getNextDeparture,
  getTodayDate,
  getUnavailableNotices,
  groupByTimeOfDay,
} from './schedule';
import { cloneSchedule } from '../test/fixtures/baseSchedule';

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
        time: '17:00',
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
      {
        ...monday.departures[0],
        time: '21:40',
      },
    ]);

    expect(groups.map(group => group.timeOfDay)).toEqual(['morning', 'midday', 'evening']);
    expect(groups[0].departures.map(dep => dep.time)).toEqual(['08:59']);
    expect(groups[1].departures.map(dep => dep.time)).toEqual(['09:00', '14:59', '16:00']);
    expect(groups[2].departures.map(dep => dep.time)).toEqual(['17:00', '21:40']);
  });

  it('keeps post-5PM departures in the evening group', () => {
    const groups = groupByTimeOfDay([
      {
        ...monday.departures[0],
        time: '16:59',
      },
      {
        ...monday.departures[0],
        time: '17:00',
      },
      {
        ...monday.departures[0],
        time: '19:40',
      },
    ]);

    const evening = groups.find(group => group.timeOfDay === 'evening');
    expect(evening?.departures.map(dep => dep.time)).toEqual(['17:00', '19:40']);
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
    jest.setSystemTime(new Date('2026-04-12T12:00:00'));

    expect(getTodayDate()).toBe('2026-04-12');
  });
});
