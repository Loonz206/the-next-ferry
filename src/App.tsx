import { useState } from 'react';
import type { Direction } from './types/schedule';
import { useSchedule, getDaySchedule, getTodayDate } from './hooks/useSchedule';
import { DirectionToggle } from './components/DirectionToggle';
import { DaySelector } from './components/DaySelector';
import { DayView } from './components/DayView';
import { WeeklyCalendar } from './components/WeeklyCalendar';
import styles from './App.module.css';

function App() {
  const { schedule, loading, error } = useSchedule();
  const [direction, setDirection] = useState<Direction>('eastbound');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());

  if (loading) {
    return <div className={styles.loading}>Loading ferry schedule…</div>;
  }

  const scheduleData = !error && schedule ? schedule : null;
  const effectiveDate = scheduleData && scheduleData.days.some(d => d.date === selectedDate)
    ? selectedDate
    : scheduleData
      ? scheduleData.days[0].date
      : null;
  const currentDay = scheduleData && effectiveDate
    ? getDaySchedule(scheduleData, effectiveDate)
    : null;

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.titleIcon}>⛴</span>{' '}
          The Next Ferry
        </h1>
        <p className={styles.subtitle}>
          Bremerton ↔ Seattle — Fast Ferry &amp; WSF combined schedule
        </p>
      </header>

      {scheduleData ? (
        <>
          <div className={styles.controls}>
            <DirectionToggle direction={direction} onChange={setDirection} />
            <div className={styles.legend}>
              <span className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.fast}`} />{' '}
                Kitsap Fast Ferry (~30 min, passengers)
              </span>
              <span className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.slow}`} />{' '}
                WSF — Washington State Ferries (~60 min, cars + passengers)
              </span>
            </div>
          </div>

          {/* Mobile: day selector + single day view */}
          <div className={styles.mobileView}>
            {effectiveDate && (
              <DaySelector
                days={scheduleData.days}
                selectedDate={effectiveDate}
                onSelect={setSelectedDate}
              />
            )}
            {currentDay && (
              <div style={{ marginTop: 16 }}>
                <DayView day={currentDay} direction={direction} />
              </div>
            )}
          </div>

          {/* Desktop: full weekly calendar */}
          <div className={styles.desktopView}>
            <WeeklyCalendar schedule={scheduleData} direction={direction} />
          </div>

          <div className={styles.generated}>
            Schedule generated {new Date(scheduleData.generated).toLocaleDateString()} ·
            Starts {new Date(scheduleData.weekStart + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>

          <section className={styles.fares} aria-label="Passenger fares">
            <h2 className={styles.faresTitle}>Passenger fares</h2>
            <div className={styles.faresGrid}>
              <article className={styles.fareCard}>
                <h3 className={styles.fareCardTitle}>WSF (car ferry)</h3>
                <p className={styles.fareRow}>Bremerton to Seattle: <strong>No charge</strong></p>
                <p className={styles.fareRow}>Seattle to Bremerton: <strong>$11.05</strong></p>
              </article>
              <article className={styles.fareCard}>
                <h3 className={styles.fareCardTitle}>Kitsap Fast Ferry</h3>
                <p className={styles.fareRow}>Bremerton to Seattle: <strong>$2.00</strong></p>
                <p className={styles.fareRow}>Seattle to Bremerton: <strong>$13.00</strong></p>
              </article>
            </div>
            <p className={styles.faresMeta}>
              Adult passenger fares from official WSDOT and Kitsap Transit fare pages.
            </p>
          </section>
        </>
      ) : (
        <div className={styles.error}>{error ?? 'Schedule data is unavailable.'}</div>
      )}

      <footer className={styles.footer} aria-label="Schedule data and announcements">
        <div className={styles.footerSection}>
          <h2 className={styles.footerHeading}>Data Sources</h2>
          <ul className={styles.footerLinks}>
            <li>
              <a href="https://wsdot.com/ferries/schedule/scheduledetailbyroute.aspx?route=sea-br" target="_blank" rel="noopener noreferrer">
                Washington State Department of Transportation - Bremerton / Seattle
              </a>
            </li>
            <li>
              <a href="https://www.kitsaptransit.com/service/fast-ferry" target="_blank" rel="noopener noreferrer">
                Kitsap Transit Fast Ferry Service
              </a>
            </li>
          </ul>
        </div>
        <div className={styles.footerSection}>
          <h2 className={styles.footerHeading}>Announcements</h2>
          <ul className={styles.footerLinks}>
            <li>
              <a href="https://bsky.app/profile/ferries.wsdot.wa.gov" target="_blank" rel="noopener noreferrer">
                WSF updates on Bluesky (@ferries.wsdot.wa.gov)
              </a>
            </li>
            <li>
              <a href="https://x.com/KitsapTransit" target="_blank" rel="noopener noreferrer">
                Kitsap Transit updates on X (@KitsapTransit)
              </a>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
}

export default App;
