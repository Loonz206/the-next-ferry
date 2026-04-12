import type { DaySchedule } from '../types/schedule';
import { getTodayDate } from '../hooks/useSchedule';
import styles from './DaySelector.module.css';

interface DaySelectorProps {
  readonly days: DaySchedule[];
  readonly selectedDate: string;
  readonly onSelect: (date: string) => void;
}

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function DaySelector({ days, selectedDate, onSelect }: Readonly<DaySelectorProps>) {
  const today = getTodayDate();

  return (
    <div className={styles.selector}>
      {days.map(day => {
        const date = new Date(day.date + 'T12:00:00');
        const dayNum = date.getDate();
        const dayAbbr = SHORT_DAYS[date.getDay()];
        const isActive = day.date === selectedDate;
        const isToday = day.date === today;

        return (
          <button
            key={day.date}
            className={`${styles.dayButton} ${isActive ? styles.active : ''} ${isToday ? styles.today : ''}`}
            onClick={() => onSelect(day.date)}
            type="button"
          >
            <span className={styles.dayLabel}>{dayAbbr}</span>
            <span className={styles.dateLabel}>{dayNum}</span>
          </button>
        );
      })}
    </div>
  );
}
