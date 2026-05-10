import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { trimString } from './trim.transform';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Ana Martínez', description: 'Nombre visible' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'ana@ejemplo.com' })
  @Transform(trimString)
  @IsEmail({}, { message: 'El email debe ser válido' })
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'secreta123', minLength: 6 })
  @Transform(trimString)
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(128)
  password!: string;
}
