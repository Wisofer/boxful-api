import type { SerializedOrder } from '../../orders/types/serialized-order.type';

export type WebhookOrderStatusResult = {
  message: string;
  order: SerializedOrder;
};
