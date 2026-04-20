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

// WMO Weather interpretation codes with explicit min/max code ranges.
// https://open-meteo.com/en/docs#weathervariables
const WMO_CODE_RANGES: Array<{ min: number; max: number; description: string; icon: string }> = [
  { min: 0,  max: 0,  description: 'Clear sky',     icon: '☀️'  },
  { min: 1,  max: 1,  description: 'Mainly clear',  icon: '🌤️' },
  { min: 2,  max: 2,  description: 'Partly cloudy', icon: '⛅'  },
  { min: 3,  max: 3,  description: 'Overcast',      icon: '☁️'  },
  { min: 45, max: 48, description: 'Foggy',         icon: '🌫️' },
  { min: 51, max: 55, description: 'Drizzle',       icon: '🌦️' },
  { min: 61, max: 65, description: 'Rain',          icon: '🌧️' },
  { min: 71, max: 77, description: 'Snow',          icon: '🌨️' },
  { min: 80, max: 82, description: 'Rain showers',  icon: '🌦️' },
  { min: 85, max: 86, description: 'Snow showers',  icon: '🌨️' },
  { min: 95, max: 99, description: 'Thunderstorm',  icon: '⛈️' },
];

function interpretWeatherCode(code: number): { description: string; icon: string } {
  const entry = WMO_CODE_RANGES.find(r => code >= r.min && code <= r.max);
  if (!entry) return { description: 'Unknown', icon: '🌡️' };
  const { description, icon } = entry;
  return { description, icon };
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
          setState({ seattle: null, bremerton: null, loading: false, error: err instanceof Error ? err.message : String(err) });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export { interpretWeatherCode };
