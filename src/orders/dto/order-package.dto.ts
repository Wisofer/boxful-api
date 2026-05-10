import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { trimString } from './trim-fields.util';

export class OrderPackageDto {
  @ApiPropertyOptional({ example: 'Caja frágil' })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: 2.5, minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weight!: number;

  @ApiProperty({ example: 30, minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  height!: number;

  @ApiProperty({ example: 20, minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  width!: number;

  @ApiProperty({ example: 40, minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  length!: number;

  @ApiProperty({ example: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  quantity!: number;
}
