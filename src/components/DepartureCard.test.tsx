import { render, screen } from '@testing-library/react';
import { DepartureCard } from './DepartureCard';
import type { FerryDeparture } from '../types/schedule';

describe('DepartureCard', () => {
  const availableDeparture: FerryDeparture = {
    time: '09:00',
    arrivalTime: '09:30',
    direction: 'eastbound',
    type: 'fast',
    available: true,
    crossingMinutes: 30,
  };

  it('renders unavailable state and reason', () => {
    render(
      <DepartureCard
        departure={{
          ...availableDeparture,
          available: false,
          unavailableReason: 'Weather delay',
        }}
      />,
    );

    expect(screen.getByText('N/A')).toBeInTheDocument();
    expect(screen.getByText('Weather delay')).toBeInTheDocument();
  });

  it('renders available departure details', () => {
    render(
      <DepartureCard
        departure={{
          ...availableDeparture,
          type: 'slow',
          vessel: 'Kaleetan',
          vehicleCapacity: 202,
        }}
      />,
    );

    expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    expect(screen.getByText('9:30 AM')).toBeInTheDocument();
    expect(screen.getByText(/Kaleetan/)).toBeInTheDocument();
    expect(screen.getByText(/202 vehicles/)).toBeInTheDocument();
  });

  it('shows NEXT badge for upcoming departure', () => {
    render(<DepartureCard departure={availableDeparture} isNext />);

    expect(screen.getByText('NEXT')).toBeInTheDocument();
  });
});
