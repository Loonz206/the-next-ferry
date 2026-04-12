import type { WeekSchedule } from '../../types/schedule';

export const baseSchedule: WeekSchedule = {
  weekStart: '2026-04-06',
  generated: '2026-04-12T22:56:20.709Z',
  days: [
    {
      date: '2026-04-06',
      dayOfWeek: 'Monday',
      departures: [
        {
          time: '08:00',
          arrivalTime: '09:00',
          direction: 'eastbound',
          type: 'slow',
          available: true,
          vessel: 'Kaleetan',
          vehicleCapacity: 202,
          crossingMinutes: 60,
        },
        {
          time: '09:00',
          arrivalTime: '09:30',
          direction: 'eastbound',
          type: 'fast',
          available: true,
          crossingMinutes: 30,
        },
        {
          time: '10:00',
          arrivalTime: '11:00',
          direction: 'westbound',
          type: 'slow',
          available: true,
          vessel: 'Issaquah',
          vehicleCapacity: 124,
          crossingMinutes: 60,
        },
        {
          time: '11:00',
          arrivalTime: '11:30',
          direction: 'westbound',
          type: 'fast',
          available: false,
          crossingMinutes: 30,
          unavailableReason: 'Maintenance',
        },
      ],
    },
    {
      date: '2026-04-07',
      dayOfWeek: 'Tuesday',
      departures: [
        {
          time: '07:15',
          arrivalTime: '08:15',
          direction: 'eastbound',
          type: 'slow',
          available: true,
          vessel: 'Kaleetan',
          vehicleCapacity: 202,
          crossingMinutes: 60,
        },
        {
          time: '12:45',
          arrivalTime: '13:45',
          direction: 'westbound',
          type: 'slow',
          available: true,
          vessel: 'Kaleetan',
          vehicleCapacity: 202,
          crossingMinutes: 60,
        },
      ],
    },
  ],
};

export function cloneSchedule(): WeekSchedule {
  return JSON.parse(JSON.stringify(baseSchedule)) as WeekSchedule;
}
