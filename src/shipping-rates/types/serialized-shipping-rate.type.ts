import type { DayOfWeek } from '../enums/day-of-week.enum';

export type SerializedShippingRate = {
  id: string;
  dayOfWeek: DayOfWeek;
  baseCost: number;
  createdAt: string;
  updatedAt: string;
};
