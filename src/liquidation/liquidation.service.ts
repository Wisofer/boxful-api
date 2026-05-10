import { Injectable } from '@nestjs/common';
import {
  COD_COMMISSION_MAX_USD,
  COD_COMMISSION_RATE,
} from './constants/liquidation.constants';
import type { LiquidationOrderInput } from './types/liquidation-input.type';

export type LiquidationResult = {
  commission: number;
  liquidationAmount: number;
};

function roundUsd4(value: number): number {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

@Injectable()
export class LiquidationService {
  computeLiquidationSnapshot(input: LiquidationOrderInput): LiquidationResult {
    const shipping = Math.max(input.shippingCost, 0);
    const expected = Math.max(input.expectedAmount, 0);
    const collected = Math.max(input.collectedAmount, 0);

    if (!input.isCOD) {
      return {
        commission: 0,
        liquidationAmount: roundUsd4(shipping),
      };
    }

    const commissionEligible = collected > 0;
    const rawCommission = commissionEligible
      ? collected * COD_COMMISSION_RATE
      : 0;
    const commission = commissionEligible
      ? roundUsd4(Math.min(rawCommission, COD_COMMISSION_MAX_USD))
      : 0;

    const liquidationBasis = collected > 0 ? collected : expected;
    const liquidationAmount = liquidationBasis - shipping - commission;

    return {
      commission,
      liquidationAmount: roundUsd4(liquidationAmount),
    };
  }
}
