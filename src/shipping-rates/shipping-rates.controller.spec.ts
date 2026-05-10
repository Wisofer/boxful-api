import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ShippingRatesController } from './shipping-rates.controller';
import { ShippingRatesService } from './shipping-rates.service';

describe('ShippingRatesController', () => {
  let controller: ShippingRatesController;

  const ratesMock = {
    create: jest.fn(),
    findAllSorted: jest.fn(),
    updateOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShippingRatesController],
      providers: [{ provide: ShippingRatesService, useValue: ratesMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ShippingRatesController>(ShippingRatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
