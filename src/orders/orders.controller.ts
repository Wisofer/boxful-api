import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { CreateOrderDto } from './dto/create-order.dto';
import { FilterOrdersDto } from './dto/filter-orders.dto';
import { OrderPackageDto } from './dto/order-package.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import type { SerializedOrder } from './types/serialized-order.type';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(
  OrderPackageDto,
  CreateOrderDto,
  UpdateOrderDto,
  FilterOrdersDto,
)
@ApiUnauthorizedResponse({ description: 'No autenticado' })
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear orden de envío',
    description:
      '`shippingCost`, `commission` y `liquidationAmount` se calculan en servidor (costo por día configurado + reglas COD del PDF).',
  })
  @ApiBody({ type: CreateOrderDto })
  @ApiCreatedResponse({
    description: 'Orden creada',
    schema: {
      example: {
        id: '682abc0123456789abcdef12',
        customerName: 'Laura Gómez',
        status: 'PENDING',
        isCOD: false,
        packages: [
          {
            description: '',
            weight: 1,
            height: 1,
            width: 1,
            length: 1,
            quantity: 1,
          },
        ],
        createdAt: '2026-05-08T12:00:00.000Z',
        updatedAt: '2026-05-08T12:00:00.000Z',
      },
    },
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrderDto,
  ): Promise<SerializedOrder> {
    return this.ordersService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar órdenes del usuario (más recientes primero)',
    description:
      'Filtros query opcionales: `status`, `isCOD`, `customerName`, `startDate`, `endDate` (ISO 8601).',
  })
  @ApiOkResponse({ description: 'Listado ordenado por fecha descendente' })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filters: FilterOrdersDto,
  ): Promise<SerializedOrder[]> {
    return this.ordersService.findAllForUser(user.id, filters);
  }

  @Get('export/csv')
  @ApiOperation({
    summary: 'Exportar órdenes a CSV',
    description:
      'Mismos filtros query que el listado JSON (`status`, `isCOD`, `customerName`, `startDate`, `endDate`). Orden descendente por fecha de creación. Solo datos del usuario autenticado.',
  })
  @ApiProduces('text/csv')
  @ApiOkResponse({
    description: 'CSV descargable',
    content: {
      'text/csv': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Parámetros de consulta inválidos (ej. fechas fuera del formato ISO 8601).',
  })
  async exportCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filters: FilterOrdersDto,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    const csv = await this.ordersService.exportOrdersCsv(user.id, filters);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
    res.send(csv);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una orden propia' })
  @ApiOkResponse({ description: 'Orden' })
  @ApiNotFoundResponse({ description: 'Orden inexistente' })
  @ApiForbiddenResponse({
    description: 'La orden pertenece a otro usuario',
  })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseObjectIdPipe) orderId: string,
  ): Promise<SerializedOrder> {
    return this.ordersService.findOneForUser(user.id, orderId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar orden',
    description:
      'Campos opcionales. Si envía `packages`, reemplaza el arreglo completo. Siempre recalcula envío/comisión/liquidación con tarifa del día según fecha de esta actualización.',
  })
  @ApiBody({ type: UpdateOrderDto })
  @ApiOkResponse({ description: 'Orden actualizada' })
  @ApiNotFoundResponse()
  @ApiForbiddenResponse()
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseObjectIdPipe) orderId: string,
    @Body() dto: UpdateOrderDto,
  ): Promise<SerializedOrder> {
    return this.ordersService.updateOneForUser(user.id, orderId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar orden' })
  @ApiNoContentResponse({ description: 'Eliminada' })
  @ApiNotFoundResponse()
  @ApiForbiddenResponse()
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseObjectIdPipe) orderId: string,
  ): Promise<void> {
    return this.ordersService.removeOneForUser(user.id, orderId);
  }
}
