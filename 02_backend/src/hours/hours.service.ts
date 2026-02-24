import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOfficialHoursCustomerDto } from './dto/create-official-hours-customer.dto';
import { CreateOfficialHoursMw4hDto } from './dto/create-official-hours-mw4h.dto';
import { CreateReferenceHoursEmployeeDto } from './dto/create-reference-hours-employee.dto';
import { PERMISSIONS } from '../auth/permissions.constants';
import { assertHasPermissions } from '../auth/permission.assert';
import { PayrollEarningCode, HoursEntryUnit } from '@prisma/client';


@Injectable()
export class HoursService {
  constructor(private readonly prisma: PrismaService) {}

  createOfficialHoursCustomer(dto: CreateOfficialHoursCustomerDto) {
    return this.prisma.hoursEntry.create({
     
      data: {
        type: 'OFFICIAL',
        enteredBy: 'CUSTOMER',
        orderId: dto.orderId,
        workerId: dto.workerId,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        isOfficial: true,
        totalHours: dto.lines ? 0 : dto.totalHours ?? 0,
        approvalStatus: 'APPROVED',
        lines: dto.lines
          ? {
              create: dto.lines.map((l) => ({
                earningCode: l.earningCode as PayrollEarningCode,
                unit: l.unit as HoursEntryUnit,
                quantity: l.quantity,
                rate: l.rate ?? null,
                amount: l.amount ?? null,
              })),
            }
          : undefined,
      },
    });
  }


  createOfficialHoursMw4h(dto: CreateOfficialHoursMw4hDto) {
    return this.prisma.hoursEntry.create({
      data: {
        type: 'OFFICIAL',
        enteredBy: 'MW4H',
        orderId: dto.orderId,
        workerId: dto.workerId,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        isOfficial: true,
        totalHours: dto.lines ? 0 : dto.totalHours ?? 0,
        approvalStatus: 'APPROVED',
        lines: dto.lines
          ? {
              create: dto.lines.map((l) => ({
                earningCode: l.earningCode as PayrollEarningCode,
                unit: l.unit as HoursEntryUnit,
                quantity: l.quantity,
                rate: l.rate ?? null,
                amount: l.amount ?? null,
              })),
            }
          : undefined,
      },
    });
  }


  createReferenceHoursEmployee(dto: CreateReferenceHoursEmployeeDto) {
  const hasLines = Array.isArray(dto.lines) && dto.lines.length > 0;
  const hasTotalHours = typeof dto.totalHours === 'number';

  if (!hasLines && !hasTotalHours) {
    throw new BadRequestException('Reference hours requires either totalHours or lines[]');
  }

  return this.prisma.hoursEntry.create({
    data: {
      type: 'REFERENCE',
      enteredBy: 'EMPLOYEE',
      orderId: dto.orderId,
      workerId: dto.workerId,
      periodStart: new Date(dto.periodStart),
      periodEnd: new Date(dto.periodEnd),
      isOfficial: false,
      totalHours: hasLines ? 0 : (dto.totalHours as number),
      approvalStatus: 'PENDING',
      lines: {
        create: hasLines
          ? dto.lines!.map((l) => ({
              earningCode: l.earningCode as PayrollEarningCode,
              unit: l.unit as HoursEntryUnit,
              quantity: l.quantity,
              rate: null,
              amount: null,
            }))
          : [
              {
                earningCode: PayrollEarningCode.REG,
                unit: HoursEntryUnit.HOURS,
                quantity: dto.totalHours as number,
                rate: null,
                amount: null,
              },
            ],
      },
    },
  });
}

  async submitReferenceHours(
    candidateId: string,
    orderId: string,
    hours: number,
    startTime?: Date,
    endTime?: Date,
  ) {
    // Validate that employee cannot overwrite official hours
    const existingOfficialHours = await this.prisma.hoursEntry.findFirst({
      where: {
        orderId,
        workerId: candidateId,
        type: 'OFFICIAL',
      },
    });

    if (existingOfficialHours) {
      throw new BadRequestException(
        'Cannot submit reference hours: official hours already exist for this order and worker',
      );
    }

    // Determine periodStart and periodEnd from startTime/endTime or use current date
    const periodStart = startTime || new Date();
    const periodEnd = endTime || new Date();

    // Persist in DB, mark as reference (type = 'REFERENCE', isOfficial = false)
    return this.prisma.hoursEntry.create({
      data: {
        type: 'REFERENCE',
        enteredBy: 'EMPLOYEE',
        orderId,
        workerId: candidateId,
        periodStart,
        periodEnd,
        totalHours: hours,
        startTime: startTime || null,
        endTime: endTime || null,
        approvalStatus: 'PENDING',
        isOfficial: false,
      },
    });
  }

  findAll() {
    return this.prisma.hoursEntry.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findAllByWorker(workerId: string) {
    return this.prisma.hoursEntry.findMany({
      where: { workerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByOrder(orderId: string) {
    return this.prisma.hoursEntry.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByOrderAndWorker(orderId: string, workerId: string) {
    return this.prisma.hoursEntry.findMany({
      where: { orderId, workerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByWorker(workerId: string) {
    return this.prisma.hoursEntry.findMany({
      where: { workerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Phase 13: Assert that hours are not locked by an existing invoice
   */
  private async assertHoursNotLocked(orderId: string): Promise<void> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { orderId },
      select: { id: true },
    });

    if (invoice) {
      throw new BadRequestException('Hours are locked because invoice exists for this order.');
    }
  }

  async approve(id: string) {
    // Phase 13: Load hours entry first to get orderId, then check lock
    const hoursEntry = await this.prisma.hoursEntry.findUnique({
      where: { id },
      select: { id: true, orderId: true },
    });

    if (!hoursEntry) {
      throw new NotFoundException('Hours entry not found');
    }

    await this.assertHoursNotLocked(hoursEntry.orderId);

    return this.prisma.hoursEntry.update({
      where: { id },
      data: { approvalStatus: 'APPROVED' },
    });
  }

  async reject(id: string) {
    // Phase 13: Load hours entry first to get orderId, then check lock
    const hoursEntry = await this.prisma.hoursEntry.findUnique({
      where: { id },
      select: { id: true, orderId: true },
    });

    if (!hoursEntry) {
      throw new NotFoundException('Hours entry not found');
    }

    await this.assertHoursNotLocked(hoursEntry.orderId);

    return this.prisma.hoursEntry.update({
      where: { id },
      data: { approvalStatus: 'REJECTED' },
    });
  }

  async resolveRejectedHours(hoursEntryId: string, userPermissions: string[]) {
    // Phase 12.5: Only MW4H can resolve rejected hours
    assertHasPermissions(userPermissions, [PERMISSIONS.HOURS_RESOLVE_REJECTED]);

    const hoursEntry = await this.prisma.hoursEntry.findUnique({
      where: { id: hoursEntryId },
      select: {
        id: true,
        approvalStatus: true,
        orderId: true,
      },
    });

    if (!hoursEntry) {
      throw new NotFoundException('Hours entry not found');
    }

    // Phase 12.5: Only REJECTED hours can be resolved
    if (hoursEntry.approvalStatus !== 'REJECTED') {
      throw new BadRequestException('Only REJECTED hours entries can be resolved');
    }

    // Phase 13: Enforce hours lock
    await this.assertHoursNotLocked(hoursEntry.orderId);

    return this.prisma.hoursEntry.update({
      where: { id: hoursEntryId },
      data: {
        approvalStatus: 'PENDING',
        rejectionReason: null,
      },
    });
  }
}


