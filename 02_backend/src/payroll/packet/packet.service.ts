import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Payroll Packet v1 Generator Service
 *
 * Business Rules (LOCKED):
 * - 1 packet per week (weekStart = Monday, YYYY-MM-DD)
 * - Include ALL employees with OFFICIAL + APPROVED hours in that week
 * - LOC is the GL-insurer-approved site code stored on Order.jobLocationCode
 * - If an employee has multiple LOCs in the same week: output MULTIPLE ROWS (one row per employee + LOC)
 *
 * v1 Column Mapping:
 * - SSN: EmployeeProfile.ssn
 * - EmployeeName: User.fullName -> "Last, First" format
 * - LOC: Order.jobLocationCode
 * - RegRate: HoursEntryLine.rate (REG code) or 0
 * - RegHours: Sum HoursEntryLine.quantity (REG, HOURS)
 * - OTHours: Sum HoursEntryLine.quantity (OT, HOURS)
 * - DTHours: Sum HoursEntryLine.quantity (DT, HOURS)
 * - HolidayHours: Sum HoursEntryLine.quantity (H, HOURS)
 * - BonusAmount: Sum HoursEntryLine.quantity (BONUS, DOLLARS)
 * - ReimbAmount: Sum HoursEntryLine.quantity (REM, DOLLARS)
 * - MileageAmount: 0 (v1: not representable)
 * - PerDiemAmount: Sum HoursEntryLine.quantity (PD, DOLLARS)
 * - AdvanceDeductionAmount: PayrollDeductionElection code='ADV'
 * - ETVDeductionAmount: PayrollDeductionElection code='ETV'
 */

export type PacketLineRow = {
  ssn: string;
  employeeName: string;
  loc: string;
  regRate: number;
  regHours: number;
  otHours: number;
  dtHours: number;
  holidayHours: number;
  bonusAmount: number;
  reimbAmount: number;
  mileageAmount: number;
  perDiemAmount: number;
  advanceDeductionAmount: number;
  etvDeductionAmount: number;
  // SD hours (1:1 from approved snapshot, unit === REG_SD/OT_SD/DT_SD)
  regSdHours: number;
  otSdHours: number;
  dtSdHours: number;
};

export type GeneratePacketResult = {
  weekStart: string;
  weekEnd: string;
  rows: PacketLineRow[];
  packetId: string | null;
};

@Injectable()
export class PacketService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Parse a Monday date string (YYYY-MM-DD) and validate it's actually a Monday.
   */
  private parseAndValidateWeekStart(weekStart: string): Date {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(weekStart);
    if (!match) {
      throw new BadRequestException('weekStart must be in YYYY-MM-DD format');
    }

    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      throw new BadRequestException('weekStart is invalid date');
    }

    // Create date at noon UTC to avoid timezone edge cases
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

    // Validate it's a Monday (getUTCDay: 0=Sun, 1=Mon, ..., 6=Sat)
    if (date.getUTCDay() !== 1) {
      throw new BadRequestException('weekStart must be a Monday');
    }

    // Return midnight UTC for the Monday
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  }

  /**
   * Format employee name as "Last, First" from fullName.
   * If fullName is "First Last", convert to "Last, First".
   * If already in "Last, First" format or ambiguous, return as-is.
   */
  private formatEmployeeName(fullName: string | null): string {
    if (!fullName) return '';

    const trimmed = fullName.trim();

    // If already contains comma, assume it's "Last, First"
    if (trimmed.includes(',')) {
      return trimmed;
    }

    // Otherwise assume "First Last" format
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      const last = parts[parts.length - 1];
      const first = parts.slice(0, -1).join(' ');
      return `${last}, ${first}`;
    }

    return trimmed;
  }

  /**
   * Generate payroll packet rows for a given weekStart (Monday).
   *
   * Data Selection Logic:
   * - Only include OFFICIAL hours with approvalStatus = APPROVED
   * - Week boundary: start = weekStart (Monday), end = weekStart + 7 days (next Monday)
   * - Include hoursEntry rows where: periodEnd > start AND periodStart < end (overlap)
   */
  async generatePacketRows(weekStart: string): Promise<GeneratePacketResult> {
    const weekStartDate = this.parseAndValidateWeekStart(weekStart);
    const weekEndDate = new Date(weekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Fetch all OFFICIAL + APPROVED hours entries that overlap with the week
    const entries = await this.prisma.hoursEntry.findMany({
      where: {
        type: 'OFFICIAL',
        approvalStatus: 'APPROVED',
        // Overlap condition: periodEnd > weekStart AND periodStart < weekEnd
        periodEnd: { gt: weekStartDate },
        periodStart: { lt: weekEndDate },
      },
      include: {
        lines: true,
        order: {
          select: {
            jobLocationCode: true,
          },
        },
      },
    });

    // Collect unique employee IDs
    const employeeIds = [...new Set(entries.map((e) => e.workerId))];

    // Fetch employee profiles with SSN
    const profiles = await this.prisma.user.findMany({
      where: { id: { in: employeeIds } },
      include: {
        employeeProfile: true,
      },
    });

    const profileMap = new Map(
      profiles.map((p) => [
        p.id,
        { fullName: p.fullName, ssn: p.employeeProfile?.ssn || '' },
      ]),
    );

    // Fetch deduction elections for all employees in this week
    const deductions = await this.prisma.payrollDeductionElection.findMany({
      where: {
        employeeId: { in: employeeIds },
        isActive: true,
        effectiveWeek: { lte: weekStartDate },
        code: { in: ['ETV', 'ADV'] },
      },
      orderBy: [{ effectiveWeek: 'desc' }, { createdAt: 'desc' }],
    });

    // Build deduction map: employeeId -> { ETV: amount, ADV: amount }
    const deductionMap = new Map<string, { ETV: number; ADV: number }>();
    for (const d of deductions) {
      if (!deductionMap.has(d.employeeId)) {
        deductionMap.set(d.employeeId, { ETV: 0, ADV: 0 });
      }
      const emp = deductionMap.get(d.employeeId)!;
      // Only take the first (latest effective) for each code
      if (d.code === 'ETV' && emp.ETV === 0 && d.amountCents) {
        emp.ETV = d.amountCents / 100; // Convert cents to dollars
      }
      if (d.code === 'ADV' && emp.ADV === 0 && d.amountCents) {
        emp.ADV = d.amountCents / 100; // Convert cents to dollars
      }
    }

    // Aggregate by (employeeId, LOC)
    // Key: `${employeeId}__${loc}`
    type Aggregation = {
      employeeId: string;
      loc: string;
      regRate: number;
      regHours: number;
      otHours: number;
      dtHours: number;
      holidayHours: number;
      bonusAmount: number;
      reimbAmount: number;
      perDiemAmount: number;
      // SD hours (1:1 from approved snapshot, unit === REG_SD/OT_SD/DT_SD)
      regSdHours: number;
      otSdHours: number;
      dtSdHours: number;
    };

    const aggregations = new Map<string, Aggregation>();

    for (const entry of entries) {
      const loc = entry.order?.jobLocationCode || '';
      const key = `${entry.workerId}__${loc}`;

      if (!aggregations.has(key)) {
        aggregations.set(key, {
          employeeId: entry.workerId,
          loc,
          regRate: 0,
          regHours: 0,
          otHours: 0,
          dtHours: 0,
          holidayHours: 0,
          bonusAmount: 0,
          reimbAmount: 0,
          perDiemAmount: 0,
          regSdHours: 0,
          otSdHours: 0,
          dtSdHours: 0,
        });
      }

      const agg = aggregations.get(key)!;

      // Process lines
      for (const line of entry.lines) {
        const qty = Number(line.quantity) || 0;
        const rate = line.rate ? Number(line.rate) : 0;

        switch (line.earningCode) {
          case 'REG':
            if (line.unit === 'HOURS') {
              agg.regHours += qty;
              // Use the first non-zero rate encountered for REG
              if (rate > 0 && agg.regRate === 0) {
                agg.regRate = rate;
              }
            }
            break;
          case 'OT':
            if (line.unit === 'HOURS') {
              agg.otHours += qty;
            }
            break;
          case 'DT':
            if (line.unit === 'HOURS') {
              agg.dtHours += qty;
            }
            break;
          case 'H':
            if (line.unit === 'HOURS') {
              agg.holidayHours += qty;
            }
            break;
          case 'BONUS':
            if (line.unit === 'DOLLARS') {
              agg.bonusAmount += qty;
            }
            break;
          case 'REM':
            if (line.unit === 'DOLLARS') {
              agg.reimbAmount += qty;
            }
            break;
          case 'PD':
            if (line.unit === 'DOLLARS') {
              agg.perDiemAmount += qty;
            }
            break;
        }

        // SD hours aggregation (1:1 from unit === REG_SD/OT_SD/DT_SD)
        // NO normalization, NO collapsing into REG/OT/DT
        if (line.unit === 'REG_SD') {
          agg.regSdHours += qty;
        } else if (line.unit === 'OT_SD') {
          agg.otSdHours += qty;
        } else if (line.unit === 'DT_SD') {
          agg.dtSdHours += qty;
        }
      }

      // Fallback: if no lines, use totalHours as REG
      if (entry.lines.length === 0 && entry.totalHours) {
        agg.regHours += entry.totalHours;
      }
    }

    // Build final rows
    const rows: PacketLineRow[] = [];

    for (const agg of aggregations.values()) {
      const profile = profileMap.get(agg.employeeId);
      const deduction = deductionMap.get(agg.employeeId) || { ETV: 0, ADV: 0 };

      rows.push({
        ssn: profile?.ssn || '',
        employeeName: this.formatEmployeeName(profile?.fullName || ''),
        loc: agg.loc,
        regRate: agg.regRate,
        regHours: agg.regHours,
        otHours: agg.otHours,
        dtHours: agg.dtHours,
        holidayHours: agg.holidayHours,
        bonusAmount: agg.bonusAmount,
        reimbAmount: agg.reimbAmount,
        mileageAmount: 0, // v1: not representable
        perDiemAmount: agg.perDiemAmount,
        advanceDeductionAmount: deduction.ADV,
        etvDeductionAmount: deduction.ETV,
        // SD hours (1:1 from approved snapshot)
        regSdHours: agg.regSdHours,
        otSdHours: agg.otSdHours,
        dtSdHours: agg.dtSdHours,
      });
    }

    // Sort deterministically: by EmployeeName asc, then LOC asc
    rows.sort((a, b) => {
      const nameCompare = a.employeeName.localeCompare(b.employeeName);
      if (nameCompare !== 0) return nameCompare;
      return a.loc.localeCompare(b.loc);
    });

    return {
      weekStart: weekStartDate.toISOString().slice(0, 10),
      weekEnd: weekEndDate.toISOString().slice(0, 10),
      rows,
      packetId: null, // Not persisted yet
    };
  }

  /**
   * Generate and persist a payroll packet to the database.
   */
  async generateAndPersistPacket(
    weekStart: string,
    generatedByUserId?: string,
  ): Promise<GeneratePacketResult> {
    const result = await this.generatePacketRows(weekStart);
    const weekStartDate = this.parseAndValidateWeekStart(weekStart);

    // Check if packet already exists for this week
    const existing = await this.prisma.payrollPacket.findUnique({
      where: { weekStart: weekStartDate },
    });

    if (existing) {
      throw new BadRequestException(
        `Payroll packet already exists for week starting ${weekStart}`,
      );
    }

    // Create packet with lines
    const packet = await this.prisma.payrollPacket.create({
      data: {
        weekStart: weekStartDate,
        generatedByUserId: generatedByUserId || null,
        lines: {
          create: result.rows.map((row) => ({
            employeeId: '', // Not stored for anonymity; we have SSN and name
            employeeName: row.employeeName,
            ssn: row.ssn,
            loc: row.loc,
            regRate: new Prisma.Decimal(row.regRate),
            regHours: new Prisma.Decimal(row.regHours),
            otHours: new Prisma.Decimal(row.otHours),
            dtHours: new Prisma.Decimal(row.dtHours),
            holidayHours: new Prisma.Decimal(row.holidayHours),
            bonusAmount: new Prisma.Decimal(row.bonusAmount),
            reimbAmount: new Prisma.Decimal(row.reimbAmount),
            mileageAmount: new Prisma.Decimal(row.mileageAmount),
            perDiemAmount: new Prisma.Decimal(row.perDiemAmount),
            advanceDeductionAmount: new Prisma.Decimal(row.advanceDeductionAmount),
            etvDeductionAmount: new Prisma.Decimal(row.etvDeductionAmount),
          })),
        },
      },
    });

    return {
      ...result,
      packetId: packet.id,
    };
  }

  /**
   * Export packet rows to CSV format.
   *
   * CSV Columns (v1 + SD):
   * SSN, EmployeeName, LOC, RegRate, RegHours, OTHours, DTHours, HolidayHours,
   * BonusAmount, ReimbAmount, MileageAmount, PerDiemAmount, AdvanceDeductionAmount, ETVDeductionAmount,
   * RegSDHours, OTSDHours, DTSDHours
   *
   * SD hours are HOURS ONLY — NO money math in payroll.
   */
  generateCsv(rows: PacketLineRow[]): string {
    const headers = [
      'SSN',
      'EmployeeName',
      'LOC',
      'RegRate',
      'RegHours',
      'OTHours',
      'DTHours',
      'HolidayHours',
      'BonusAmount',
      'ReimbAmount',
      'MileageAmount',
      'PerDiemAmount',
      'AdvanceDeductionAmount',
      'ETVDeductionAmount',
      'RegSDHours',
      'OTSDHours',
      'DTSDHours',
    ];

    const escapeCsv = (value: string | number): string => {
      const s = String(value);
      if (/[",\n\r]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const lines: string[] = [];
    lines.push(headers.join(','));

    for (const row of rows) {
      const values = [
        row.ssn,
        row.employeeName,
        row.loc,
        row.regRate.toFixed(2),
        row.regHours.toFixed(2),
        row.otHours.toFixed(2),
        row.dtHours.toFixed(2),
        row.holidayHours.toFixed(2),
        row.bonusAmount.toFixed(2),
        row.reimbAmount.toFixed(2),
        row.mileageAmount.toFixed(2),
        row.perDiemAmount.toFixed(2),
        row.advanceDeductionAmount.toFixed(2),
        row.etvDeductionAmount.toFixed(2),
        // SD hours (HOURS ONLY — no money math)
        row.regSdHours.toFixed(2),
        row.otSdHours.toFixed(2),
        row.dtSdHours.toFixed(2),
      ].map(escapeCsv);

      lines.push(values.join(','));
    }

    return lines.join('\n');
  }
}

