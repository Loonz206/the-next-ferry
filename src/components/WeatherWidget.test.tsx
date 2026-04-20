import { render, screen } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import { WeatherWidget } from './WeatherWidget';

const MOCK_SEATTLE_RESPONSE = {
  current: {
    temperature_2m: 58.3,
    apparent_temperature: 55.1,
    wind_speed_10m: 12.4,
    weather_code: 2,
  },
};

const MOCK_BREMERTON_RESPONSE = {
  current: {
    temperature_2m: 55.0,
    apparent_temperature: 53.0,
    wind_speed_10m: 8.0,
    weather_code: 3,
  },
};

describe('WeatherWidget', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    (globalThis as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows loading text initially', () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    render(<WeatherWidget />);
    expect(screen.getByText('Loading weather…')).toBeInTheDocument();
  });

  it('renders weather for both terminals', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_SEATTLE_RESPONSE } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_BREMERTON_RESPONSE } as Response);

    render(<WeatherWidget />);

    await waitFor(() => {
      expect(screen.getByText('Seattle')).toBeInTheDocument();
    });

    expect(screen.getByText('Bremerton')).toBeInTheDocument();
    expect(screen.getByText(/58°F/)).toBeInTheDocument();
    expect(screen.getByText(/55°F/)).toBeInTheDocument();
    expect(screen.getByText(/Partly cloudy/)).toBeInTheDocument();
    expect(screen.getByText(/Overcast/)).toBeInTheDocument();
  });

  it('renders nothing on error', async () => {
    fetchMock.mockRejectedValue(new Error('Network error'));

    const { container } = render(<WeatherWidget />);

    await waitFor(() => {
      expect(screen.queryByText('Loading weather…')).not.toBeInTheDocument();
    });

    expect(container.firstChild).toBeNull();
  });

  it('has accessible section label', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_SEATTLE_RESPONSE } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_BREMERTON_RESPONSE } as Response);

    render(<WeatherWidget />);

    await waitFor(() => {
      expect(screen.getByRole('region', { name: /current weather/i })).toBeInTheDocument();
    });
  });
});
