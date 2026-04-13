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

  if (error || !schedule) {
    return <div className={styles.error}>{error ?? 'Schedule data is unavailable.'}</div>;
  }

  // If today isn't in the schedule week, default to first day
  const effectiveDate = schedule.days.some(d => d.date === selectedDate)
    ? selectedDate
    : schedule.days[0].date;

  const currentDay = getDaySchedule(schedule, effectiveDate);

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

      <div className={styles.controls}>
        <DirectionToggle direction={direction} onChange={setDirection} />
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.fast}`} />{' '}
            Fast Ferry (~30 min, passengers)
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.slow}`} />{' '}
            WSF (~60 min, cars + passengers)
          </span>
        </div>
      </div>

      {/* Mobile: day selector + single day view */}
      <div className={styles.mobileView}>
        <DaySelector
          days={schedule.days}
          selectedDate={effectiveDate}
          onSelect={setSelectedDate}
        />
        {currentDay && (
          <div style={{ marginTop: 16 }}>
            <DayView day={currentDay} direction={direction} />
          </div>
        )}
      </div>

      {/* Desktop: full weekly calendar */}
      <div className={styles.desktopView}>
        <WeeklyCalendar schedule={schedule} direction={direction} />
      </div>

      <div className={styles.generated}>
        Schedule generated {new Date(schedule.generated).toLocaleDateString()} ·
        Starts {new Date(schedule.weekStart + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </div>
    </div>
  );
}

export default App;
