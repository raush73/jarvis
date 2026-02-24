import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { OrderVettingStatus } from '@prisma/client';

export type VettingAction = 'APPROVE' | 'REJECT' | 'HOLD';

export interface UpdateVettingResult {
  success: boolean;
  vetting: {
    id: string;
    status: string;
    holdReason: string | null;
    notes: string | null;
    reviewedAt: Date | null;
  };
  auditId: string;
  message: string;
}

export interface VettingAuditRecord {
  id: string;
  orderVettingId: string;
  orderCandidateId: string;
  action: string;
  previousStatus: string;
  newStatus: string;
  reason: string | null;
  performedByUserId: string;
  createdAt: Date;
}

@Injectable()
export class Ui13VettingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Performs a controlled vetting status mutation with full audit logging.
   *
   * Enforcements:
   * - Validates orderId + employeeId exist
   * - Validates vetting record exists for the candidate
   * - Enforces lock rules: APPROVED/REJECTED statuses are immutable
   * - Requires reason for REJECT and HOLD actions
   * - Creates immutable audit entry
   *
   * @param orderId - The order ID
   * @param employeeId - The employee ID
   * @param action - APPROVE, REJECT, or HOLD
   * @param reason - Required for REJECT/HOLD; optional for APPROVE (stored as notes)
   * @param userId - The user performing the action (for audit)
   * @returns UpdateVettingResult with updated vetting and audit record ID
   */
  async updateVettingStatus(
    orderId: string,
    employeeId: string,
    action: VettingAction,
    reason: string | undefined,
    userId: string,
  ): Promise<UpdateVettingResult> {
    // Validate action requires reason
    if ((action === 'REJECT' || action === 'HOLD') && !reason) {
      throw new BadRequestException(
        `Reason is required for ${action} action`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Fetch candidate
      const candidate = await tx.orderCandidate.findFirst({
        where: { orderId, employeeId },
        select: { id: true },
      });

      if (!candidate) {
        throw new NotFoundException('Candidate not found for this order');
      }

      // Fetch vetting record
      const vetting = await tx.orderVetting.findFirst({
        where: { orderCandidateId: candidate.id },
        select: {
          id: true,
          status: true,
          holdReason: true,
          notes: true,
          reviewedAt: true,
        },
      });

      if (!vetting) {
        throw new NotFoundException('Vetting record not found for this candidate');
      }

      const previousStatus = vetting.status;

      // Determine target status
      const statusMap: Record<VettingAction, OrderVettingStatus> = {
        APPROVE: 'APPROVED',
        REJECT: 'REJECTED',
        HOLD: 'VETTING_HOLD',
      };
      const targetStatus: OrderVettingStatus = statusMap[action];

      // Idempotent no-op check: if already in target status, return success without mutation
      if (previousStatus === targetStatus) {
        // Still create an audit entry for the attempt (shows intent)
        const audit = await tx.orderVettingAudit.create({
          data: {
            orderVettingId: vetting.id,
            orderCandidateId: candidate.id,
            action,
            previousStatus,
            newStatus: targetStatus,
            reason: reason || null,
            performedByUserId: userId,
          },
        });

        return {
          success: true,
          vetting: {
            id: vetting.id,
            status: previousStatus,
            holdReason: vetting.holdReason,
            notes: vetting.notes,
            reviewedAt: vetting.reviewedAt,
          },
          auditId: audit.id,
          message: `Vetting already in ${targetStatus} status. No change made.`,
        };
      }

      // Lock check: APPROVED and REJECTED are terminal states
      if (previousStatus === 'APPROVED' || previousStatus === 'REJECTED') {
        throw new ForbiddenException(
          `Vetting is locked in ${previousStatus} status and cannot be changed`,
        );
      }

      // Build update payload
      const updateData: {
        status: OrderVettingStatus;
        reviewedAt: Date;
        holdReason?: string | null;
        notes?: string | null;
      } = {
        status: targetStatus,
        reviewedAt: new Date(),
      };

      if (action === 'APPROVE') {
        // Clear holdReason on approve, optionally set notes
        updateData.holdReason = null;
        if (reason) {
          updateData.notes = reason;
        }
      } else if (action === 'REJECT') {
        updateData.holdReason = reason!;
      } else if (action === 'HOLD') {
        updateData.holdReason = reason!;
      }

      // Perform the update
      const updatedVetting = await tx.orderVetting.update({
        where: { id: vetting.id },
        data: updateData,
        select: {
          id: true,
          status: true,
          holdReason: true,
          notes: true,
          reviewedAt: true,
        },
      });

      // Create immutable audit record
      const audit = await tx.orderVettingAudit.create({
        data: {
          orderVettingId: vetting.id,
          orderCandidateId: candidate.id,
          action,
          previousStatus,
          newStatus: targetStatus,
          reason: reason || null,
          performedByUserId: userId,
        },
      });

      // If rejecting, also update the candidate status
      if (action === 'REJECT') {
        await tx.orderCandidate.update({
          where: { id: candidate.id },
          data: {
            status: 'WITHDRAWN_REJECTED',
            updatedAt: new Date(),
          },
        });
      }

      return {
        success: true,
        vetting: {
          id: updatedVetting.id,
          status: updatedVetting.status,
          holdReason: updatedVetting.holdReason,
          notes: updatedVetting.notes,
          reviewedAt: updatedVetting.reviewedAt,
        },
        auditId: audit.id,
        message: `Vetting status changed from ${previousStatus} to ${targetStatus}`,
      };
    });
  }

  /**
   * Retrieves the audit history for a vetting record.
   *
   * @param orderVettingId - The vetting record ID
   * @returns Array of audit records, newest first
   */
  async getAuditHistory(orderVettingId: string): Promise<VettingAuditRecord[]> {
    const audits = await this.prisma.orderVettingAudit.findMany({
      where: { orderVettingId },
      orderBy: { createdAt: 'desc' },
    });

    return audits;
  }

  /**
   * Retrieves audit history by candidate (orderId + employeeId).
   *
   * @param orderId - The order ID
   * @param employeeId - The employee ID
   * @returns Array of audit records, newest first
   */
  async getAuditHistoryByCandidate(
    orderId: string,
    employeeId: string,
  ): Promise<VettingAuditRecord[]> {
    const candidate = await this.prisma.orderCandidate.findFirst({
      where: { orderId, employeeId },
      select: { id: true },
    });

    if (!candidate) {
      return [];
    }

    const audits = await this.prisma.orderVettingAudit.findMany({
      where: { orderCandidateId: candidate.id },
      orderBy: { createdAt: 'desc' },
    });

    return audits;
  }
}
