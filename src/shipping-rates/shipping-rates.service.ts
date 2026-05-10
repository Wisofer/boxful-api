import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MongoServerError } from 'mongodb';
import { Model, Types } from 'mongoose';
import { DAY_SORT_ORDER } from './constants/day-order';
import { DEFAULT_SHIPPING_SEED_COSTS_USD } from './constants/default-seed-costs';
import type { CreateShippingRateDto } from './dto/create-shipping-rate.dto';
import type { UpdateShippingRateDto } from './dto/update-shipping-rate.dto';
import type { DayOfWeek } from './enums/day-of-week.enum';
import {
  ShippingRate,
  type ShippingRateDocument,
} from './schemas/shipping-rate.schema';
import type { SerializedShippingRate } from './types/serialized-shipping-rate.type';
import { dayOfWeekFromDate } from './utils/map-js-day';

type ShippingRateJson = {
  _id: Types.ObjectId | string;
  dayOfWeek: DayOfWeek;
  baseCost: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

@Injectable()
export class ShippingRatesService implements OnApplicationBootstrap {
  constructor(
    @InjectModel(ShippingRate.name)
    private readonly shippingRateModel: Model<ShippingRateDocument>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    for (const day of DAY_SORT_ORDER) {
      const baseCost = DEFAULT_SHIPPING_SEED_COSTS_USD[day];

      await this.shippingRateModel.updateOne(
        { dayOfWeek: day },
        {
          $setOnInsert: {
            dayOfWeek: day,
            baseCost,
          },
        },
        { upsert: true },
      );
    }
  }

  async create(dto: CreateShippingRateDto): Promise<SerializedShippingRate> {
    try {
      const doc = await this.shippingRateModel.create({
        dayOfWeek: dto.dayOfWeek,
        baseCost: dto.baseCost,
      });

      return this.toSerialized(doc.toJSON());
    } catch (err: unknown) {
      if (err instanceof MongoServerError && err.code === 11000) {
        throw new ConflictException(
          'Ya existe una tarifa configurada para ese día',
        );
      }

      throw err;
    }
  }

  async findAllSorted(): Promise<SerializedShippingRate[]> {
    const docs = await this.shippingRateModel.find().lean().exec();

    const rowByDay = new Map<DayOfWeek, SerializedShippingRate>();

    for (const d of docs) {
      const row = this.toSerialized(d);
      rowByDay.set(row.dayOfWeek, row);
    }

    return DAY_SORT_ORDER.map((d) => rowByDay.get(d)).filter(
      (row): row is SerializedShippingRate => row !== undefined,
    );
  }

  async updateOne(
    id: string,
    dto: UpdateShippingRateDto,
  ): Promise<SerializedShippingRate> {
    const doc = await this.shippingRateModel.findById(id).exec();

    if (!doc) {
      throw new NotFoundException('Tarifa no encontrada');
    }

    if (dto.dayOfWeek !== undefined) {
      const conflict = await this.shippingRateModel
        .findOne({
          dayOfWeek: dto.dayOfWeek,
          _id: { $ne: new Types.ObjectId(id) },
        })
        .lean()
        .exec();

      if (conflict) {
        throw new ConflictException(
          'Otro registro ya usa ese día de la semana',
        );
      }

      doc.dayOfWeek = dto.dayOfWeek;
    }

    if (dto.baseCost !== undefined) {
      doc.baseCost = dto.baseCost;
    }

    await doc.save();

    return this.toSerialized(doc.toJSON());
  }

  async getShippingCostForDate(referenceDate = new Date()): Promise<number> {
    const day = dayOfWeekFromDate(referenceDate);
    const doc = await this.shippingRateModel
      .findOne({ dayOfWeek: day })
      .select('baseCost')
      .lean()
      .exec();

    const cost = doc?.baseCost;
    if (typeof cost !== 'number' || !Number.isFinite(cost) || cost <= 0) {
      throw new NotFoundException(
        `Sin tarifa de envío configurada para ${day}. Ejecutar seed inicial o crear registros.`,
      );
    }

    return cost;
  }

  private toSerialized(raw: ShippingRateJson): SerializedShippingRate {
    const id = typeof raw._id === 'string' ? raw._id : raw._id.toHexString();

    const createdIso =
      raw.createdAt instanceof Date
        ? raw.createdAt.toISOString()
        : typeof raw.createdAt === 'string' && raw.createdAt.length > 0
          ? new Date(raw.createdAt).toISOString()
          : new Date(0).toISOString();

    const updatedIso =
      raw.updatedAt instanceof Date
        ? raw.updatedAt.toISOString()
        : typeof raw.updatedAt === 'string' && raw.updatedAt.length > 0
          ? new Date(raw.updatedAt).toISOString()
          : createdIso;

    return {
      id,
      dayOfWeek: raw.dayOfWeek,
      baseCost: raw.baseCost,
      createdAt: createdIso,
      updatedAt: updatedIso,
    };
  }
}
