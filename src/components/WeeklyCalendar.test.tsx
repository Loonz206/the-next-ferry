import { render, screen } from '@testing-library/react';
import { WeeklyCalendar } from './WeeklyCalendar';
import { cloneSchedule } from '../test/fixtures/schedule';

describe('WeeklyCalendar', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('renders all schedule day columns', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-06T08:30:00'));

    render(<WeeklyCalendar schedule={cloneSchedule()} direction="eastbound" />);

    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
  });

  it('filters cards by selected direction', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-06T08:30:00'));

    render(<WeeklyCalendar schedule={cloneSchedule()} direction="westbound" />);

    expect(screen.getByText(/Maintenance/)).toBeInTheDocument();
    expect(screen.queryByText(/9:00 AM/)).not.toBeInTheDocument();
  });

  it('marks only today next departure', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-06T08:30:00'));

    render(<WeeklyCalendar schedule={cloneSchedule()} direction="eastbound" />);

    expect(screen.getByText('NEXT')).toBeInTheDocument();
    expect(screen.getAllByText('NEXT')).toHaveLength(1);
  });
});
