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

export class LoginDto {
  @ApiProperty({ example: 'ana@ejemplo.com' })
  @Transform(trimString)
  @IsEmail({}, { message: 'El email debe ser válido' })
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'secreta123' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(128)
  password!: string;
}
