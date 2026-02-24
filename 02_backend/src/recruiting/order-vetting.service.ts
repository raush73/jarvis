import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrderVettingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Starts vetting for an OrderCandidate.
   * Only candidates with status IDENTIFIED can be vetted.
   */
  async startVetting(orderCandidateId: string) {
    const candidate = await this.prisma.orderCandidate.findUnique({
      where: { id: orderCandidateId },
      select: { id: true, status: true },
    });

    if (!candidate) {
      throw new NotFoundException('OrderCandidate not found');
    }

    if (candidate.status !== 'IDENTIFIED') {
      throw new BadRequestException(
        `Cannot start vetting: candidate status is ${candidate.status}, expected IDENTIFIED`,
      );
    }

    return this.prisma.orderVetting.create({
      data: {
        orderCandidateId,
        status: 'VETTING',
      },
    });
  }

  /**
   * Places vetting on hold (for certs/badging/customer vetting).
   * Only vettings with status VETTING can be placed on hold.
   */
  async hold(orderVettingId: string, reason: string) {
    const vetting = await this.prisma.orderVetting.findUnique({
      where: { id: orderVettingId },
      select: { id: true, status: true },
    });

    if (!vetting) {
      throw new NotFoundException('OrderVetting not found');
    }

    if (vetting.status !== 'VETTING') {
      throw new BadRequestException(
        `Cannot hold: vetting status is ${vetting.status}, expected VETTING`,
      );
    }

    return this.prisma.orderVetting.update({
      where: { id: orderVettingId },
      data: {
        status: 'VETTING_HOLD',
        holdReason: reason,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Approves vetting after recruiter confirmation.
   * Only vettings with status VETTING or VETTING_HOLD can be approved.
   */
  async approve(orderVettingId: string, reviewerUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      const vetting = await tx.orderVetting.findUnique({
        where: { id: orderVettingId },
        select: { id: true, status: true },
      });

      if (!vetting) {
        throw new NotFoundException('OrderVetting not found');
      }

      if (vetting.status !== 'VETTING' && vetting.status !== 'VETTING_HOLD') {
        throw new BadRequestException(
          `Cannot approve: vetting status is ${vetting.status}, expected VETTING or VETTING_HOLD`,
        );
      }

      // Validate reviewer exists
      const reviewer = await tx.user.findUnique({
        where: { id: reviewerUserId },
        select: { id: true },
      });
      if (!reviewer) {
        throw new NotFoundException('Reviewer user not found');
      }

      return tx.orderVetting.update({
        where: { id: orderVettingId },
        data: {
          status: 'APPROVED',
          reviewedByEmployeeId: reviewerUserId,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    });
  }

  /**
   * Rejects vetting with a reason.
   * Only vettings with status VETTING or VETTING_HOLD can be rejected.
   */
  async reject(orderVettingId: string, reviewerUserId: string, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const vetting = await tx.orderVetting.findUnique({
        where: { id: orderVettingId },
        select: { id: true, status: true, orderCandidateId: true },
      });

      if (!vetting) {
        throw new NotFoundException('OrderVetting not found');
      }

      if (vetting.status !== 'VETTING' && vetting.status !== 'VETTING_HOLD') {
        throw new BadRequestException(
          `Cannot reject: vetting status is ${vetting.status}, expected VETTING or VETTING_HOLD`,
        );
      }

      // Validate reviewer exists
      const reviewer = await tx.user.findUnique({
        where: { id: reviewerUserId },
        select: { id: true },
      });
      if (!reviewer) {
        throw new NotFoundException('Reviewer user not found');
      }

      // Update vetting to REJECTED
      const updatedVetting = await tx.orderVetting.update({
        where: { id: orderVettingId },
        data: {
          status: 'REJECTED',
          reviewedByEmployeeId: reviewerUserId,
          reviewedAt: new Date(),
          notes: reason,
          updatedAt: new Date(),
        },
      });

      // Update candidate status to WITHDRAWN_REJECTED
      await tx.orderCandidate.update({
        where: { id: vetting.orderCandidateId },
        data: {
          status: 'WITHDRAWN_REJECTED',
          updatedAt: new Date(),
        },
      });

      return updatedVetting;
    });
  }
}

