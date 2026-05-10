import { Module } from '@nestjs/common';
import { LiquidationService } from './liquidation.service';

@Module({
  providers: [LiquidationService],
  exports: [LiquidationService],
})
export class LiquidationModule {}
