import type { FerryDeparture } from '../types/schedule';
import { formatTime12h } from '../hooks/useSchedule';
import styles from './DepartureCard.module.css';

interface DepartureCardProps {
  readonly departure: FerryDeparture;
  readonly isNext?: boolean;
}

export function DepartureCard({ departure, isNext = false }: Readonly<DepartureCardProps>) {
  const { type, available, time, arrivalTime, vessel, vehicleCapacity, crossingMinutes, unavailableReason } = departure;

  if (!available) {
    return (
      <div className={`${styles.card} ${styles.unavailableCard}`}>
        <div className={`${styles.badge} ${styles.unavailable}`}>N/A</div>
        <div className={styles.info}>
          <div className={styles.times}>Fast Ferry Unavailable</div>
          <div className={styles.meta}>{unavailableReason}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.card} ${isNext ? styles.nextDeparture : ''}`}>
      <div className={`${styles.badge} ${type === 'fast' ? styles.fast : styles.slow}`}>
        {type === 'fast' ? '⚡' : '🚗'}
        <br />
        {type === 'fast' ? 'Fast' : 'WSF'}
      </div>

      <div className={styles.info}>
        <div className={styles.times}>
          <span>{formatTime12h(time)}</span>
          <span className={styles.arrow}>→</span>
          <span>{formatTime12h(arrivalTime)}</span>
        </div>
        <div className={styles.meta}>
          <span className={styles.metaTag}>~{crossingMinutes} min</span>
          {vessel && <span className={styles.metaTag}>• {vessel}</span>}
          {vehicleCapacity != null && vehicleCapacity > 0 && <span className={styles.metaTag}>• {vehicleCapacity} vehicles</span>}
        </div>
      </div>

      {isNext && <div className={styles.crossing}>NEXT</div>}
    </div>
  );
}
