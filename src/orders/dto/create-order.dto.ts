import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { OrderStatus } from '../enums/order-status.enum';
import { OrderPackageDto } from './order-package.dto';
import { trimString } from './trim-fields.util';

export class CreateOrderDto {
  @ApiProperty({ example: 'Laura Gómez' })
  @Transform(trimString)
  @IsString()
  @MaxLength(200)
  customerName!: string;

  @ApiProperty({ example: '+52 5512345678' })
  @Transform(trimString)
  @IsString()
  @MaxLength(40)
  customerPhone!: string;

  @ApiProperty({ example: 'Av. Reforma 123, CDMX' })
  @Transform(trimString)
  @IsString()
  @MaxLength(1000)
  customerAddress!: string;

  @ApiPropertyOptional({
    description:
      'Id de departamento del destinatario (mismo id que el selector del cliente). Opcional por compatibilidad; vacío si no aplica.',
    example: '06',
  })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(128)
  departmentId?: string;

  @ApiPropertyOptional({
    description:
      'Id de municipio del destinatario (mismo id que el selector del cliente). Opcional por compatibilidad; vacío si no aplica.',
    example: '0601',
  })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(128)
  municipalityId?: string;

  @ApiPropertyOptional({ example: 'Entrega por la tarde' })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(5000)
  notes?: string;

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isCOD?: boolean;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  expectedAmount?: number;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  collectedAmount?: number;

  @ApiProperty({
    description: 'Líneas de paquete (al menos uno)',
    type: [OrderPackageDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderPackageDto)
  @ArrayMinSize(1)
  packages!: OrderPackageDto[];
}
