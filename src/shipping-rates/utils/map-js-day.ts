import { DayOfWeek } from '../enums/day-of-week.enum';

const JS_DAY_TO_ENUM: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUNDAY,
  1: DayOfWeek.MONDAY,
  2: DayOfWeek.TUESDAY,
  3: DayOfWeek.WEDNESDAY,
  4: DayOfWeek.THURSDAY,
  5: DayOfWeek.FRIDAY,
  6: DayOfWeek.SATURDAY,
};

export function dayOfWeekFromDate(date = new Date()): DayOfWeek {
  const jsDay = date.getDay();

  const mapped = JS_DAY_TO_ENUM[jsDay];
  if (mapped === undefined) {
    throw new Error(`Índice de día inválido: ${jsDay}`);
  }

  return mapped;
}
