import { BadRequestException } from '@nestjs/common';
import { OrderStatus, ORDER_STATUS_TRANSITIONS } from './order-status';

/**
 * Validates whether an order status transition is allowed.
 *
 * This must be called BEFORE any status update is persisted.
 */
export function validateOrderStatusTransition(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
): void {
  const allowedNextStatuses = ORDER_STATUS_TRANSITIONS[currentStatus];

  if (!allowedNextStatuses) {
    throw new BadRequestException(
      `Invalid current order status: ${currentStatus}`,
    );
  }

  if (!allowedNextStatuses.includes(nextStatus)) {
    throw new BadRequestException(
      `Cannot transition order from ${currentStatus} to ${nextStatus}`,
    );
  }
}
