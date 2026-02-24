import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PayrollBurdenService } from '../payroll-burden/payroll-burden.service';
import { BurdenSnapshotGuard } from './burden-snapshot.guard';

@Injectable()
export class TradeMarginSnapshotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly guard: BurdenSnapshotGuard,
    private readonly payrollBurdenService: PayrollBurdenService,
  ) {}

  private async computeTradeLaborCostForInvoice(
    invoiceId: string,
  ): Promise<{
    laborCost: number;
    missingPricingLines: number;
    byTrade: Array<{ tradeId: string; laborCost: number; byEarningCode: Record<string, number> }>;
  }> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true, orderId: true },
    });

    if (!invoice || !invoice.orderId) {
      return { laborCost: 0, missingPricingLines: 0, byTrade: [] };
    }

    const hoursEntries = await this.prisma.hoursEntry.findMany({
      where: {
        orderId: invoice.orderId,
        type: 'OFFICIAL',
        approvalStatus: 'APPROVED',
      },
      select: {
        id: true,
        lines: { select: { unit: true, quantity: true, rate: true, amount: true, tradeId: true, earningCode: true } },
      },
    });

    let laborCost = 0;
    let missingPricingLines = 0;
    const tradeMap = new Map<string, { laborCost: number; byEarningCode: Record<string, number> }>();

    for (const entry of hoursEntries) {
      for (const line of entry.lines) {
        if (line.unit !== 'HOURS') continue;
        if (!line.tradeId) continue;

        let lineCost = 0;
        if (line.amount != null) {
          lineCost = Number(line.amount);
        } else if (line.rate != null) {
          lineCost = Number(line.quantity) * Number(line.rate);
        } else {
          missingPricingLines++;
          continue;
        }

        laborCost += lineCost;

        let tradeEntry = tradeMap.get(line.tradeId);
        if (!tradeEntry) {
          tradeEntry = { laborCost: 0, byEarningCode: {} };
          tradeMap.set(line.tradeId, tradeEntry);
        }
        tradeEntry.laborCost += lineCost;

        const ec = line.earningCode ?? 'UNKNOWN';
        tradeEntry.byEarningCode[ec] = (tradeEntry.byEarningCode[ec] ?? 0) + lineCost;
      }
    }

    const byTrade = Array.from(tradeMap.entries()).map(([tradeId, data]) => ({
      tradeId,
      laborCost: data.laborCost,
      byEarningCode: data.byEarningCode,
    }));

    return { laborCost, missingPricingLines, byTrade };
  }

  private async resolveInvoiceStateCode(invoiceId: string): Promise<string | null> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { orderId: true },
    });
    if (!invoice?.orderId) return null;

    const order = await this.prisma.order.findUnique({
      where: { id: invoice.orderId },
      select: { locationId: true },
    });
    if (!order?.locationId) return null;

    const location = await this.prisma.location.findUnique({
      where: { id: order.locationId },
      select: { state: true },
    });
    if (!location?.state) return null;

    return location.state.trim() || null;
  }

  private computeBaseWagesFromByEarningCode(byEarningCode: Record<string, number>): number {
    let baseWages = 0;
    for (const [ec, cost] of Object.entries(byEarningCode)) {
      if (ec === 'REG' || ec === 'HOL') {
        baseWages += cost;
      } else if (ec === 'OT') {
        baseWages += cost / 1.5;
      } else if (ec === 'DT') {
        baseWages += cost / 2.0;
      }
      // All others (PD, TRV, BONUS, REM, etc) → 0
    }
    return baseWages;
  }

  async createSnapshotForInvoice(params: { invoiceId: string; amount: number }) {
    const { invoiceId, amount } = params;

    // Idempotent: if snapshot already exists (multi-payment), return it.
    const existing = await this.prisma.invoiceTradeMarginSnapshot.findUnique({
      where: { invoiceId },
    });
    if (existing) return existing;

    // Guard (defense-in-depth): should be redundant with the findUnique above.
    await this.guard.assertNoBurdenSnapshot(invoiceId);

    const { laborCost, byTrade } = await this.computeTradeLaborCostForInvoice(invoiceId);

    // Resolve WC state (job-site state)
    const stateCode = await this.resolveInvoiceStateCode(invoiceId);
    if (!stateCode) {
      throw new BadRequestException('Missing job-site state for WC calculation');
    }

    // Get invoice createdAt for effectiveAt
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { createdAt: true },
    });

    // Resolve WC rate (STATE-level only)
    const resolvedRates = await this.payrollBurdenService.resolveBurdenRates({
      stateCode,
      effectiveAt: invoice?.createdAt ?? new Date(),
    });
    const wcRate = resolvedRates.WC;
    if (wcRate == null || wcRate <= 0) {
      throw new BadRequestException(`Missing Work Comp rate for state=${stateCode}`);
    }

    // Compute base wages from all trades
    let baseWagesTotal = 0;
    for (const trade of byTrade) {
      baseWagesTotal += this.computeBaseWagesFromByEarningCode(trade.byEarningCode);
    }

    // WC cost calculation
    const wcCost = baseWagesTotal * (wcRate / 100);

    // Phase C: Wage-following burdens (apply to full labor cost including OT/DT premium)
    const ficaRate = resolvedRates.FICA ?? 0;
    const futaRate = resolvedRates.FUTA ?? 0;
    const sutaRate = resolvedRates.SUTA ?? 0;
    const glRate = resolvedRates.GL ?? 0;
    const peoRate = resolvedRates.PEO ?? 0;

    const ficaCost = laborCost * (ficaRate / 100);
    const futaCost = laborCost * (futaRate / 100);
    const sutaCost = laborCost * (sutaRate / 100);
    const glCost = laborCost * (glRate / 100);
    const peoCost = laborCost * (peoRate / 100);

    const phaseCWageBurdenTotal = ficaCost + futaCost + sutaCost + glCost + peoCost;

    const tradeRevenuePaid = amount;
    const tradeLaborCost = laborCost;
    const tradeBurdenCost = wcCost + phaseCWageBurdenTotal;
    const tradeMargin = tradeRevenuePaid - tradeLaborCost - tradeBurdenCost;

    const burdenBreakdownJson = JSON.stringify({
      workersComp: {
        state: stateCode,
        ratePercent: wcRate,
        baseWages: baseWagesTotal,
        wcCost: wcCost,
      },
      wageFollowing: {
        fica: ficaCost,
        futa: futaCost,
        suta: sutaCost,
        gl: glCost,
        peo: peoCost,
        total: phaseCWageBurdenTotal,
      },
    });

    // Resolve commission rate from active plan (fallback 0.10)
    const activePlan = await this.prisma.commissionPlan.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: { defaultRate: true },
    });
    const commissionRateSnapshot = activePlan?.defaultRate ?? 0.10;

    return this.prisma.invoiceTradeMarginSnapshot.create({
      data: {
        invoiceId,
        commissionRateSnapshot,
        tradeRevenuePaid,
        tradeLaborCost,
        tradeBurdenCost,
        tradeMargin,
        burdenBreakdownJson,
      },
    });
  }
}
