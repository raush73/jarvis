import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeCompanyName } from '../utils/normalize-company-name';
import { normalizeDomain } from '../utils/normalize-domain';

@Injectable()
export class CompanySignalsService {
  constructor(private readonly prisma: PrismaService) {}

  private safeJsonParse(input?: string): Record<string, any> | null {
    if (!input) return null;
    try {
      const parsed = JSON.parse(input);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }

  async create(data: {
    companyId?: string;
    sourceType: string;
    rawCompanyName: string;
    rawContext?: string;
    confidenceScore?: number;
    meta?: string;
    domain?: string; // allowed from controller/DTO; optional
  }) {
    // Normalize incoming company name + domain
    const normalizedName = normalizeCompanyName(data.rawCompanyName);
    const domain = normalizeDomain(data.domain) ?? null;

    // 1) Try exact normalizedName match first
    let matchedCompanyId: string | null = null;
    let matchReason: 'normalizedName' | 'domain' | null = null;

    const nameMatch = await this.prisma.company.findUnique({
      where: { normalizedName },
      select: { id: true },
    });

    if (nameMatch?.id) {
      matchedCompanyId = nameMatch.id;
      matchReason = 'normalizedName';
    }

    // 2) If no name match, try exact domain match (deterministic)
    if (!matchedCompanyId && domain) {
      const domainMatch = await this.prisma.company.findUnique({
        where: { domain },
        select: { id: true },
      });

      if (domainMatch?.id) {
        matchedCompanyId = domainMatch.id;
        matchReason = 'domain';
      }
    }

    // 3) Backfill + bookkeeping if we matched
    if (matchedCompanyId) {
      // Backfill by normalizedName (always safe)
      await this.prisma.companySignal.updateMany({
        where: {
          companyId: null,
          normalizedName,
        },
        data: {
          companyId: matchedCompanyId,
        },
      });

      // If we have a domain, also backfill by domain
      if (domain) {
        await this.prisma.companySignal.updateMany({
          where: {
            companyId: null,
            domain,
          },
          data: {
            companyId: matchedCompanyId,
          },
        });
      }

      await this.prisma.company.update({
        where: { id: matchedCompanyId },
        data: { lastSignalAt: new Date() },
      });
    }

    // Create the new signal
    return this.prisma.companySignal.create({
      data: {
        companyId: matchedCompanyId ?? data.companyId ?? null,
        sourceType: data.sourceType,
        rawCompanyName: data.rawCompanyName,
        normalizedName,
        domain,
        rawContext: data.rawContext ?? null,
        confidenceScore: data.confidenceScore ?? 0,
        meta: JSON.stringify({
          ...(this.safeJsonParse(data.meta) ?? {}),
          ...(matchReason ? { matchReason } : {}),
        }),
      },
      select: {
        id: true,
        companyId: true,
        sourceType: true,
        rawCompanyName: true,
        normalizedName: true,
        confidenceScore: true,
        createdAt: true,
        domain: true,
        meta: true,
      },
    });
  }

  async findAll() {
    return this.prisma.companySignal.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        companyId: true,
        sourceType: true,
        rawCompanyName: true,
        normalizedName: true,
        confidenceScore: true,
        createdAt: true,
        domain: true,
        meta: true,
      },
    });
  }
}
