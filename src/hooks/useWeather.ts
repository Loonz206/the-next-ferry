import { useState, useEffect } from 'react';

export interface WeatherData {
  temperatureF: number;
  apparentTemperatureF: number;
  windSpeedMph: number;
  weatherCode: number;
  description: string;
  icon: string;
}

export interface WeatherState {
  seattle: WeatherData | null;
  bremerton: WeatherData | null;
  loading: boolean;
  error: string | null;
}

// WMO Weather interpretation codes
// https://open-meteo.com/en/docs#weathervariables
const WMO_CODE_MAP: Array<{ maxCode: number; description: string; icon: string }> = [
  { maxCode: 0,  description: 'Clear sky',     icon: '☀️'  },
  { maxCode: 1,  description: 'Mainly clear',  icon: '🌤️' },
  { maxCode: 2,  description: 'Partly cloudy', icon: '⛅'  },
  { maxCode: 3,  description: 'Overcast',      icon: '☁️'  },
  { maxCode: 48, description: 'Foggy',         icon: '🌫️' },
  { maxCode: 55, description: 'Drizzle',       icon: '🌦️' },
  { maxCode: 65, description: 'Rain',          icon: '🌧️' },
  { maxCode: 77, description: 'Snow',          icon: '🌨️' },
  { maxCode: 82, description: 'Rain showers',  icon: '🌦️' },
  { maxCode: 86, description: 'Snow showers',  icon: '🌨️' },
  { maxCode: 99, description: 'Thunderstorm',  icon: '⛈️' },
];

function interpretWeatherCode(code: number): { description: string; icon: string } {
  // Codes 45–48 are fog; 51–55 drizzle starts at 51, etc. Map by upper-bound of each range.
  const thresholds: Record<number, { description: string; icon: string }> = {
    0: { description: 'Clear sky', icon: '☀️' },
    1: { description: 'Mainly clear', icon: '🌤️' },
    2: { description: 'Partly cloudy', icon: '⛅' },
    3: { description: 'Overcast', icon: '☁️' },
  };
  if (thresholds[code]) return thresholds[code];

  const entry = WMO_CODE_MAP.find(e => code <= e.maxCode && code >= (e.maxCode - 10));
  return entry ?? { description: 'Unknown', icon: '🌡️' };
}

// Fetches weather from Open-Meteo — free, no API key required.
// https://open-meteo.com/
async function fetchWeather(latitude: number, longitude: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,apparent_temperature,wind_speed_10m,weather_code',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    forecast_days: '1',
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);

  const json = await res.json() as {
    current: {
      temperature_2m: number;
      apparent_temperature: number;
      wind_speed_10m: number;
      weather_code: number;
    };
  };

  const { temperature_2m, apparent_temperature, wind_speed_10m, weather_code } = json.current;
  const { description, icon } = interpretWeatherCode(weather_code);

  return {
    temperatureF: Math.round(temperature_2m),
    apparentTemperatureF: Math.round(apparent_temperature),
    windSpeedMph: Math.round(wind_speed_10m),
    weatherCode: weather_code,
    description,
    icon,
  };
}

// Seattle Colman Dock ferry terminal
const SEATTLE_LAT = 47.6026;
const SEATTLE_LON = -122.3382;

// Bremerton ferry terminal
const BREMERTON_LAT = 47.5652;
const BREMERTON_LON = -122.6329;

export function useWeather(): WeatherState {
  const [state, setState] = useState<WeatherState>({
    seattle: null,
    bremerton: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetchWeather(SEATTLE_LAT, SEATTLE_LON),
      fetchWeather(BREMERTON_LAT, BREMERTON_LON),
    ])
      .then(([seattle, bremerton]) => {
        if (!cancelled) {
          setState({ seattle, bremerton, loading: false, error: null });
        }
      })
      .catch(err => {
        if (!cancelled) {
          setState({ seattle: null, bremerton: null, loading: false, error: String(err.message) });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export { interpretWeatherCode };
