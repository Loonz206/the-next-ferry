import type { WeekSchedule, Direction } from '../types/schedule';
import { filterByDirection, groupByTimeOfDay, getNextDeparture, getUnavailableNotices, getTodayDate } from '../hooks/useSchedule';
import { DepartureCard } from './DepartureCard';
import styles from './WeeklyCalendar.module.css';

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface WeeklyCalendarProps {
  readonly schedule: WeekSchedule;
  readonly direction: Direction;
}

export function WeeklyCalendar({ schedule, direction }: Readonly<WeeklyCalendarProps>) {
  const today = getTodayDate();

  return (
    <div className={styles.calendar}>
      {schedule.days.map(day => {
        const date = new Date(day.date + 'T12:00:00');
        const directed = filterByDirection(day.departures, direction);
        const groups = groupByTimeOfDay(directed);
        const unavailable = getUnavailableNotices(directed);
        const isToday = day.date === today;
        const nextDep = isToday ? getNextDeparture(directed) : null;

        return (
          <div key={day.date} className={styles.dayColumn}>
            <div className={`${styles.dayHeader} ${isToday ? styles.today : ''}`}>
              <div className={styles.dayName}>{SHORT_DAYS[date.getDay()]}</div>
              <div className={styles.dayDate}>{date.getDate()}</div>
            </div>

            {unavailable.map(dep => (
              <div key={`unavail-${dep.direction}-${dep.type}`} className={styles.unavailableNotice}>
                ⚠️ {dep.unavailableReason}
              </div>
            ))}

            {groups.map(group => (
              <div key={group.timeOfDay}>
                <div className={styles.timeGroupLabel}>{group.label}</div>
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
      })}
    </div>
  );
}
