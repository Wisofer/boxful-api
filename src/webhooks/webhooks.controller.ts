import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { OrderStatusWebhookDto } from './dto/order-status-webhook.dto';
import type { WebhookOrderStatusResult } from './types/webhook-process-result.type';
import { WebhooksService } from './webhooks.service';

@ApiTags('Webhooks')
@ApiExtraModels(OrderStatusWebhookDto)
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('orders/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar estado de orden (integración externa)',
    description:
      'Sin JWT (integración servidor a servidor simulada). No es una ruta típica de SPA usuario final; suele llamarse desde Postman, backend de demo o servidor del carrier. Actualiza `status`, opcionalmente `collectedAmount`, y recalcula financieros con `ShippingRatesService` + `LiquidationService`.',
  })
  @ApiBody({ type: OrderStatusWebhookDto })
  @ApiOkResponse({
    description: 'Procesamiento correcto',
    schema: {
      example: {
        message: 'Webhook processed successfully',
        order: {
          id: '…',
          status: 'DELIVERED',
          collectedAmount: 15,
          shippingCost: 10,
          commission: 0,
          liquidationAmount: 10,
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Payload inválido (ej. ObjectId mal formado)',
  })
  @ApiNotFoundResponse({ description: 'Orden inexistente' })
  async postOrderStatus(
    @Body() dto: OrderStatusWebhookDto,
  ): Promise<WebhookOrderStatusResult> {
    return this.webhooksService.processOrderStatusWebhook(dto);
  }
}
