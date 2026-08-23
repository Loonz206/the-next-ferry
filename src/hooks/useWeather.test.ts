import { renderHook, waitFor } from '@testing-library/react';
import { useWeather, interpretWeatherCode } from './useWeather';

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

describe('interpretWeatherCode', () => {
  it('returns clear sky for code 0', () => {
    expect(interpretWeatherCode(0)).toEqual({ description: 'Clear sky', icon: '☀️' });
  });

  it('returns mainly clear for code 1', () => {
    expect(interpretWeatherCode(1)).toEqual({ description: 'Mainly clear', icon: '🌤️' });
  });

  it('returns partly cloudy for code 2', () => {
    expect(interpretWeatherCode(2)).toEqual({ description: 'Partly cloudy', icon: '⛅' });
  });

  it('returns overcast for code 3', () => {
    expect(interpretWeatherCode(3)).toEqual({ description: 'Overcast', icon: '☁️' });
  });

  it('returns foggy for codes 45 and 48', () => {
    expect(interpretWeatherCode(45).description).toBe('Foggy');
    expect(interpretWeatherCode(48).description).toBe('Foggy');
  });

  it('returns drizzle for codes 51–55', () => {
    expect(interpretWeatherCode(51).description).toBe('Drizzle');
    expect(interpretWeatherCode(55).description).toBe('Drizzle');
  });

  it('returns rain for codes 61–65', () => {
    expect(interpretWeatherCode(61).description).toBe('Rain');
    expect(interpretWeatherCode(65).description).toBe('Rain');
  });

  it('returns snow for codes 71–77', () => {
    expect(interpretWeatherCode(71).description).toBe('Snow');
    expect(interpretWeatherCode(77).description).toBe('Snow');
  });

  it('returns thunderstorm for codes 95–99', () => {
    expect(interpretWeatherCode(95).description).toBe('Thunderstorm');
    expect(interpretWeatherCode(99).description).toBe('Thunderstorm');
  });

  it('returns unknown for unrecognised codes', () => {
    expect(interpretWeatherCode(999)).toEqual({ description: 'Unknown', icon: '🌡️' });
  });
});

describe('useWeather hook', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    (globalThis as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts in loading state', () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useWeather());
    expect(result.current.loading).toBe(true);
    expect(result.current.seattle).toBeNull();
    expect(result.current.bremerton).toBeNull();
  });

  it('loads weather for both terminals', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_SEATTLE_RESPONSE } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_BREMERTON_RESPONSE } as Response);

    const { result } = renderHook(() => useWeather());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.seattle).toMatchObject({
      temperatureF: 58,
      apparentTemperatureF: 55,
      windSpeedMph: 12,
      description: 'Partly cloudy',
      icon: '⛅',
    });
    expect(result.current.bremerton).toMatchObject({
      temperatureF: 55,
      apparentTemperatureF: 53,
      windSpeedMph: 8,
      description: 'Overcast',
      icon: '☁️',
    });
  });

  it('sets error when fetch fails', async () => {
    fetchMock.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useWeather());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.seattle).toBeNull();
    expect(result.current.bremerton).toBeNull();
    expect(result.current.error).toBe('Network error');
  });

  it('sets error when response is not ok', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 } as Response);

    const { result } = renderHook(() => useWeather());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toContain('503');
  });
});
