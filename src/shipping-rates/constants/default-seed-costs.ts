import { DayOfWeek } from '../enums/day-of-week.enum';

export const DEFAULT_SHIPPING_SEED_COSTS_USD: Readonly<
  Record<DayOfWeek, number>
> = {
  [DayOfWeek.MONDAY]: 10,
  [DayOfWeek.TUESDAY]: 10,
  [DayOfWeek.WEDNESDAY]: 10,
  [DayOfWeek.THURSDAY]: 10,
  [DayOfWeek.FRIDAY]: 10,
  [DayOfWeek.SATURDAY]: 14,
  [DayOfWeek.SUNDAY]: 16,
} as const;
