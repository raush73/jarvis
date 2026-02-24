/**
 * Order lifecycle statuses
 *
 * IMPORTANT:
 * - Status changes are controlled by business rules
 * - Status MUST NOT be arbitrarily updated
 *
 * Must match Prisma enum OrderStatus in schema.prisma:
 * DRAFT, NEEDS_TO_BE_FILLED, FILLED, COMPLETED, CANCELLED
 */
export enum OrderStatus {
    DRAFT = 'DRAFT',
    NEEDS_TO_BE_FILLED = 'NEEDS_TO_BE_FILLED',
    FILLED = 'FILLED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
  }
  
  /**
   * Allowed status transitions
   * This is the canonical single source of truth for order status transitions.
   */
  export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.DRAFT]: [OrderStatus.NEEDS_TO_BE_FILLED, OrderStatus.CANCELLED],
  
    [OrderStatus.NEEDS_TO_BE_FILLED]: [OrderStatus.FILLED, OrderStatus.CANCELLED],
  
    [OrderStatus.FILLED]: [OrderStatus.COMPLETED],
  
    [OrderStatus.COMPLETED]: [],
  
    [OrderStatus.CANCELLED]: [],
  };

  /**
   * Required permissions for each status transition.
   * Format: `${fromStatus}->${toStatus}` -> required permission key
   * Defaults to 'orders.write' if not specified.
   */
  export const ORDER_STATUS_TRANSITION_PERMISSIONS: Record<string, string> = {
    [`${OrderStatus.DRAFT}->${OrderStatus.NEEDS_TO_BE_FILLED}`]: 'orders.write',
    [`${OrderStatus.DRAFT}->${OrderStatus.CANCELLED}`]: 'orders.write',
    [`${OrderStatus.NEEDS_TO_BE_FILLED}->${OrderStatus.FILLED}`]: 'orders.write',
    [`${OrderStatus.NEEDS_TO_BE_FILLED}->${OrderStatus.CANCELLED}`]: 'orders.write',
    [`${OrderStatus.FILLED}->${OrderStatus.COMPLETED}`]: 'orders.write',
  };
  