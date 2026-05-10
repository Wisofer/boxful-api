import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ShippingRate } from './schemas/shipping-rate.schema';
import { ShippingRatesService } from './shipping-rates.service';

describe('ShippingRatesService', () => {
  let service: ShippingRatesService;

  const modelMock = {
    updateOne: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShippingRatesService,
        {
          provide: getModelToken(ShippingRate.name),
          useValue: modelMock,
        },
      ],
    }).compile();

    service = module.get<ShippingRatesService>(ShippingRatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
