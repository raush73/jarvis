// PHASE 12.2 — Assignments Service
// LOCKED SCOPE: operations only (no hours, no billing, no payroll, no accounting)

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { OrderCandidateService } from '../recruiting/order-candidate.service';

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderCandidateService: OrderCandidateService,
  ) {}

  async create(dto: CreateAssignmentDto) {
    // Validate Order exists
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      select: { id: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Validate User exists
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');

    // PHASE 12.4.2: Block creation if ACTIVE assignment exists for same (orderId, userId)
    const activeAssignment = await this.prisma.assignment.findFirst({
      where: {
        orderId: dto.orderId,
        userId: dto.userId,
        endDate: null, // ACTIVE = endDate IS NULL
      },
      select: { id: true },
    });
    if (activeAssignment) {
      throw new BadRequestException('An active assignment already exists for this order and user');
    }

    // Create Assignment (no side effects)
    return this.prisma.assignment.create({
      data: {
        orderId: dto.orderId,
        userId: dto.userId,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
  }

  async close(id: string) {
    // Validate Assignment exists and get orderId/userId
    const existing = await this.prisma.assignment.findUnique({
      where: { id },
      select: { id: true, orderId: true, userId: true, endDate: true },
    });
    if (!existing) throw new NotFoundException('Assignment not found');

    // PHASE 12.4.2: Block if assignment is already closed (CLOSED = endDate IS NOT NULL)
    if (existing.endDate !== null) {
      throw new BadRequestException('Assignment is already closed');
    }

    // PHASE 12.4.2: Block if there are PENDING OFFICIAL HoursEntry records for same orderId + workerId
    const pendingHours = await this.prisma.hoursEntry.findFirst({
      where: {
        orderId: existing.orderId,
        workerId: existing.userId,
        type: 'OFFICIAL',
        approvalStatus: 'PENDING',
      },
      select: { id: true },
    });
    if (pendingHours) {
      throw new BadRequestException('Cannot close assignment: there are pending official hours entries for this order and worker');
    }

    // Close assignment by setting endDate (no side effects)
    return this.prisma.assignment.update({
      where: { id },
      data: { endDate: new Date() },
    });
  }

  async updateAssignmentStatus(
    assignmentId: string,
    status: 'DISPATCHED' | 'ON_ASSIGNMENT' | 'COMPLETED',
  ) {
    // 1) Validate Assignment exists and get current status
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { id: true, status: true, userId: true, orderId: true },
    });
  
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
  
    const currentStatus = assignment.status ?? null;
  
    // 2) Enforce allowed status transitions
    const allowedTransitions: Record<
      string | 'null',
      Array<'DISPATCHED' | 'ON_ASSIGNMENT' | 'COMPLETED'>
    > = {
      null: ['DISPATCHED'],
      DISPATCHED: ['ON_ASSIGNMENT'],
      ON_ASSIGNMENT: ['COMPLETED'],
      COMPLETED: [],
    };
  
    const allowedNextStatuses =
      allowedTransitions[currentStatus === null ? 'null' : currentStatus] || [];
  
    if (!allowedNextStatuses.includes(status)) {
      throw new BadRequestException(
        `Invalid assignment status transition from ${currentStatus ?? 'null'} to ${status}`,
      );
    }
  
    // 3) Placeholder for future consent / arrival verification
    // (intentionally always true for Jarvis 1.0 Core)
    const complianceCheckPassed = true;
    if (!complianceCheckPassed) {
      throw new BadRequestException('Dispatch compliance check failed');
    }
  
    // 4) Persist status change + timestamp
    const updated = await this.prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        status,
        statusChangedAt: new Date(),
      },
    });

    if (status === 'DISPATCHED') {
      await this.orderCandidateService.withdrawPlacedElsewhere(assignment.userId, assignment.orderId);
    }

    return updated;
  }
}
  
