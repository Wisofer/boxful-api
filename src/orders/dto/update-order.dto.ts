import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { CreateOrderDto } from './create-order.dto';
import { OrderPackageDto } from './order-package.dto';

export class UpdateOrderDto extends PartialType(
  OmitType(CreateOrderDto, ['packages'] as const),
) {
  @ApiPropertyOptional({
    description:
      'Si se envía, reemplaza el arreglo de paquetes completo (mínimo una línea).',
    type: [OrderPackageDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderPackageDto)
  @ArrayMinSize(1)
  packages?: OrderPackageDto[];
}
