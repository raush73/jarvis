import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { PrismaService } from '../prisma/prisma.service';
  import { HoursApprovalDecision } from './dto/customer-approve-hours.dto';
  
  @Injectable()
  export class CustomerPortalService {
    constructor(private readonly prisma: PrismaService) {}
  
    private async getCustomerIdForUser(userId: string): Promise<string> {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { customerId: true },
      });
  
      if (!user?.customerId) {
        throw new ForbiddenException('Customer scope not configured for this user');
      }
  
      return user.customerId;
    }
  
    async approveHoursEntry(params: {
      userId: string;
      hoursEntryId: string;
      decision: HoursApprovalDecision;
      rejectionReason?: string;
    }) {
      const { userId, hoursEntryId, decision, rejectionReason } = params;
  
      const customerId = await this.getCustomerIdForUser(userId);
  
      const hoursEntry = await this.prisma.hoursEntry.findUnique({
        where: { id: hoursEntryId },
        select: {
          id: true,
          orderId: true,
          approvalStatus: true,
          type: true,
          periodStart: true,
          periodEnd: true,
          totalHours: true,
          enteredBy: true,
        },
      });
  
      if (!hoursEntry) {
        throw new NotFoundException('Hours entry not found');
      }
  
      // 🔒 Transition enforcement (LOCKED)
      if (hoursEntry.type !== 'OFFICIAL') {
        throw new BadRequestException('Only OFFICIAL hours entries can be approved');
      }
  
      if (hoursEntry.approvalStatus !== 'PENDING') {
        throw new BadRequestException('Only PENDING hours entries can be approved');
      }
  
      const order = await this.prisma.order.findUnique({
        where: { id: hoursEntry.orderId },
        select: { customerId: true },
      });
  
      if (!order) {
        throw new NotFoundException('Order not found');
      }
  
      if (order.customerId !== customerId) {
        throw new ForbiddenException('Access denied to this hours entry');
      }

      // Phase 12.5: Require rejection reason when rejecting
      if (decision === HoursApprovalDecision.REJECTED && !rejectionReason) {
        throw new BadRequestException('Rejection reason is required when rejecting hours');
      }

      const updated = await this.prisma.hoursEntry.update({
        where: { id: hoursEntryId },
        data: {
          approvalStatus: decision,
          ...(decision === HoursApprovalDecision.REJECTED ? { rejectionReason } : { rejectionReason: null }),
        },
        select: {
          id: true,
          orderId: true,
          periodStart: true,
          periodEnd: true,
          totalHours: true,
          approvalStatus: true,
          type: true,
          enteredBy: true,
        },
      });
  
      return updated;
    }
  }
  