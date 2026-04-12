import type { Direction } from '../types/schedule';
import styles from './DirectionToggle.module.css';

interface DirectionToggleProps {
  readonly direction: Direction;
  readonly onChange: (direction: Direction) => void;
}

export function DirectionToggle({ direction, onChange }: Readonly<DirectionToggleProps>) {
  return (
    <div className={styles.toggle}>
      <button
        className={`${styles.option} ${direction === 'eastbound' ? styles.active : ''}`}
        onClick={() => onChange('eastbound')}
        type="button"
      >
        Bremerton → Seattle{' '}
        <span className={styles.label}>Eastbound</span>
      </button>
      <button
        className={`${styles.option} ${direction === 'westbound' ? styles.active : ''}`}
        onClick={() => onChange('westbound')}
        type="button"
      >
        Seattle → Bremerton{' '}
        <span className={styles.label}>Westbound</span>
      </button>
    </div>
  );
}
