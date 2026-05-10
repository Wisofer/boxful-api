import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ShippingRate,
  ShippingRateSchema,
} from './schemas/shipping-rate.schema';
import { ShippingRatesController } from './shipping-rates.controller';
import { ShippingRatesService } from './shipping-rates.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ShippingRate.name, schema: ShippingRateSchema },
    ]),
  ],
  controllers: [ShippingRatesController],
  providers: [ShippingRatesService],
  exports: [ShippingRatesService],
})
export class ShippingRatesModule {}
