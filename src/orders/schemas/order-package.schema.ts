import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class OrderPackage {
  @Prop({ trim: true, maxlength: 2000, default: '' })
  description!: string;

  @Prop({ required: true, min: 0 })
  weight!: number;

  @Prop({ required: true, min: 0 })
  height!: number;

  @Prop({ required: true, min: 0 })
  width!: number;

  @Prop({ required: true, min: 0 })
  length!: number;

  @Prop({ required: true, min: 1 })
  quantity!: number;
}

export const OrderPackageSchema = SchemaFactory.createForClass(OrderPackage);
