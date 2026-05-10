import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { OrderStatus } from '../enums/order-status.enum';
import { OrderPackage, OrderPackageSchema } from './order-package.schema';

export type OrderDocument = HydratedDocument<Order>;

@Schema({
  timestamps: true,
  collection: 'orders',
})
export class Order {
  @Prop({ required: true, trim: true, maxlength: 200 })
  customerName!: string;

  @Prop({ required: true, trim: true, maxlength: 40 })
  customerPhone!: string;

  @Prop({ required: true, trim: true, maxlength: 1000 })
  customerAddress!: string;

  @Prop({ trim: true, maxlength: 128, default: '' })
  departmentId!: string;

  @Prop({ trim: true, maxlength: 128, default: '' })
  municipalityId!: string;

  @Prop({ trim: true, maxlength: 5000, default: '' })
  notes!: string;

  @Prop({
    type: String,
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status!: OrderStatus;

  @Prop({ default: false })
  isCOD!: boolean;

  @Prop({ required: true, min: 0, default: 0 })
  expectedAmount!: number;

  @Prop({ required: true, min: 0, default: 0 })
  collectedAmount!: number;

  @Prop({ required: true, min: 0, default: 0 })
  shippingCost!: number;

  @Prop({ required: true, min: 0, default: 0 })
  commission!: number;

  @Prop({ required: true })
  liquidationAmount!: number;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  createdBy!: Types.ObjectId;

  @Prop({ type: [OrderPackageSchema], default: [] })
  packages!: OrderPackage[];
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ createdBy: 1, createdAt: -1 });
OrderSchema.index({ createdBy: 1, status: 1 });
