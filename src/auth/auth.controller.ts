import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { PublicUser } from '../users/types/public-user.types';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registro de usuario',
    description:
      'Público. Devuelve `user` sin contraseña; no envíes `Authorization`.',
  })
  @ApiCreatedResponse({
    description: 'Usuario creado (sin contraseña)',
    schema: {
      example: {
        user: {
          id: '682a1c2ef3a1f2abcd123456',
          name: 'Ana Martínez',
          email: 'ana@ejemplo.com',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validación incorrecta',
  })
  @ApiConflictResponse({ description: 'Email ya registrado' })
  async register(@Body() dto: RegisterDto): Promise<{ user: PublicUser }> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Inicio de sesión',
    description:
      'Público. Guarda `access_token` y úsalo como `Bearer` en rutas protegidas.',
  })
  @ApiOkResponse({
    description: 'JWT y datos básicos del usuario',
    schema: {
      example: {
        access_token: '<jwt>',
        user: {
          id: '682a1c2ef3a1f2abcd123456',
          name: 'Ana Martínez',
          email: 'ana@ejemplo.com',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Validación incorrecta' })
  @ApiUnauthorizedResponse({ description: 'Credenciales incorrectas' })
  async login(
    @Body() dto: LoginDto,
  ): Promise<{ access_token: string; user: PublicUser }> {
    return this.authService.login(dto);
  }
}
