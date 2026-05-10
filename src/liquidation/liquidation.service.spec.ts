import { LiquidationService } from './liquidation.service';

describe('LiquidationService', () => {
  let service: LiquidationService;

  beforeEach(() => {
    service = new LiquidationService();
  });

  describe('computeLiquidationSnapshot', () => {
    it('non-COD: comisión 0 y liquidación = envío', () => {
      const r = service.computeLiquidationSnapshot({
        isCOD: false,
        expectedAmount: 0,
        collectedAmount: 999,
        shippingCost: 14.25,
      });
      expect(r.commission).toBe(0);
      expect(r.liquidationAmount).toBeCloseTo(14.25, 4);
    });

    it('COD con recolectado: comisión 0.01% y tope USD 25', () => {
      const rSmall = service.computeLiquidationSnapshot({
        isCOD: true,
        expectedAmount: 0,
        collectedAmount: 400_000,
        shippingCost: 10,
      });
      expect(rSmall.commission).toBe(25);
      expect(rSmall.liquidationAmount).toBeCloseTo(400_000 - 10 - 25, 4);

      const rBelowCap = service.computeLiquidationSnapshot({
        isCOD: true,
        expectedAmount: 0,
        collectedAmount: 8000,
        shippingCost: 5,
      });
      expect(rBelowCap.commission).toBeCloseTo(0.8, 4);
      expect(rBelowCap.liquidationAmount).toBeCloseTo(8000 - 5 - 0.8, 4);
    });

    it('COD sin recolectado: comisión 0 y esperado provisional', () => {
      const r = service.computeLiquidationSnapshot({
        isCOD: true,
        expectedAmount: 100,
        collectedAmount: 0,
        shippingCost: 10,
      });
      expect(r.commission).toBe(0);
      expect(r.liquidationAmount).toBeCloseTo(90, 4);
    });
  });
});
