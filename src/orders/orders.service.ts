import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as Json2Csv from 'json2csv';
import type { QueryFilter } from 'mongoose';
import { Model, Types } from 'mongoose';
import { LiquidationService } from '../liquidation/liquidation.service';
import type { LiquidationOrderInput } from '../liquidation/types/liquidation-input.type';
import { ShippingRatesService } from '../shipping-rates/shipping-rates.service';
import type { CreateOrderDto } from './dto/create-order.dto';
import type { FilterOrdersDto } from './dto/filter-orders.dto';
import type { OrderPackageDto } from './dto/order-package.dto';
import type { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus } from './enums/order-status.enum';
import { Order, type OrderDocument } from './schemas/order.schema';
import type {
  SerializedOrder,
  SerializedPackage,
} from './types/serialized-order.type';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const ORDER_CSV_FIELD_DEFS = [
  { label: 'Order ID', value: 'orderId' },
  { label: 'Customer Name', value: 'customerName' },
  { label: 'Customer Phone', value: 'customerPhone' },
  { label: 'Customer Address', value: 'customerAddress' },
  { label: 'Department ID', value: 'departmentId' },
  { label: 'Municipality ID', value: 'municipalityId' },
  { label: 'Status', value: 'status' },
  { label: 'Is COD', value: 'isCod' },
  { label: 'Expected Amount', value: 'expectedAmount' },
  { label: 'Collected Amount', value: 'collectedAmount' },
  { label: 'Shipping Cost', value: 'shippingCost' },
  { label: 'Commission', value: 'commission' },
  { label: 'Liquidation Amount', value: 'liquidationAmount' },
  { label: 'Created At', value: 'createdAt' },
] as const;

type OrderCsvRow = Record<
  (typeof ORDER_CSV_FIELD_DEFS)[number]['value'],
  string | number
>;

type ResolvedOrderFinance = {
  shippingCost: number;
  commission: number;
  liquidationAmount: number;
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly shippingRatesService: ShippingRatesService,
    private readonly liquidationService: LiquidationService,
  ) {}

  async create(userId: string, dto: CreateOrderDto): Promise<SerializedOrder> {
    const isCOD = dto.isCOD ?? false;
    const expectedAmount = dto.expectedAmount ?? 0;
    const collectedAmount = dto.collectedAmount ?? 0;

    const finance = await this.computeFinance({
      isCOD,
      expectedAmount,
      collectedAmount,
    });

    const doc = await this.orderModel.create({
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      customerAddress: dto.customerAddress,
      departmentId: dto.departmentId?.trim() ?? '',
      municipalityId: dto.municipalityId?.trim() ?? '',
      notes: dto.notes?.trim() ?? '',
      status: dto.status ?? OrderStatus.PENDING,
      isCOD,
      expectedAmount,
      collectedAmount,
      shippingCost: finance.shippingCost,
      commission: finance.commission,
      liquidationAmount: finance.liquidationAmount,
      createdBy: new Types.ObjectId(userId),
      packages: this.mapPackageDtos(dto.packages),
    });

    return this.fromDocument(doc);
  }

  async findAllForUser(
    userId: string,
    filters: FilterOrdersDto,
  ): Promise<SerializedOrder[]> {
    const filterQuery = this.buildFilter(userId, filters);

    const rows = await this.orderModel
      .find(filterQuery)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return rows.map((doc) =>
      this.toSerialized(doc as unknown as SerializedOrderMongoJson),
    );
  }

  async exportOrdersCsv(
    userId: string,
    filters: FilterOrdersDto,
  ): Promise<string> {
    const orders = await this.findAllForUser(userId, filters);

    const rows: OrderCsvRow[] = orders.map((o) => ({
      orderId: o.id,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      customerAddress: o.customerAddress,
      departmentId: o.departmentId,
      municipalityId: o.municipalityId,
      status: o.status,
      isCod: String(o.isCOD),
      expectedAmount: o.expectedAmount,
      collectedAmount: o.collectedAmount,
      shippingCost: o.shippingCost,
      commission: o.commission,
      liquidationAmount: o.liquidationAmount,
      createdAt: o.createdAt,
    }));

    const parser = new Json2Csv.Parser({
      fields: [...ORDER_CSV_FIELD_DEFS],
      withBOM: true,
    });

    return parser.parse(rows);
  }

  async findOneForUser(
    userId: string,
    orderId: string,
  ): Promise<SerializedOrder> {
    const doc = await this.resolveDocument(userId, orderId);
    return this.fromDocument(doc);
  }

  async updateOneForUser(
    userId: string,
    orderId: string,
    dto: UpdateOrderDto,
  ): Promise<SerializedOrder> {
    const doc = await this.resolveDocument(userId, orderId);

    if (dto.customerName !== undefined) doc.customerName = dto.customerName;
    if (dto.customerPhone !== undefined) doc.customerPhone = dto.customerPhone;
    if (dto.customerAddress !== undefined) {
      doc.customerAddress = dto.customerAddress;
    }
    if (dto.departmentId !== undefined) {
      doc.departmentId = dto.departmentId.trim();
    }
    if (dto.municipalityId !== undefined) {
      doc.municipalityId = dto.municipalityId.trim();
    }
    if (dto.notes !== undefined) doc.notes = dto.notes;
    if (dto.status !== undefined) doc.status = dto.status;
    if (dto.isCOD !== undefined) doc.isCOD = dto.isCOD;
    if (dto.expectedAmount !== undefined)
      doc.expectedAmount = dto.expectedAmount;
    if (dto.collectedAmount !== undefined)
      doc.collectedAmount = dto.collectedAmount;

    if (dto.packages !== undefined) {
      doc.packages = this.mapPackageDtos(dto.packages);
    }

    await this.refreshFinancials(doc);
    await doc.save();

    return this.fromDocument(doc);
  }

  async removeOneForUser(userId: string, orderId: string): Promise<void> {
    await this.resolveDocument(userId, orderId);

    const result = await this.orderModel.deleteOne({
      _id: new Types.ObjectId(orderId),
      createdBy: new Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Orden no encontrada');
    }
  }

  async applyExternalOrderStatusUpdate(
    orderId: string,
    status: OrderStatus,
    collectedAmount?: number,
  ): Promise<SerializedOrder> {
    const doc = await this.orderModel.findById(orderId).exec();

    if (!doc) {
      throw new NotFoundException('Orden no encontrada');
    }

    doc.status = status;

    if (collectedAmount !== undefined) {
      doc.collectedAmount = collectedAmount;
    }

    await this.refreshFinancials(doc);
    await doc.save();

    return this.fromDocument(doc);
  }

  private async computeFinance(
    input: Omit<LiquidationOrderInput, 'shippingCost'>,
  ): Promise<ResolvedOrderFinance> {
    const shippingCost = await this.shippingRatesService.getShippingCostForDate(
      new Date(),
    );
    const { commission, liquidationAmount } =
      this.liquidationService.computeLiquidationSnapshot({
        ...input,
        shippingCost,
      });

    return {
      shippingCost,
      commission,
      liquidationAmount,
    };
  }

  private async refreshFinancials(doc: OrderDocument): Promise<void> {
    const finance = await this.computeFinance({
      isCOD: doc.isCOD,
      expectedAmount: doc.expectedAmount,
      collectedAmount: doc.collectedAmount,
    });

    doc.shippingCost = finance.shippingCost;
    doc.commission = finance.commission;
    doc.liquidationAmount = finance.liquidationAmount;
  }

  private buildFilter(
    userId: string,
    filters: FilterOrdersDto,
  ): QueryFilter<OrderDocument> {
    const oid = new Types.ObjectId(userId);
    const filterQuery: QueryFilter<OrderDocument> = { createdBy: oid };

    if (filters.status !== undefined) {
      filterQuery.status = filters.status;
    }

    if (filters.isCOD !== undefined) {
      filterQuery.isCOD = filters.isCOD;
    }

    if (filters.customerName !== undefined && filters.customerName.length > 0) {
      filterQuery.customerName = {
        $regex: new RegExp(escapeRegex(filters.customerName), 'i'),
      };
    }

    if (filters.startDate ?? filters.endDate) {
      const range: { $gte?: Date; $lte?: Date } = {};
      if (filters.startDate) {
        range.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        range.$lte = new Date(filters.endDate);
      }
      filterQuery.createdAt = range;
    }

    return filterQuery;
  }

  private async resolveDocument(
    userId: string,
    orderId: string,
  ): Promise<OrderDocument> {
    const doc = await this.orderModel.findById(orderId).exec();

    if (!doc) {
      throw new NotFoundException('Orden no encontrada');
    }

    const oid = new Types.ObjectId(userId);

    const createdByOid =
      doc.createdBy instanceof Types.ObjectId
        ? doc.createdBy
        : new Types.ObjectId(String(doc.createdBy));

    if (!createdByOid.equals(oid)) {
      throw new ForbiddenException('No tienes acceso a esta orden');
    }

    return doc;
  }

  private mapPackageDtos(packages: OrderPackageDto[]): SerializedPackage[] {
    return packages.map((p) => ({
      description: p.description?.trim() ?? '',
      weight: p.weight,
      height: p.height,
      width: p.width,
      length: p.length,
      quantity: p.quantity,
    }));
  }

  private fromDocument(doc: OrderDocument): SerializedOrder {
    const json = doc.toJSON() as unknown as SerializedOrderMongoJson;
    type WithTimestamps = OrderDocument & {
      createdAt?: Date;
      updatedAt?: Date;
    };

    const d = doc as WithTimestamps;
    return this.toSerialized({
      ...json,
      createdAt: json.createdAt ?? d.createdAt,
      updatedAt: json.updatedAt ?? d.updatedAt,
    });
  }

  private toSerialized(raw: SerializedOrderMongoJson): SerializedOrder {
    const id = typeof raw._id === 'string' ? raw._id : raw._id.toHexString();

    return {
      id,
      customerName: raw.customerName ?? '',
      customerPhone: raw.customerPhone ?? '',
      customerAddress: raw.customerAddress ?? '',
      departmentId: raw.departmentId ?? '',
      municipalityId: raw.municipalityId ?? '',
      notes: raw.notes ?? '',
      status: raw.status ?? OrderStatus.PENDING,
      isCOD: Boolean(raw.isCOD),
      expectedAmount: raw.expectedAmount ?? 0,
      collectedAmount: raw.collectedAmount ?? 0,
      shippingCost: raw.shippingCost ?? 0,
      commission: raw.commission ?? 0,
      liquidationAmount: raw.liquidationAmount ?? 0,
      packages: (raw.packages ?? []).map((p) => ({
        ...p,
      })),
      createdAt: raw.createdAt
        ? new Date(raw.createdAt).toISOString()
        : new Date(0).toISOString(),
      updatedAt: raw.updatedAt
        ? new Date(raw.updatedAt).toISOString()
        : new Date(0).toISOString(),
    };
  }
}

type SerializedOrderMongoJson = {
  _id: Types.ObjectId | string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  departmentId?: string;
  municipalityId?: string;
  notes?: string;
  status?: OrderStatus;
  isCOD?: boolean;
  expectedAmount?: number;
  collectedAmount?: number;
  shippingCost?: number;
  commission?: number;
  liquidationAmount?: number;
  packages?: SerializedPackage[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
};
