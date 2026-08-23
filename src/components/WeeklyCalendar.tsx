import { memo, useMemo } from 'react';
import type { WeekSchedule, Direction } from '../types/schedule';
import { filterByDirection, groupByTimeOfDay, getNextDeparture, getUnavailableNotices, getTodayDate } from '../utils/schedule';
import { DepartureCard } from './DepartureCard';
import styles from './WeeklyCalendar.module.css';

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface WeeklyCalendarProps {
  readonly schedule: WeekSchedule;
  readonly direction: Direction;
}

export const WeeklyCalendar = memo(function WeeklyCalendar({ schedule, direction }: Readonly<WeeklyCalendarProps>) {
  const days = useMemo(
    () =>
      schedule.days.map(day => {
        const date = new Date(day.date + 'T12:00:00');
        const directed = filterByDirection(day.departures, direction);
        const isToday = day.date === getTodayDate();
        return {
          day,
          date,
          groups: groupByTimeOfDay(directed),
          unavailable: getUnavailableNotices(directed),
          isToday,
          nextDep: isToday ? getNextDeparture(directed) : null,
        };
      }),
    [schedule.days, direction],
  );

  return (
    <div className={styles.calendar}>
      {days.map(({ day, date, groups, unavailable, isToday, nextDep }) => (
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
      ))}
    </div>
  );
});
