import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { LiquidationService } from '../liquidation/liquidation.service';
import { ShippingRatesService } from '../shipping-rates/shipping-rates.service';
import { Order } from './schemas/order.schema';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;

  const mockOrderModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    deleteOne: jest.fn(),
  };

  const shippingRatesMock = {
    getShippingCostForDate: jest.fn().mockResolvedValue(10),
  };

  const liquidationMock = {
    computeLiquidationSnapshot: jest.fn().mockReturnValue({
      commission: 0,
      liquidationAmount: 10,
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getModelToken(Order.name), useValue: mockOrderModel },
        { provide: ShippingRatesService, useValue: shippingRatesMock },
        { provide: LiquidationService, useValue: liquidationMock },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
