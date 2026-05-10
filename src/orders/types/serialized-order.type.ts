import type { OrderStatus } from '../enums/order-status.enum';

export type SerializedPackage = {
  description: string;
  weight: number;
  height: number;
  width: number;
  length: number;
  quantity: number;
};

export type SerializedOrder = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  departmentId: string;
  municipalityId: string;
  notes: string;
  status: OrderStatus;
  isCOD: boolean;
  expectedAmount: number;
  collectedAmount: number;
  shippingCost: number;
  commission: number;
  liquidationAmount: number;
  packages: SerializedPackage[];
  createdAt: string;
  updatedAt: string;
};
