import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { CreateShippingRateDto } from './dto/create-shipping-rate.dto';
import { UpdateShippingRateDto } from './dto/update-shipping-rate.dto';
import type { SerializedShippingRate } from './types/serialized-shipping-rate.type';
import { ShippingRatesService } from './shipping-rates.service';

@ApiTags('Shipping rates')
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(CreateShippingRateDto, UpdateShippingRateDto)
@ApiUnauthorizedResponse({ description: 'No autenticado' })
@UseGuards(JwtAuthGuard)
@Controller('shipping-rates')
export class ShippingRatesController {
  constructor(private readonly shippingRatesService: ShippingRatesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear tarifa por día',
    description: 'No puede repetir `dayOfWeek` (clave única).',
  })
  @ApiBody({ type: CreateShippingRateDto })
  @ApiCreatedResponse({
    description: 'Tarifa creada',
  })
  @ApiConflictResponse({ description: 'Día ya registrado' })
  create(
    @CurrentUser() _user: AuthenticatedUser,
    @Body() dto: CreateShippingRateDto,
  ): Promise<SerializedShippingRate> {
    void _user;
    return this.shippingRatesService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar tarifas ordenadas Domingo → Sábado',
  })
  @ApiOkResponse({ description: 'Tarifas' })
  findAll(
    @CurrentUser() _user: AuthenticatedUser,
  ): Promise<SerializedShippingRate[]> {
    void _user;
    return this.shippingRatesService.findAllSorted();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar tarifa' })
  @ApiBody({ type: UpdateShippingRateDto })
  @ApiOkResponse({ description: 'Tarifa actualizada' })
  @ApiNotFoundResponse()
  @ApiConflictResponse({ description: 'Conflicto de día único' })
  updateOne(
    @CurrentUser() _user: AuthenticatedUser,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateShippingRateDto,
  ): Promise<SerializedShippingRate> {
    void _user;
    return this.shippingRatesService.updateOne(id, dto);
  }
}
