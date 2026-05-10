import { Injectable } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import type { OrderStatusWebhookDto } from './dto/order-status-webhook.dto';
import type { WebhookOrderStatusResult } from './types/webhook-process-result.type';

@Injectable()
export class WebhooksService {
  constructor(private readonly ordersService: OrdersService) {}

  async processOrderStatusWebhook(
    dto: OrderStatusWebhookDto,
  ): Promise<WebhookOrderStatusResult> {
    const order = await this.ordersService.applyExternalOrderStatusUpdate(
      dto.orderId,
      dto.status,
      dto.collectedAmount,
    );

    return {
      message: 'Webhook processed successfully',
      order,
    };
  }
}
