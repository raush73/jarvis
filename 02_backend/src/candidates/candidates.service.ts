import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CANDIDATE_AVAILABILITY, isCandidateAvailability } from './candidate.constants';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { ListCandidatesQueryDto } from './dto/list-candidates.query.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';

@Injectable()
export class CandidatesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns candidate availability status.
   * Phase 21.2 rule:
   * - We keep Candidate.status as STRING in Prisma (no migration risk),
   * - but API responses must be deterministic and only return allowed values.
   */
  async getAvailability(candidateId: string): Promise<{ status: string }> {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { status: true },
    });

    if (!candidate) throw new NotFoundException('Candidate not found');

    const raw = candidate.status ?? null;

    // Deterministic return values for Jarvis 1.0
    if (raw === null) return { status: CANDIDATE_AVAILABILITY.NOT_ACTIVE };

    if (!isCandidateAvailability(raw)) {
      // Legacy/unknown value in DB; do NOT leak randomness to API consumers
      return { status: CANDIDATE_AVAILABILITY.NOT_ACTIVE };
    }

    return { status: raw };
  }

  /**
   * Sets candidate availability status.
   * Allowed:
   * - ACTIVE_SEEKING
   * - NOT_ACTIVE
   */
  async setAvailability(candidateId: string, status: string): Promise<{ ok: true; status: string }> {
    if (!isCandidateAvailability(status)) {
      throw new BadRequestException(
        `Invalid candidate availability status: ${status}. Allowed: ${CANDIDATE_AVAILABILITY.ACTIVE_SEEKING}, ${CANDIDATE_AVAILABILITY.NOT_ACTIVE}`,
      );
    }

    const exists = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true },
    });

    if (!exists) throw new NotFoundException('Candidate not found');

    await this.prisma.candidate.update({
      where: { id: candidateId },
      data: { status },
    });

    return { ok: true as const, status };
  }

  /**
   * Phase 21.2/21.3: List candidates with optional filters.
   * Deterministic status output: only ACTIVE_SEEKING | NOT_ACTIVE.
   */
  async listCandidates(query?: ListCandidatesQueryDto): Promise<Array<{ id: string; status: string }>> {
    const statusFilter =
      query?.status && isCandidateAvailability(query.status) ? query.status : undefined;

    const q = query?.q?.trim() ? query.q.trim() : undefined;

    const rows = await this.prisma.candidate.findMany({
      select: { id: true, status: true, createdAt: true, email: true, phone: true },
      where: {
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(q
          ? {
              OR: [{ id: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return rows.map((r) => ({
      id: r.id,
      status: r.status && isCandidateAvailability(r.status) ? r.status : CANDIDATE_AVAILABILITY.NOT_ACTIVE,
    }));
  }

  /**
   * Phase 21.3: Read full candidate record (admin-only via controller permission).
   * Deterministic status output: only ACTIVE_SEEKING | NOT_ACTIVE.
   */
  async getCandidateById(candidateId: string): Promise<{
    id: string;
    status: string;
    phone: string | null;
    email: string | null;
    tools: string;
    ppe: string;
    safetyRecords: string;
    createdAt: string;
    updatedAt: string;
  }> {
    const c = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      select: {
        id: true,
        status: true,
        phone: true,
        email: true,
        tools: true,
        ppe: true,
        safetyRecords: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!c) throw new NotFoundException('Candidate not found');

    const status =
      c.status && isCandidateAvailability(c.status) ? c.status : CANDIDATE_AVAILABILITY.NOT_ACTIVE;

    const tools =
      c.tools === null || c.tools === undefined
        ? '{}'
        : typeof c.tools === 'string'
          ? c.tools
          : JSON.stringify(c.tools);

    const ppe =
      c.ppe === null || c.ppe === undefined
        ? '{}'
        : typeof c.ppe === 'string'
          ? c.ppe
          : JSON.stringify(c.ppe);

    const safetyRecords =
      c.safetyRecords === null || c.safetyRecords === undefined
        ? '{}'
        : typeof c.safetyRecords === 'string'
          ? c.safetyRecords
          : JSON.stringify(c.safetyRecords);

    return {
      id: c.id,
      status,
      phone: c.phone ?? null,
      email: c.email ?? null,
      tools,
      ppe,
      safetyRecords,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }

  /**
   * Option B: Update candidate profile + markers (admin-only via controller permission).
   * Status is NOT updated here (availability endpoint owns status).
   */
  async updateCandidate(candidateId: string, dto: UpdateCandidateDto): Promise<{ ok: true }> {
    const exists = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true },
    });

    if (!exists) throw new NotFoundException('Candidate not found');

    const data: any = {};

    // Simple scalar fields
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.email !== undefined) data.email = dto.email;

    // Marker fields: accept stringified JSON, store as JsonValue
    const parseJsonField = (fieldName: string, raw?: string) => {
      if (raw === undefined) return undefined;
      try {
        return JSON.parse(raw);
      } catch {
        throw new BadRequestException(`${fieldName} must be valid JSON string`);
      }
    };

    const tools = parseJsonField('tools', dto.tools);
    if (tools !== undefined) data.tools = tools;

    const ppe = parseJsonField('ppe', dto.ppe);
    if (ppe !== undefined) data.ppe = ppe;

    const safetyRecords = parseJsonField('safetyRecords', dto.safetyRecords);
    if (safetyRecords !== undefined) data.safetyRecords = safetyRecords;

    await this.prisma.candidate.update({
      where: { id: candidateId },
      data,
    });

    return { ok: true as const };
  }

  /**
   * Phase 21.3: Create a candidate (admin-only via controller permission).
   * Deterministic defaults:
   * - status defaults to NOT_ACTIVE if missing/invalid
   * - tools/ppe/safetyRecords default to "{}" if missing
   */
  async createCandidate(dto: CreateCandidateDto): Promise<{ ok: true; id: string }> {
    const status =
      dto.status && isCandidateAvailability(dto.status) ? dto.status : CANDIDATE_AVAILABILITY.NOT_ACTIVE;

    const tools = dto.tools?.trim() ? dto.tools : '{}';
    const ppe = dto.ppe?.trim() ? dto.ppe : '{}';
    const safetyRecords = dto.safetyRecords?.trim() ? dto.safetyRecords : '{}';

    try {
      const created = await this.prisma.candidate.create({
        data: {
          ...(dto.id ? { id: dto.id } : {}),
          phone: dto.phone ?? null,
          email: dto.email ?? null,
          status,
          tools,
          ppe,
          safetyRecords,
        },
        select: { id: true },
      });

      return { ok: true as const, id: created.id };
    } catch (err: any) {
      throw new BadRequestException(
        err?.message ? `Candidate create failed: ${err.message}` : 'Candidate create failed',
      );
    }
  }
    // Phase 21.5 (stub): deterministic recommendations placeholder
async getCandidateRecommendations(
  candidateId: string,
  orderId?: string,
): Promise<{ ok: true; items: any[] }> {
  // v1: if orderId is missing, keep the existing wiring-stub behavior
  if (!orderId) {
    void candidateId;
    return { ok: true, items: [] };
  }

  // v1: validate order exists
  const order = await this.prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true },
  });

  if (!order) {
    throw new NotFoundException(`Order not found: ${orderId}`);
  }

 // v1 requirements stub map (ZERO migrations)
// Centralized, explicit, deterministic
const requirementsByOrderId: Record<
string,
{ requiredTools: string[]; requiredPpe: string[]; requireCleanSafety: boolean }
> = {
// TEMP / TEST EXAMPLE (safe to remove later)
// This proves filtering works deterministically
};

// Resolve requirements for this order (explicit defaults)
const req = requirementsByOrderId[orderId] ?? {
requiredTools: [],
requiredPpe: [],
requireCleanSafety: false,
};

// Pull candidates (minimal fields only)
const candidates = await this.prisma.candidate.findMany({
select: {
  id: true,
  status: true,
  tools: true,
  ppe: true,
  safetyRecords: true,
  updatedAt: true,
},
});

  // Helper: treat candidate.tools/ppe as JSON object and check “truthy” keys
  const hasAll = (obj: any, required: string[]) => {
    if (!required?.length) return true;
    if (!obj || typeof obj !== 'object') return false;
    return required.every((k) => Boolean((obj as any)[k]));
  };

  // Eligibility: ACTIVE_SEEKING only (based on your seeded data)
  const eligible = candidates.filter((c) => c.status === 'ACTIVE_SEEKING');

  // Apply hard filters for tools + PPE
  const filtered = eligible.filter(
    (c) => hasAll(c.tools, req.requiredTools ?? []) && hasAll(c.ppe, req.requiredPpe ?? []),
  );

  // Score (simple v1): 50 base + penalties for safety events (later we’ll refine)
  const scoreCandidate = (c: any) => {
    let score = 50;
    const reasons: string[] = ['ACTIVE_SEEKING'];

    if ((req.requiredTools ?? []).length) reasons.push('HAS_REQUIRED_TOOLS');
    if ((req.requiredPpe ?? []).length) reasons.push('HAS_REQUIRED_PPE');

    // Safety placeholder: if requireCleanSafety and any safetyRecords exist, flag (no disqualify yet)
    const flags: string[] = [];
    const safety = c.safetyRecords;

    if (req.requireCleanSafety) {
      const hasAnySafety = Array.isArray(safety) ? safety.length > 0 : Boolean(safety);
      if (hasAnySafety) {
        flags.push('SAFETY_REVIEW_REQUIRED');
        score -= 30;
        reasons.push('SAFETY_FLAGGED');
      } else {
        reasons.push('SAFETY_OK');
      }
    }

    return { candidateId: c.id, score, reasons, flags };
  };

  const items = filtered
    .map(scoreCandidate)
    .sort((a, b) => {
      // deterministic ordering
      if (b.score !== a.score) return b.score - a.score;
      return a.candidateId.localeCompare(b.candidateId);
    });

  void candidateId;
  return { ok: true, items };
}
}
