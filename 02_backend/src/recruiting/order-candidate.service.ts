import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrderCandidateService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a candidate for an order.
   * Enforces unique(orderId, employeeId) constraint.
   */
  async createCandidate(orderId: string, employeeId: string) {
    // Validate Order exists
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Validate Employee exists
    const employee = await this.prisma.user.findUnique({
      where: { id: employeeId },
      select: { id: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    // Check for existing candidate (unique constraint)
    const existing = await this.prisma.orderCandidate.findUnique({
      where: {
        orderId_employeeId: { orderId, employeeId },
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        'Candidate already exists for this order and employee',
      );
    }

    return this.prisma.orderCandidate.create({
      data: {
        orderId,
        employeeId,
        status: 'IDENTIFIED',
      },
    });
  }

  /**
   * When an Assignment is DISPATCHED for (employeeId, orderId=A),
   * all other OrderCandidates for that employee on OTHER orders
   * must be set to WITHDRAWN_PLACED_ELSEWHERE.
   * Also updates any associated vettings to REJECTED.
   */
  async withdrawPlacedElsewhere(employeeId: string, dispatchedOrderId: string) {
    return this.prisma.$transaction(async (tx) => {
      // Find all OrderCandidates for this employee on OTHER orders
      // that are still in IDENTIFIED status
      const candidatesToWithdraw = await tx.orderCandidate.findMany({
        where: {
          employeeId,
          orderId: { not: dispatchedOrderId },
          status: 'IDENTIFIED',
        },
        select: { id: true },
      });

      if (candidatesToWithdraw.length === 0) {
        return { withdrawnCount: 0 };
      }

      const candidateIds = candidatesToWithdraw.map((c) => c.id);

      // Update all matching OrderCandidates to WITHDRAWN_PLACED_ELSEWHERE
      const updatedCandidates = await tx.orderCandidate.updateMany({
        where: {
          id: { in: candidateIds },
        },
        data: {
          status: 'WITHDRAWN_PLACED_ELSEWHERE',
          updatedAt: new Date(),
        },
      });

      // Update any active vettings (VETTING or VETTING_HOLD) for these candidates to REJECTED
      await tx.orderVetting.updateMany({
        where: {
          orderCandidateId: { in: candidateIds },
          status: { in: ['VETTING', 'VETTING_HOLD'] },
        },
        data: {
          status: 'REJECTED',
          notes: 'Auto-rejected: candidate placed elsewhere',
          updatedAt: new Date(),
        },
      });

      return { withdrawnCount: updatedCandidates.count };
    });
  }
}

