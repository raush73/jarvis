import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoiceAdjustmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a DRAFT invoice adjustment (applies to ISSUED invoices only)
   */
  async create(input: {
    invoiceId: string;
    type: 'CREDIT' | 'DEBIT';
    amountCents: number;
    reason?: string;
  }) {
    // Validate invoice exists and is ISSUED
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: input.invoiceId },
      select: { id: true, status: true, invoiceNumber: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status !== 'ISSUED') {
      throw new BadRequestException('Adjustments can only be created for ISSUED invoices');
    }

    return this.prisma.invoiceAdjustment.create({
      data: {
        invoiceId: input.invoiceId,
        type: input.type,
        amountCents: input.amountCents,
        reason: input.reason,
        status: 'DRAFT',
      },
    });
  }

  /**
   * Update a DRAFT invoice adjustment
   */
  async update(
    id: string,
    input: {
      type?: 'CREDIT' | 'DEBIT';
      amountCents?: number;
      reason?: string;
    },
  ) {
    const adjustment = await this.prisma.invoiceAdjustment.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!adjustment) {
      throw new NotFoundException('Invoice adjustment not found');
    }

    if (adjustment.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT adjustments can be updated');
    }

    const updateData: any = {};
    if (input.type !== undefined) updateData.type = input.type;
    if (input.amountCents !== undefined) updateData.amountCents = input.amountCents;
    if (input.reason !== undefined) updateData.reason = input.reason;

    return this.prisma.invoiceAdjustment.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Issue an invoice adjustment (atomic: assign number, snapshot, set issuedAt)
   */
  async issue(id: string, issuedByUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      const adjustment = await tx.invoiceAdjustment.findUnique({
        where: { id },
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              status: true,
              customerId: true,
            },
          },
        },
      });

      if (!adjustment) {
        throw new NotFoundException('Invoice adjustment not found');
      }

      if (adjustment.status !== 'DRAFT') {
        throw new BadRequestException('Only DRAFT adjustments can be issued');
      }

      if (adjustment.adjustmentNumber) {
        throw new BadRequestException('Adjustment has already been issued');
      }

      // Re-validate invoice is still ISSUED
      if (adjustment.invoice.status !== 'ISSUED') {
        throw new BadRequestException('Parent invoice is no longer ISSUED');
      }

      // Allocate consecutive adjustment number via InvoiceSequence (prefix ADJ-)
      const sequenceKey = 'ADJ-';
      const existingSeq = await tx.invoiceSequence.findUnique({
        where: { key: sequenceKey },
      });

      let numberValue: number;
      if (!existingSeq) {
        await tx.invoiceSequence.create({
          data: { key: sequenceKey, nextNumber: 2 },
        });
        numberValue = 1;
      } else {
        numberValue = existingSeq.nextNumber;
        await tx.invoiceSequence.update({
          where: { key: sequenceKey },
          data: { nextNumber: numberValue + 1 },
        });
      }

      const adjustmentNumber = `ADJ-${String(numberValue).padStart(6, '0')}`;

      const issuedAt = new Date();
      const issuedSnapshotJson = {
        snapshotVersion: 1,
        adjustmentId: adjustment.id,
        adjustmentNumber,
        issuedAt: issuedAt.toISOString(),
        issuedByUserId,
        type: adjustment.type,
        amountCents: adjustment.amountCents,
        reason: adjustment.reason,
        invoice: {
          id: adjustment.invoice.id,
          invoiceNumber: adjustment.invoice.invoiceNumber,
          customerId: adjustment.invoice.customerId,
        },
      };

      return tx.invoiceAdjustment.update({
        where: { id },
        data: {
          status: 'ISSUED',
          adjustmentNumber,
          issuedAt,
          issuedByUserId,
          issuedSnapshotJson,
        },
      });
    });
  }

  /**
   * Get a single invoice adjustment by ID
   */
  async findOne(id: string) {
    const adjustment = await this.prisma.invoiceAdjustment.findUnique({
      where: { id },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            customerId: true,
          },
        },
        issuedBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    if (!adjustment) {
      throw new NotFoundException('Invoice adjustment not found');
    }

    return adjustment;
  }
}

