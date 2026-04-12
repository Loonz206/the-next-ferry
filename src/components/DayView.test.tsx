import { render, screen } from '@testing-library/react';
import { DayView } from './DayView';
import type { DaySchedule } from '../types/schedule';

describe('DayView', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('shows no service message when selected direction has no departures', () => {
    const day: DaySchedule = {
      date: '2026-04-06',
      dayOfWeek: 'Monday',
      departures: [
        {
          time: '08:00',
          arrivalTime: '09:00',
          direction: 'westbound',
          type: 'slow',
          available: true,
          crossingMinutes: 60,
        },
      ],
    };

    render(<DayView day={day} direction="eastbound" />);

    expect(screen.getByText('No departures scheduled')).toBeInTheDocument();
  });

  it('renders unavailable notices and NEXT for today', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-06T08:30:00'));

    const day: DaySchedule = {
      date: '2026-04-06',
      dayOfWeek: 'Monday',
      departures: [
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
          arrivalTime: '10:30',
          direction: 'eastbound',
          type: 'fast',
          available: false,
          crossingMinutes: 30,
          unavailableReason: 'Crew unavailable',
        },
      ],
    };

    render(<DayView day={day} direction="eastbound" />);

    expect(screen.getByText('Crew unavailable')).toBeInTheDocument();
    expect(screen.getByText(/Midday/i)).toBeInTheDocument();
    expect(screen.getByText('NEXT')).toBeInTheDocument();
  });
});
