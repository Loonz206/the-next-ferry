import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { cloneSchedule } from './test/fixtures/schedule';
import * as scheduleHooks from './hooks/useSchedule';

jest.mock('./hooks/useSchedule', () => {
  const actual = jest.requireActual('./hooks/useSchedule');
  return {
    ...actual,
    useSchedule: jest.fn(),
    getTodayDate: jest.fn(),
  };
});

describe('App', () => {
  const mockUseSchedule = scheduleHooks.useSchedule as jest.MockedFunction<typeof scheduleHooks.useSchedule>;
  const mockGetTodayDate = scheduleHooks.getTodayDate as jest.MockedFunction<typeof scheduleHooks.getTodayDate>;

  beforeEach(() => {
    mockGetTodayDate.mockReturnValue('2026-04-06');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    mockUseSchedule.mockReturnValue({
      schedule: null,
      loading: true,
      error: null,
    });

    render(<App />);

    expect(screen.getByText(/Loading ferry schedule/i)).toBeInTheDocument();
  });

  it('renders error state', () => {
    mockUseSchedule.mockReturnValue({
      schedule: null,
      loading: false,
      error: 'Failed to load',
    });

    render(<App />);

    expect(screen.getByText('Failed to load')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Washington State Department of Transportation - Bremerton \/ Seattle/i })).toHaveAttribute(
      'href',
      'https://wsdot.com/ferries/schedule/scheduledetailbyroute.aspx?route=sea-br',
    );
  });

  it('renders footer data source and announcements links with safe external attrs', () => {
    mockUseSchedule.mockReturnValue({
      schedule: cloneSchedule(),
      loading: false,
      error: null,
    });

    render(<App />);

    const wsdotLink = screen.getByRole('link', { name: /Washington State Department of Transportation - Bremerton \/ Seattle/i });
    const kitsapServiceLink = screen.getByRole('link', { name: /Kitsap Transit Fast Ferry Service/i });
    const wsfBlueskyLink = screen.getByRole('link', { name: /WSF updates on Bluesky/i });
    const kitsapXLink = screen.getByRole('link', { name: /Kitsap Transit updates on X/i });

    expect(wsdotLink).toHaveAttribute('href', 'https://wsdot.com/ferries/schedule/scheduledetailbyroute.aspx?route=sea-br');
    expect(kitsapServiceLink).toHaveAttribute('href', 'https://www.kitsaptransit.com/service/fast-ferry');
    expect(wsfBlueskyLink).toHaveAttribute('href', 'https://bsky.app/profile/ferries.wsdot.wa.gov');
    expect(kitsapXLink).toHaveAttribute('href', 'https://x.com/KitsapTransit');

    expect(wsdotLink).toHaveAttribute('target', '_blank');
    expect(wsdotLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders passenger fares above controls', () => {
    mockUseSchedule.mockReturnValue({
      schedule: cloneSchedule(),
      loading: false,
      error: null,
    });

    render(<App />);

    expect(screen.getByRole('heading', { name: /Passenger fares/i })).toBeInTheDocument();
    expect(screen.getByText(/WSF \(car ferry\)/i).closest('article')).toHaveTextContent(
      /Bremerton to Seattle:\s*No charge/i,
    );
    expect(screen.getByText(/WSF \(car ferry\)/i).closest('article')).toHaveTextContent(
      /Seattle to Bremerton:\s*\$11\.05/i,
    );
    expect(screen.getByText(/Kitsap Fast Ferry/i).closest('article')).toHaveTextContent(
      /Bremerton to Seattle:\s*\$2\.00/i,
    );
    expect(screen.getByText(/Kitsap Fast Ferry/i).closest('article')).toHaveTextContent(
      /Seattle to Bremerton:\s*\$13\.00/i,
    );
  });

  it('falls back to first schedule day when today is not in week', () => {
    const schedule = cloneSchedule();
    schedule.days[0].departures = [
      {
        time: '06:10',
        arrivalTime: '07:10',
        direction: 'eastbound',
        type: 'slow',
        available: true,
        crossingMinutes: 60,
      },
    ];
    schedule.days[1].departures = [
      {
        time: '08:10',
        arrivalTime: '09:10',
        direction: 'eastbound',
        type: 'slow',
        available: true,
        crossingMinutes: 60,
      },
    ];

    mockGetTodayDate.mockReturnValue('2099-01-01');
    mockUseSchedule.mockReturnValue({
      schedule,
      loading: false,
      error: null,
    });

    render(<App />);

    const monButton = screen.getByRole('button', { name: /Mon/i });
    const tueButton = screen.getByRole('button', { name: /Tue/i });

    expect(monButton.className).toContain('active');
    expect(tueButton.className).not.toContain('active');
  });

  it('updates view when direction and day are changed', async () => {
    const user = userEvent.setup();

    mockUseSchedule.mockReturnValue({
      schedule: cloneSchedule(),
      loading: false,
      error: null,
    });

    render(<App />);

    expect(screen.getAllByText('9:00 AM').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /Seattle → Bremerton/i }));
    expect(screen.getAllByText(/Maintenance/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /Tue/i }));
    expect(screen.getAllByText('12:45 PM').length).toBeGreaterThan(0);
  });
});
