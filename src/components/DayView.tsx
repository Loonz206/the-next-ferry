import type { DaySchedule, Direction } from '../types/schedule';
import { filterByDirection, groupByTimeOfDay, getNextDeparture, getUnavailableNotices, getTodayDate } from '../hooks/useSchedule';
import { DepartureCard } from './DepartureCard';
import styles from './DayView.module.css';

interface DayViewProps {
  readonly day: DaySchedule;
  readonly direction: Direction;
}

export function DayView({ day, direction }: Readonly<DayViewProps>) {
  const directed = filterByDirection(day.departures, direction);
  const groups = groupByTimeOfDay(directed);
  const unavailable = getUnavailableNotices(directed);
  const isToday = day.date === getTodayDate();
  const nextDep = isToday ? getNextDeparture(directed) : null;

  if (groups.length === 0 && unavailable.length === 0) {
    return <div className={styles.noService}>No departures scheduled</div>;
  }

  return (
    <div className={styles.dayView}>
      {unavailable.map(dep => (
        <div key={`unavail-${dep.direction}-${dep.type}`} className={styles.unavailableNotice}>
          <span className={styles.unavailableIcon}>⚠️</span>
          <span>{dep.unavailableReason}</span>
        </div>
      ))}

      {groups.map(group => (
        <div key={group.timeOfDay} className={styles.timeGroup}>
          <div className={styles.groupHeader}>
            {group.label} · {group.departures.length} sailings
          </div>
          <div className={styles.departureList}>
            {group.departures.map(dep => (
              <DepartureCard
                key={`${dep.type}-${dep.time}`}
                departure={dep}
                isNext={nextDep?.time === dep.time && nextDep?.type === dep.type}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
