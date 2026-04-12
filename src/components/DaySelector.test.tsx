import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DaySelector } from './DaySelector';
import type { DaySchedule } from '../types/schedule';

jest.mock('../hooks/useSchedule', () => {
  const actual = jest.requireActual('../hooks/useSchedule');
  return {
    ...actual,
    getTodayDate: jest.fn(() => '2026-04-07'),
  };
});

describe('DaySelector', () => {
  const days: DaySchedule[] = [
    {
      date: '2026-04-06',
      dayOfWeek: 'Monday',
      departures: [],
    },
    {
      date: '2026-04-07',
      dayOfWeek: 'Tuesday',
      departures: [],
    },
  ];

  it('renders a button for each day', () => {
    render(<DaySelector days={days} selectedDate="2026-04-06" onSelect={jest.fn()} />);

    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('invokes onSelect when clicking another day', async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();

    render(<DaySelector days={days} selectedDate="2026-04-06" onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: /Tue/i }));

    expect(onSelect).toHaveBeenCalledWith('2026-04-07');
  });
});
