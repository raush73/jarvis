import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import { MagicLinkError } from './magic-link.errors';

export type MagicLinkScope = 'CANDIDATE_JOB_INTEREST' | 'DIRECT_DEPOSIT_OPT_IN' | 'CUSTOMER_VIEW_INVOICE';

@Injectable()
export class MagicLinksService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a magic link. We NEVER store the raw token - only a SHA-256 hash.
   * Returns the raw token so the caller can embed it into SMS/Email.
   */
  async createMagicLink(input: {
    scope: MagicLinkScope;
    orderId?: string | null;
    candidateId?: string | null;
    userId?: string | null;
    outreachRecipientId?: string | null;
    expiresAt: Date;
  }): Promise<{ id: string; token: string; expiresAt: Date }> {
    const token = crypto.randomBytes(32).toString('hex'); // 64 chars
    const tokenHash = this.hashToken(token);

    const created = await this.prisma.magicLink.create({
      data: {
        scope: input.scope,
        tokenHash,
        orderId: input.orderId ?? null,
        candidateId: input.candidateId ?? null,
        userId: input.userId ?? null,
        outreachRecipientId: input.outreachRecipientId ?? null,
        expiresAt: input.expiresAt,
      },
      select: { id: true, expiresAt: true },
    });

    return { id: created.id, token, expiresAt: created.expiresAt };
  }

  /**
   * Validate a token for viewing (multi-open): must exist, correct scope, not expired, not used.
   */
  async validateOrThrow(params: { token: string; scope: MagicLinkScope }) {
    const link = await this.findLinkByToken(params.token);
    this.validateLink(link, params.scope);
    return link;
  }

  /**
   * Consume a token (single-submit): atomic update ensures only one caller can burn it.
   * Returns the updated link row if consumption succeeded.
   * Race-safe: only one successful consumer; all others get USED error.
   * Deterministic: consumed links always have usedAt set.
   */
  async consumeOrThrow(params: { token: string; scope: MagicLinkScope }) {
    const tokenHash = this.hashToken(params.token);
    const now = new Date();

    // Attempt atomic consumption first (race-safe)
    const burned = await this.prisma.magicLink.updateMany({
      where: {
        tokenHash,
        usedAt: null,
        scope: params.scope,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });

    if (burned.count === 1) {
      // Consumption succeeded - fetch and return the updated link
      const link = await this.prisma.magicLink.findUnique({ where: { tokenHash } });
      if (!link) throw new MagicLinkError('NOT_FOUND', 'Magic link not found');

      // Determinism guard: a consumed link must always have usedAt set.
      if (!link.usedAt) throw new MagicLinkError('USED', 'Magic link consumption failed.');

      return link;
    }

    // Consumption failed - fetch to determine the specific error reason
    const link = await this.prisma.magicLink.findUnique({ where: { tokenHash } });
    if (!link) throw new MagicLinkError('NOT_FOUND', 'Magic link not found');
    if (link.scope !== params.scope)
      throw new MagicLinkError('INVALID_SCOPE', 'Invalid magic link scope');
    if (now > link.expiresAt) throw new MagicLinkError('EXPIRED', 'Magic link expired');

    // If we get here, the link exists, has correct scope, and is not expired,
    // but the update failed -> it was already used (race condition or already consumed)
    throw new MagicLinkError('USED', 'Magic link already used');
  }

  private async findLinkByToken(token: string) {
    const tokenHash = this.hashToken(token);
    const link = await this.prisma.magicLink.findUnique({
      where: { tokenHash },
    });
    if (!link) throw new MagicLinkError('NOT_FOUND', 'Magic link not found');
    return link;
  }

  private validateLink(link: any, expectedScope: MagicLinkScope) {
    if (link.scope !== expectedScope)
      throw new MagicLinkError('INVALID_SCOPE', 'Invalid magic link scope');

    const now = new Date();
    if (now > link.expiresAt) throw new MagicLinkError('EXPIRED', 'Magic link expired');
    if (link.usedAt) throw new MagicLinkError('USED', 'Magic link already used');
  }

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
