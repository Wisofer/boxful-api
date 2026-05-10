import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { DayOfWeek } from '../enums/day-of-week.enum';

export type ShippingRateDocument = HydratedDocument<ShippingRate>;

@Schema({
  timestamps: true,
  collection: 'shippingrates',
})
export class ShippingRate {
  @Prop({
    type: String,
    enum: DayOfWeek,
    required: true,
    unique: true,
    index: true,
  })
  dayOfWeek!: DayOfWeek;

  @Prop({ required: true, min: Number.EPSILON })
  baseCost!: number;
}

export const ShippingRateSchema = SchemaFactory.createForClass(ShippingRate);
