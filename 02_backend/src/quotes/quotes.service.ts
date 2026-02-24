import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PayrollBurdenService, ResolvedBurdenMap } from '../payroll-burden/payroll-burden.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { AddQuoteLineDto } from './dto/add-quote-line.dto';

interface LineEconomics {
  tradeId: string;
  baseRate: number;
  burdenedRegRate: number;
  burdenedOtRate: number;
  burdenedDtRate: number;
}

interface SnapshotPayload {
  quoteId: string;
  state: string;
  generatedAt: string;
  burdenRates: ResolvedBurdenMap;
  lines: LineEconomics[];
  summary: {
    totalLines: number;
    totalBurdenPercent: number;
  };
}

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly burdenService: PayrollBurdenService,
  ) {}

  async createQuote(dto: CreateQuoteDto) {
    return this.prisma.quote.create({
      data: {
        customerId: dto.customerId ?? null,
        title: dto.title,
        state: dto.state.toUpperCase(),
        status: 'DRAFT',
      },
    });
  }

  async addLine(quoteId: string, dto: AddQuoteLineDto) {
    const quote = await this.prisma.quote.findUnique({ where: { id: quoteId } });
    if (!quote) throw new NotFoundException('Quote not found');

    // Upsert: update if same tradeId exists, else create
    const existing = await this.prisma.quoteLine.findFirst({
      where: { quoteId, tradeId: dto.tradeId },
    });

    if (existing) {
      return this.prisma.quoteLine.update({
        where: { id: existing.id },
        data: { baseRate: dto.baseRate },
      });
    }

    return this.prisma.quoteLine.create({
      data: {
        quoteId,
        tradeId: dto.tradeId,
        baseRate: dto.baseRate,
      },
    });
  }

  async generate(quoteId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { lines: { orderBy: { tradeId: 'asc' } } },
    });

    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.lines.length === 0) {
      throw new BadRequestException('Quote must have at least one line to generate');
    }

    // Compute deterministic input hash
    const inputHash = this.computeInputHash(quote);

    // Check if snapshot already exists (idempotency)
    const existingSnapshot = await this.prisma.orderEconomicsSnapshot.findUnique({
      where: { quoteId_inputHash: { quoteId, inputHash } },
    });

    if (existingSnapshot) {
      return existingSnapshot;
    }

    // Resolve burden rates for state
    const burdenRates = await this.burdenService.resolveBurdenRates({
      stateCode: quote.state,
    });

    // Compute total burden percent (sum of all categories)
    const totalBurdenPercent = Object.values(burdenRates).reduce((sum, v) => sum + v, 0);
    const burdenMultiplier = 1 + totalBurdenPercent / 100;

    // Compute line-level economics
    const lineEconomics: LineEconomics[] = quote.lines.map((line) => ({
      tradeId: line.tradeId,
      baseRate: line.baseRate,
      burdenedRegRate: this.round(line.baseRate * burdenMultiplier, 4),
      burdenedOtRate: this.round(line.baseRate * 1.5 * burdenMultiplier, 4),
      burdenedDtRate: this.round(line.baseRate * 2 * burdenMultiplier, 4),
    }));

    const payload: SnapshotPayload = {
      quoteId: quote.id,
      state: quote.state,
      generatedAt: new Date().toISOString(),
      burdenRates,
      lines: lineEconomics,
      summary: {
        totalLines: lineEconomics.length,
        totalBurdenPercent,
      },
    };

    // Create snapshot (immutable)
    const snapshot = await this.prisma.orderEconomicsSnapshot.create({
      data: {
        quoteId,
        inputHash,
        payloadJson: payload as any,
      },
    });

    // Update quote status to GENERATED
    await this.prisma.quote.update({
      where: { id: quoteId },
      data: { status: 'GENERATED' },
    });

    return snapshot;
  }

  async getQuote(quoteId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        lines: { orderBy: { tradeId: 'asc' } },
        snapshots: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!quote) throw new NotFoundException('Quote not found');

    return {
      ...quote,
      latestSnapshot: quote.snapshots[0] ?? null,
    };
  }

  private computeInputHash(quote: { id: string; state: string; lines: { tradeId: string; baseRate: number }[] }): string {
    // Deterministic: sorted lines by tradeId
    const canonical = {
      quoteId: quote.id,
      state: quote.state,
      lines: quote.lines.map((l) => ({ tradeId: l.tradeId, baseRate: l.baseRate })),
    };

    const json = JSON.stringify(canonical);
    return createHash('sha256').update(json).digest('hex');
  }

  private round(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }
}
