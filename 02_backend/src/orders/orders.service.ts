import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, ORDER_STATUS_TRANSITION_PERMISSIONS } from './order-status';
import { validateOrderStatusTransition } from './order-status.validator';
import { $Enums, Prisma} from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { assertHasPermissions } from '../auth/permission.assert';

/**
 * OrdersService
 *
 * This service owns ALL order business logic.
 * Controllers must delegate to this service.
 */
@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate and apply a status transition (pure business logic)
   */
  validateStatusChange(
    currentStatus: OrderStatus,
    nextStatus: OrderStatus,
  ): OrderStatus {
    if (currentStatus === nextStatus) {
      throw new BadRequestException('Order is already in the requested status');
    }

    validateOrderStatusTransition(currentStatus, nextStatus);

    return nextStatus;
  }

  /**
   * Check if user has required permission for status transition.
   * Throws ForbiddenException (403) if user lacks permission.
   */
  checkTransitionPermission(
    currentStatus: OrderStatus,
    nextStatus: OrderStatus,
    userPermissions: string[],
  ): void {
    const transitionKey = `${currentStatus}->${nextStatus}`;
    const requiredPermission =
      ORDER_STATUS_TRANSITION_PERMISSIONS[transitionKey] || 'orders.write';

      assertHasPermissions(
        userPermissions,
        requiredPermission,
        `order status transition ${currentStatus} -> ${nextStatus}`,
      );
  
  }

  /**
   * Persisted status change
   *
   * - Reads order from DB
   * - Validates transition (400 if invalid)
   * - Checks user permissions (403 if insufficient)
   * - Writes new status
   */
  async updateOrderStatus(
    orderId: string,
    nextStatus: OrderStatus,
    userPermissions: string[],
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    const currentStatus = order.status as OrderStatus;

    // Validate transition is allowed (throws 400 if not)
    const validatedStatus = this.validateStatusChange(
      currentStatus,
      nextStatus,
    );

    // Check user has permission for this transition (throws 403 if not)
    this.checkTransitionPermission(currentStatus, validatedStatus, userPermissions);

    // Phase 12.7: Block completion if any hours are PENDING or REJECTED
    if (validatedStatus === OrderStatus.COMPLETED) {
      const pendingHours = await this.prisma.hoursEntry.findFirst({
        where: {
          orderId: orderId,
          approvalStatus: 'PENDING',
        },
        select: { id: true },
      });

      if (pendingHours) {
        throw new BadRequestException('Cannot complete order: hours are pending approval');
      }

      const rejectedHours = await this.prisma.hoursEntry.findFirst({
        where: {
          orderId: orderId,
          approvalStatus: 'REJECTED',
        },
        select: { id: true },
      });

      if (rejectedHours) {
        throw new BadRequestException('Cannot complete order: rejected hours must be resolved');
      }

      // Phase 13: Require invoice exists before completing order
      const invoice = await this.prisma.invoice.findFirst({
        where: { orderId },
        select: { id: true },
      });

      if (!invoice) {
        throw new BadRequestException('Cannot complete order: invoice does not exist');
      }
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: validatedStatus as unknown as $Enums.OrderStatus,
      },
      select: {
        id: true,
        status: true,
        customerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Real create flow
   * - Forces status = DRAFT (business rule)
   * - Validates customer exists
   */
  
  async createOrder(dto: CreateOrderDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
      select: { id: true },
    });

    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    // 1) Create the Order header (canonical)
    const order = await this.prisma.order.create({
      data: {
        customerId: dto.customerId,
        status: 'DRAFT',
        ...(dto.sdPayDeltaRate !== undefined ? { sdPayDeltaRate: dto.sdPayDeltaRate } : {}),
        ...(dto.sdBillDeltaRate !== undefined ? { sdBillDeltaRate: dto.sdBillDeltaRate } : {}),
      },
      select: {
        id: true,
        status: true,
        customerId: true,
        sdPayDeltaRate: true,
        sdBillDeltaRate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 2) Persist trade requirements (snapshot rates live here)
    if (dto.tradeRequirements && dto.tradeRequirements.length > 0) {
            await this.prisma.$transaction(async (tx) => {
        for (const tr of dto.tradeRequirements ?? []) {
          await tx.orderTradeRequirement.create({
            data: {
              orderId: order.id,
              tradeId: tr.tradeId,
              priority: tr.priority,
              enforcement: tr.enforcement,
              notes: tr.notes ?? null,
              basePayRate: tr.basePayRate ? new Prisma.Decimal(tr.basePayRate) : null,
              baseBillRate: tr.baseBillRate ? new Prisma.Decimal(tr.baseBillRate) : null,
            },
          });
        }
      });

    }

    return order;
  }
   /**
   * Get single order (read)
   */
  async findOrderById(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        customerId: true,
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        tradeRequirements: {
          select: {
            id: true,
            orderId: true,
            tradeId: true,
            priority: true,
            enforcement: true,
            notes: true,
            basePayRate: true,
            baseBillRate: true,
          },
        },

        // CUST-REL-01: Include primary customer contact
        primaryCustomerContactId: true,
        primaryCustomerContact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            officePhone: true,
            cellPhone: true,
          },
        },
        // SD delta rates
        sdPayDeltaRate: true,
        sdBillDeltaRate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    return order;
  }

  /**
   * Non-status update
   * - Status must be changed only via PATCH /orders/:id/status
   */
  async updateOrder(orderId: string, dto: UpdateOrderDto) {
    const existing = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });

    if (!existing) {
      throw new BadRequestException('Order not found');
    }

    if (dto.customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: dto.customerId },
        select: { id: true },
      });

      if (!customer) {
        throw new BadRequestException('Customer not found');
      }
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        ...(dto.customerId ? { customerId: dto.customerId } : {}),
        ...(dto.sdPayDeltaRate !== undefined ? { sdPayDeltaRate: dto.sdPayDeltaRate } : {}),
        ...(dto.sdBillDeltaRate !== undefined ? { sdBillDeltaRate: dto.sdBillDeltaRate } : {}),
      },
      select: {
        id: true,
        status: true,
        customerId: true,
        sdPayDeltaRate: true,
        sdBillDeltaRate: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Real read-only list
   */
  async listOrders() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        customerId: true,
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        // CUST-REL-01: Include primary customer contact
        primaryCustomerContactId: true,
        primaryCustomerContact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * CUST-REL-01: Assign primary customer contact to job order
   * Dropdown populated from that customer's ACTIVE contacts
   * Unfiltered by role (PM, Owner, Executive allowed)
   */
  async assignPrimaryCustomerContact(orderId: string, contactId: string | null) {
    // Validate order exists and get customerId
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, customerId: true },
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    // Validate contact exists and belongs to the same customer (if provided)
    if (contactId !== null) {
      const contact = await this.prisma.customerContact.findUnique({
        where: { id: contactId },
        select: { id: true, customerId: true, isActive: true },
      });

      if (!contact) {
        throw new BadRequestException('Customer contact not found');
      }

      if (contact.customerId !== order.customerId) {
        throw new BadRequestException('Contact does not belong to this order\'s customer');
      }

      if (!contact.isActive) {
        throw new BadRequestException('Cannot assign inactive contact as primary');
      }
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { primaryCustomerContactId: contactId },
      select: {
        id: true,
        status: true,
        customerId: true,
        primaryCustomerContactId: true,
        primaryCustomerContact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            officePhone: true,
            cellPhone: true,
          },
        },
        updatedAt: true,
      },
    });
  }
}
