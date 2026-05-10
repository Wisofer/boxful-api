import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Perfil del usuario autenticado',
    description:
      'Mismo objeto de usuario que en login/register; permite validar sesión tras recargar la app usando solo el JWT.',
  })
  @ApiOkResponse({
    description: 'Datos públicos del usuario actual',
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
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  me(@CurrentUser() user: AuthenticatedUser): { user: AuthenticatedUser } {
    return { user };
  }
}
