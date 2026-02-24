import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type CallTargetReason = 'recentSignal' | 'hasSignals';

@Injectable()
export class CallTargetsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Deterministic, explainable v1:
   * - Pull Companies
   * - Count attached CompanySignals via groupBy (no relation-name guessing)
   * - Score by recency (lastSignalAt) and signal volume
   * - Return ranked list with reasons
   *
   * Slice 2: "already-called within X days" suppression
   * - Exclude companies that have a CallLog by this requesting user within last N days
   */
  async getRankedCallTargets(limit = 25, userId?: string, suppressDays = 30) {
    // Build suppression set (deterministic)
    const since = new Date(Date.now() - suppressDays * 24 * 60 * 60 * 1000);

    let suppressedCompanyIds = new Set<string>();

    if (userId && suppressDays > 0) {
      const recentCalls = await this.prisma.callLog.findMany({
        where: {
          userId,
          calledAt: {
            gte: since,
          },
        },
        select: {
          companyId: true,
        },
      });

      suppressedCompanyIds = new Set(recentCalls.map((r) => r.companyId));
    }

    const companies = await this.prisma.company.findMany({
      select: {
        id: true,
        legalName: true,
        normalizedName: true,
        domain: true,
        website: true,
        lastSignalAt: true,
      },
    });

    // Count signals by companyId deterministically (only signals that are attached to a company)
    const signalCounts = await this.prisma.companySignal.groupBy({
      by: ['companyId'],
      where: {
        companyId: { not: null },
      },
      _count: {
        _all: true,
      },
    });

    const countsByCompanyId = new Map<string, number>();
    for (const row of signalCounts) {
      // row.companyId is nullable in Prisma types; but filtered above
      if (row.companyId) countsByCompanyId.set(row.companyId, row._count._all);
    }

    const now = Date.now();

    const scored = companies.map((c) => {
      const signalCount = countsByCompanyId.get(c.id) ?? 0;

      // Recency score: higher when lastSignalAt is closer to now
      // Deterministic bucket approach to keep it explainable and stable.
      let recencyPoints = 0;
      let reason: CallTargetReason | null = null;

      if (c.lastSignalAt) {
        const ageHours = (now - new Date(c.lastSignalAt).getTime()) / (1000 * 60 * 60);

        if (ageHours <= 24) recencyPoints = 50;
        else if (ageHours <= 72) recencyPoints = 35;
        else if (ageHours <= 168) recencyPoints = 20; // 7 days
        else recencyPoints = 10;

        reason = 'recentSignal';
      } else if (signalCount > 0) {
        recencyPoints = 5;
        reason = 'hasSignals';
      }

      // Volume points: capped so one noisy company can't dominate forever.
      const volumePoints = Math.min(signalCount * 2, 30);

      const score = recencyPoints + volumePoints;

      return {
        company: {
          id: c.id,
          name: c.legalName,
          normalizedName: c.normalizedName,
          domain: c.domain,
          website: c.website,
          lastSignalAt: c.lastSignalAt,
          signalCount,
        },
        score,
        explain: {
          recencyPoints,
          volumePoints,
          reason,
        },
      };
    });

    // Deterministic ordering:
    // 1) higher score
    // 2) more recent lastSignalAt
    // 3) stable tiebreaker: normalizedName (string)
    const rankedAll = scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      const aTime = a.company.lastSignalAt ? new Date(a.company.lastSignalAt).getTime() : 0;
      const bTime = b.company.lastSignalAt ? new Date(b.company.lastSignalAt).getTime() : 0;
      if (bTime !== aTime) return bTime - aTime;

      return (a.company.normalizedName ?? '').localeCompare(b.company.normalizedName ?? '');
    });

    // Suppress already-called companies (by this user in last N days)
    const rankedAllSuppressed = rankedAll.filter((x) => !suppressedCompanyIds.has(x.company.id));
    const suppressedCount = rankedAll.length - rankedAllSuppressed.length;

    const rankedFiltered = rankedAllSuppressed.filter((x) => x.score > 0).slice(0, limit);
    const rankedAllLimited = rankedAllSuppressed.slice(0, limit);

    return {
      ok: true,
      limit,
      totalCompanies: companies.length,
      suppressedCount,
      rankedAll: rankedAllLimited,
      rankedFiltered,
    };
  }
}
