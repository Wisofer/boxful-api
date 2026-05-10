import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { OrderStatus } from '../enums/order-status.enum';
import { parseBooleanQuery, trimString } from './trim-fields.util';

export class FilterOrdersDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'true | false' })
  @IsOptional()
  @Transform(parseBooleanQuery)
  @IsBoolean()
  isCOD?: boolean;

  @ApiPropertyOptional({
    description: 'Búsqueda parcial insensible a mayúsculas',
  })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(200)
  customerName?: string;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59.999Z' })
  @IsOptional()
  @IsISO8601()
  endDate?: string;
}
