import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { OrderStatus } from '../../orders/enums/order-status.enum';

export class OrderStatusWebhookDto {
  @ApiProperty({ description: 'Id MongoDB de la orden (24 hex).' })
  @IsMongoId({ message: 'orderId debe ser un ObjectId válido' })
  orderId!: string;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.DELIVERED })
  @IsEnum(OrderStatus, { message: 'status debe ser un valor de OrderStatus' })
  status!: OrderStatus;

  @ApiPropertyOptional({
    description:
      'Monto realmente cobrado (COD). Si se omite, se conserva el valor actual y se recalcula finanzas con tarifa del día.',
    example: 15,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive({ message: 'collectedAmount debe ser mayor que 0' })
  collectedAmount?: number;
}
