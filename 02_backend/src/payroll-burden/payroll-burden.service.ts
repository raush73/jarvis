import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePayrollBurdenRateDto } from './dto/create-payroll-burden-rate.dto';
import { UpdatePayrollBurdenRateDto } from './dto/update-payroll-burden-rate.dto';

type BurdenCategory =
  | 'WC'
  | 'GL'
  | 'FICA'
  | 'SUTA'
  | 'FUTA'
  | 'PEO'
  | 'OVERHEAD'
  | 'INT_W'
  | 'INT_PD'
  | 'ADMIN'
  | 'BANK';

export type ResolvedBurdenMap = Record<BurdenCategory, number>;

@Injectable()
export class PayrollBurdenService {
  constructor(private readonly prisma: PrismaService) {}

  // -----------------------------
  // READ (existing)
  // -----------------------------
  async resolveBurdenRates(args: {
    workerId?: string | null;
    locationId?: string | null;
    stateCode?: string | null;
    effectiveAt?: Date;
  }): Promise<ResolvedBurdenMap> {
    const effectiveAt = args.effectiveAt ?? new Date();

    const categories: BurdenCategory[] = [
      'WC',
      'GL',
      'FICA',
      'SUTA',
      'FUTA',
      'PEO',
      'OVERHEAD',
      'INT_W',
      'INT_PD',
      'ADMIN',
      'BANK',
    ];

    const resolved: Partial<ResolvedBurdenMap> = {};

    for (const category of categories) {
      const rate = await this.resolveOneCategory({
        category,
        workerId: args.workerId ?? null,
        locationId: args.locationId ?? null,
        stateCode: args.stateCode ?? null,
        effectiveAt,
      });

      resolved[category] = rate ?? 0;
    }

    return resolved as ResolvedBurdenMap;
  }

  private async resolveOneCategory(args: {
    category: BurdenCategory;
    workerId: string | null;
    locationId: string | null;
    stateCode: string | null;
    effectiveAt: Date;
  }): Promise<number | null> {
    const { category, workerId, locationId, stateCode, effectiveAt } = args;

    // WORKER
    if (workerId) {
      const r = await this.prisma.payrollBurdenRate.findFirst({
        where: {
          category: category as any,
          level: 'WORKER' as any,
          workerId,
          effectiveDate: { lte: effectiveAt },
        },
        orderBy: { effectiveDate: 'desc' },
        select: { ratePercent: true },
      });
      if (r) return r.ratePercent;
    }

    // SITE (Location)
    if (locationId) {
      const r = await this.prisma.payrollBurdenRate.findFirst({
        where: {
          category: category as any,
          level: 'SITE' as any,
          locationId,
          effectiveDate: { lte: effectiveAt },
        },
        orderBy: { effectiveDate: 'desc' },
        select: { ratePercent: true },
      });
      if (r) return r.ratePercent;
    }

    // STATE
    if (stateCode) {
      const r = await this.prisma.payrollBurdenRate.findFirst({
        where: {
          category: category as any,
          level: 'STATE' as any,
          stateCode,
          effectiveDate: { lte: effectiveAt },
        },
        orderBy: { effectiveDate: 'desc' },
        select: { ratePercent: true },
      });
      if (r) return r.ratePercent;
    }

    // GLOBAL
    const r = await this.prisma.payrollBurdenRate.findFirst({
      where: {
        category: category as any,
        level: 'GLOBAL' as any,
        effectiveDate: { lte: effectiveAt },
      },
      orderBy: { effectiveDate: 'desc' },
      select: { ratePercent: true },
    });

    if (r) return r.ratePercent;
    return null;
  }

  // -----------------------------
  // ADMIN CRUD + AUDIT (Phase 27B)
  // -----------------------------

  async listRates(filters: {
    level: string | null;
    category: string | null;
    workerId: string | null;
    locationId: string | null;
    stateCode: string | null;
  }) {
    return this.prisma.payrollBurdenRate.findMany({
      where: {
        level: (filters.level as any) ?? undefined,
        category: (filters.category as any) ?? undefined,
        workerId: filters.workerId ?? undefined,
        locationId: filters.locationId ?? undefined,
        stateCode: filters.stateCode ?? undefined,
      },
      orderBy: [{ effectiveDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async listAudits(args: { id: string }) {
    return this.prisma.payrollBurdenRateAudit.findMany({
      where: { burdenRateId: args.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRate(args: { dto: CreatePayrollBurdenRateDto; userId: string | null }) {
    const { dto } = args;
    const userId = args.userId ?? null;
    if (!userId) throw new BadRequestException('Missing user id');

    const effectiveDate = this.parseIsoDate(dto.effectiveDate, 'effectiveDate');

    this.assertFinitePositive(dto.ratePercent, 'ratePercent');
    this.assertLevelKeys(dto);

    const created = await this.prisma.payrollBurdenRate.create({
      data: {
        level: dto.level as any,
        category: dto.category as any,
        effectiveDate,
        ratePercent: dto.ratePercent,
        workerId: dto.workerId ?? null,
        locationId: dto.locationId ?? null,
        stateCode: dto.stateCode ?? null,
        createdByUserId: userId,
        updatedByUserId: userId,
      },
    });

    await this.prisma.payrollBurdenRateAudit.create({
      data: {
        burdenRateId: created.id,
        action: 'CREATE',
        before: Prisma.JsonNull,
        after: created as any,
        createdByUserId: userId,
      },
    });

    return created;
  }

  async updateRate(args: { id: string; dto: UpdatePayrollBurdenRateDto; userId: string | null }) {
    const userId = args.userId ?? null;
    if (!userId) throw new BadRequestException('Missing user id');

    const existing = await this.prisma.payrollBurdenRate.findUnique({
      where: { id: args.id },
    });
    if (!existing) throw new NotFoundException('PayrollBurdenRate not found');

    const data: any = { updatedByUserId: userId };

    if (args.dto.ratePercent !== undefined) {
      this.assertFinitePositive(args.dto.ratePercent, 'ratePercent');
      data.ratePercent = args.dto.ratePercent;
    }

    if (args.dto.effectiveDate !== undefined) {
      data.effectiveDate = this.parseIsoDate(args.dto.effectiveDate, 'effectiveDate');
    }

    if (Object.keys(data).length === 1) {
      throw new BadRequestException('No fields to update');
    }

    const updated = await this.prisma.payrollBurdenRate.update({
      where: { id: args.id },
      data,
    });

    await this.prisma.payrollBurdenRateAudit.create({
      data: {
        burdenRateId: updated.id,
        action: 'UPDATE',
        before: existing as any,
        after: updated as any,
        createdByUserId: userId,
      },
    });

    return updated;
  }

  async deleteRate(args: { id: string; userId: string | null }) {
    const userId = args.userId ?? null;
    if (!userId) throw new BadRequestException('Missing user id');

    const existing = await this.prisma.payrollBurdenRate.findUnique({
      where: { id: args.id },
    });
    if (!existing) throw new NotFoundException('PayrollBurdenRate not found');

    await this.prisma.payrollBurdenRateAudit.create({
      data: {
        burdenRateId: existing.id,
        action: 'DELETE',
        before: existing as any,
        after: Prisma.JsonNull,
        createdByUserId: userId,
      },
    });

    await this.prisma.payrollBurdenRate.delete({ where: { id: args.id } });

    return { ok: true, id: args.id };
  }

  // -----------------------------
  // helpers
  // -----------------------------

  private parseIsoDate(value: string, field: string): Date {
    if (!value || typeof value !== 'string') throw new BadRequestException(`${field} is required`);
    const d = new Date(value);
    if (isNaN(d.getTime())) throw new BadRequestException(`${field} must be a valid ISO date string`);
    return d;
  }

  private assertFinitePositive(value: any, field: string) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      throw new BadRequestException(`${field} must be a positive number`);
    }
  }

  private assertLevelKeys(dto: CreatePayrollBurdenRateDto) {
    const level = dto.level;

    const hasWorker = !!dto.workerId;
    const hasLoc = !!dto.locationId;
    const hasState = !!dto.stateCode;

    if (level === 'WORKER') {
      if (!hasWorker) throw new BadRequestException('workerId is required for WORKER');
      if (hasLoc || hasState) throw new BadRequestException('Only workerId allowed for WORKER');
      return;
    }

    if (level === 'SITE') {
      if (!hasLoc) throw new BadRequestException('locationId is required for SITE');
      if (hasWorker || hasState) throw new BadRequestException('Only locationId allowed for SITE');
      return;
    }

    if (level === 'STATE') {
      if (!hasState) throw new BadRequestException('stateCode is required for STATE');
      if (hasWorker || hasLoc) throw new BadRequestException('Only stateCode allowed for STATE');
      return;
    }

    if (level === 'GLOBAL') {
      if (hasWorker || hasLoc || hasState) throw new BadRequestException('No key fields allowed for GLOBAL');
      return;
    }

    throw new BadRequestException(`Invalid level: ${level}`);
  }

  // -----------------------------
  // SYSTEM user bootstrap + GLOBAL burden rate seeding (Phase D.2)
  // -----------------------------

  /**
   * Bootstrap SYSTEM user (non-login, audit ownership) and seed GLOBAL burden rates.
   * Idempotent: safe to call multiple times.
   */
  async bootstrapSystemUserAndSeedRates(): Promise<{
    systemUserId: string;
    userCreated: boolean;
    inserted: string[];
    skipped: string[];
  }> {
    const SYSTEM_EMAIL = 'system@jarvis.local';

    // 1. Check for existing SYSTEM user
    let systemUser = await this.prisma.user.findUnique({
      where: { email: SYSTEM_EMAIL },
    });

    let userCreated = false;

    if (!systemUser) {
      // Create SYSTEM user with non-loginable password (empty hash = cannot match any input)
      systemUser = await this.prisma.user.create({
        data: {
          email: SYSTEM_EMAIL,
          fullName: 'SYSTEM',
          hashedPassword: '', // Non-loginable: empty hash never matches bcrypt compare
          isActive: false, // Hidden from normal listings
        },
      });
      userCreated = true;
    }

    // 2. Seed GLOBAL burden rates using SYSTEM user
    const { inserted, skipped } = await this.seedGlobalBurdenRates(systemUser.id);

    return {
      systemUserId: systemUser.id,
      userCreated,
      inserted,
      skipped,
    };
  }

  async seedGlobalBurdenRates(userId: string): Promise<{ inserted: string[]; skipped: string[] }> {
    const globalRates: { category: BurdenCategory; ratePercent: number }[] = [
      { category: 'FICA', ratePercent: 7.65 },
      { category: 'FUTA', ratePercent: 0.6 },
      { category: 'ADMIN', ratePercent: 2.5 },
      { category: 'GL', ratePercent: 1.5 },
      { category: 'BANK', ratePercent: 0.75 },
    ];

    const inserted: string[] = [];
    const skipped: string[] = [];
    const effectiveDate = new Date();

    for (const { category, ratePercent } of globalRates) {
      const existing = await this.prisma.payrollBurdenRate.findFirst({
        where: {
          category: category as any,
          level: 'GLOBAL' as any,
          ratePercent,
        },
      });

      if (existing) {
        skipped.push(category);
        continue;
      }

      await this.prisma.payrollBurdenRate.create({
        data: {
          category: category as any,
          level: 'GLOBAL' as any,
          ratePercent,
          effectiveDate,
          createdByUserId: userId,
          updatedByUserId: userId,
        },
      });

      inserted.push(category);
    }

    return { inserted, skipped };
  }
}
