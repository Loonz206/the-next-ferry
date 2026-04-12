export type FerryType = 'fast' | 'slow';
export type Direction = 'eastbound' | 'westbound'; // eastbound = Bremerton→Seattle, westbound = Seattle→Bremerton

export interface FerryDeparture {
  /** Departure time in HH:mm (24h) */
  time: string;
  /** Arrival time in HH:mm (24h) */
  arrivalTime: string;
  direction: Direction;
  type: FerryType;
  available: boolean;
  /** Vessel name (slow ferry only) */
  vessel?: string;
  /** Vehicle capacity (slow ferry only) */
  vehicleCapacity?: number;
  /** Crossing time in minutes */
  crossingMinutes: number;
  /** Reason if unavailable */
  unavailableReason?: string;
}

export interface DaySchedule {
  /** ISO date string YYYY-MM-DD */
  date: string;
  dayOfWeek: string;
  departures: FerryDeparture[];
}

export interface WeekSchedule {
  /** ISO date of the Monday */
  weekStart: string;
  generated: string;
  days: DaySchedule[];
}

export type TimeOfDay = 'morning' | 'midday' | 'evening';

export interface TimeGroup {
  label: string;
  timeOfDay: TimeOfDay;
  departures: FerryDeparture[];
}
