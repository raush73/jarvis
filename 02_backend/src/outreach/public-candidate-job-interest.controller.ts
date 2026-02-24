import {
    Body,
    Controller,
    Get,
    Post,
    Query,
    ForbiddenException,
    ConflictException,
    Req,
  } from '@nestjs/common';
  import type { Request } from 'express';
  import { MagicLinksService } from '../magic-links/magic-links.service';
  import { MagicLinkError, mapMagicLinkErrorToHttpException } from '../magic-links/magic-link.errors';
import { validatePublicMagicLink, consumePublicMagicLink } from '../magic-links/public-magic-link.util';
  import { PrismaService } from '../prisma/prisma.service';
  import { IsIn, IsOptional, IsString } from 'class-validator';
  
  class CandidateJobInterestResponseDto {
    @IsIn(['INTERESTED', 'NOT_INTERESTED'])
    responseStatus!: 'INTERESTED' | 'NOT_INTERESTED';
  
    @IsOptional()
    @IsString()
    responseNote?: string;
  }
  
  @Controller('public/candidate-job-interest')
  export class PublicCandidateJobInterestController {
    constructor(
      private readonly magicLinks: MagicLinksService,
      private readonly prisma: PrismaService,
    ) {}
  
    /**
     * Multi-open: validate token (not expired, not used) and return minimal payload.
     * Later we will enrich with full job details snapshot.
     */
    @Get()
    async view(@Query('token') token: string) {
      if (!token) throw new ForbiddenException('Missing token');
  
      let link: any;
      try {
        link = await this.magicLinks.validateOrThrow({
          token,
          scope: 'CANDIDATE_JOB_INTEREST',
        });
      } catch (e: any) {
        if (e instanceof MagicLinkError) {
          throw mapMagicLinkErrorToHttpException(e.code, 'view');
        }
        throw new ForbiddenException('Invalid link.');
      }
  
      const recipient = link.outreachRecipientId
        ? await this.prisma.outreachRecipient.findUnique({
            where: { id: link.outreachRecipientId },
          })
        : null;
  
      const batch = recipient
        ? await this.prisma.outreachBatch.findUnique({
            where: { id: recipient.outreachBatchId },
          })
        : null;
  
      return {
        ok: true,
        orderId: link.orderId,
        candidateId: link.candidateId,
        expiresAt: link.expiresAt,
        // For Phase 24 API verification we return the snapshot string.
        // UI will parse/render later.
        messageSnapshot: batch?.messageSnapshot ?? null,
        recipientId: recipient?.id ?? null,
        responseStatus: recipient?.responseStatus ?? null,
      };
    }
  
    /**
     * Deterministic single-submit:
     * - Only allow transition from PENDING -> (INTERESTED|NOT_INTERESTED)
     * - Write-once audit fields
     * - 409 on repeat submits
     * - Clean messaging for expired/invalid links
     */
    @Post('response')
    async respond(
      @Query('token') token: string,
      @Body() dto: CandidateJobInterestResponseDto,
      @Req() req: Request,
    ) {
      if (!token) throw new ForbiddenException('Missing token');

      // Consume token atomically (single canonical path, race-safe)
      let link: any;
      try {
        link = await this.magicLinks.consumeOrThrow({
          token,
          scope: 'CANDIDATE_JOB_INTEREST',
        });
      } catch (e: any) {
        if (e instanceof MagicLinkError) {
          throw mapMagicLinkErrorToHttpException(e.code, 'respond');
        }
        throw new ForbiddenException('Invalid link.');
      }

      if (!link?.outreachRecipientId) {
        throw new ForbiddenException('Invalid magic link (no outreach recipient)');
      }

      const now = new Date();
      const ip =
        (req.headers['x-forwarded-for'] as string) ?? (req.ip as string) ?? null;
      const userAgent = (req.headers['user-agent'] as string) ?? null;

      // Write-once enforcement: only allow transition from PENDING
      const updated = await this.prisma.outreachRecipient.updateMany({
        where: {
          id: link.outreachRecipientId,
          responseStatus: 'PENDING',
        },
        data: {
          responseStatus: dto.responseStatus,
          responseNote: dto.responseNote ?? null,
          respondedAt: now,
          responseMagicLinkId: link.id,
          responseIp: ip,
          responseUserAgent: userAgent,
        },
      });

      if (updated.count !== 1) {
        throw new ConflictException('Response already submitted.');
      }

      // Persist response event (Phase 24.3): one response per (outreachBatchId, candidateId)
      const recipientAfter = await this.prisma.outreachRecipient.findUnique({
        where: { id: link.outreachRecipientId },
        select: { outreachBatchId: true },
      });

      if (recipientAfter?.outreachBatchId) {
        try {
          await this.prisma.outreachResponse.create({
            data: {
              outreachId: recipientAfter.outreachBatchId,
              candidateId: link.candidateId,
              status: dto.responseStatus,
              // respondedAt defaults to now() at DB level
            },
          });
        } catch (e: any) {
          // outreachResponse persistence is best-effort/idempotent and must not affect
          // the public response once recipient status is committed. P2002 (unique constraint)
          // is treated as idempotent (already persisted), and any other error is also
          // swallowed to maintain deterministic behavior: since updateMany succeeded,
          // we always return { ok: true }.
        }
      }

      return { ok: true };
    }
  }
  
