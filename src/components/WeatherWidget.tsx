import { useWeather } from '../hooks/useWeather';
import type { WeatherData } from '../hooks/useWeather';
import styles from './WeatherWidget.module.css';

interface TerminalWeatherProps {
  readonly label: string;
  readonly data: WeatherData;
}

function TerminalWeather({ label, data }: Readonly<TerminalWeatherProps>) {
  return (
    <div className={styles.terminal}>
      <span className={styles.terminalIcon} aria-hidden="true">{data.icon}</span>
      <div className={styles.terminalInfo}>
        <span className={styles.terminalLabel}>{label}</span>
        <span className={styles.terminalTemp}>
          {data.temperatureF}°F
          {data.apparentTemperatureF !== data.temperatureF && (
            <span className={styles.feelsLike}> (feels {data.apparentTemperatureF}°)</span>
          )}
        </span>
        <span className={styles.terminalDesc}>{data.description} · {data.windSpeedMph} mph wind</span>
      </div>
    </div>
  );
}

export function WeatherWidget() {
  const { seattle, bremerton, loading, error } = useWeather();

  if (loading) {
    return (
      <section className={styles.widget} aria-label="Current weather">
        <span className={styles.loadingText}>Loading weather…</span>
      </section>
    );
  }

  if (error ?? (!seattle && !bremerton)) {
    return null;
  }

  return (
    <section className={styles.widget} aria-label="Current weather at ferry terminals">
      <h2 className={styles.widgetTitle}>Current Weather</h2>
      <div className={styles.terminals}>
        {seattle && <TerminalWeather label="Seattle" data={seattle} />}
        {bremerton && <TerminalWeather label="Bremerton" data={bremerton} />}
      </div>
      <p className={styles.attribution}>
        Weather via{' '}
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open-Meteo
        </a>
        {' '}— no tracking, no API key
      </p>
    </section>
  );
}
