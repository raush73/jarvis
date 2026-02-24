import { Injectable, BadRequestException } from "@nestjs/common";
import { OutreachMessageDto } from "./dto/outreach-message.dto";
import { isEligibleForOutreach } from "./outreach.eligibility";
import { generateMagicLink } from "./magic-link.util"; // Legacy: kept for backward compatibility in send() method
import { PrismaService } from "../prisma/prisma.service";
import { MagicLinksService } from "../magic-links/magic-links.service";
import { CreateOutreachBatchDto } from "./dto/create-outreach-batch.dto";

@Injectable()
export class OutreachService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly magicLinks: MagicLinksService,
  ) {}

  /**
   * Phase 23 legacy behavior (kept as-is): returns computed payload and a short-lived link.
   * NOTE: Phase 24 uses the new MagicLinksService + DB persistence instead.
   */
  async send(dto: OutreachMessageDto) {
    const eligible = isEligibleForOutreach({
      candidateId: dto.candidateId,
      status: "UNKNOWN",
    });

    if (!eligible) {
      return { ok: false, skipped: true, reason: "NOT_ELIGIBLE" };
    }

    const link = generateMagicLink(
      {
        scope: "outreach",
        candidateId: dto.candidateId,
        orderId: dto.opportunity.orderId,
      },
      60, // TTL minutes (Phase 23 default; will be configurable later)
    );

    // For Phase 23.6, we return the computed payload that would be sent.
    // Actual SMS/Email dispatch wiring happens next, via IntegrationsModule.
    return {
      ok: true,
      channel: dto.channel,
      candidateId: dto.candidateId,
      opportunity: dto.opportunity,
      magicLink: link,
    };
  }

  /**
   * Phase 24:
   * Create OutreachBatch + OutreachRecipients + MagicLinks (multi-open, single-submit, 7-day default).
   * This method only persists deterministic records; sending happens in a later step.
   */
  async createBatchForOrder(params: {
    orderId: string;
    createdByUserId: string;
    dto: CreateOutreachBatchDto;
  }) {
    const { orderId, createdByUserId, dto } = params;

    if (!dto.candidateIds?.length) {
      throw new BadRequestException("candidateIds is required");
    }
    if (!dto.channels?.sms && !dto.channels?.email) {
      throw new BadRequestException("At least one channel must be selected");
    }

    const batch = await this.prisma.outreachBatch.create({
      data: {
        orderId,
        createdByUserId,
        sourceType: dto.sourceType,
        channels: { sms: dto.channels.sms, email: dto.channels.email },
        templateKey: dto.templateKey ?? null,
        messageSnapshot: dto.messageSnapshot,
      },
      select: { id: true, orderId: true, createdAt: true },
    });

    const recipients = await Promise.all(
      dto.candidateIds.map(async (candidateId) => {
        const recipient = await this.prisma.outreachRecipient.create({
          data: {
            outreachBatchId: batch.id,
            candidateId,
            phone: null,
            email: null,
            sendStatusSms: dto.channels.sms ? "PENDING" : "SKIPPED",
            sendStatusEmail: dto.channels.email ? "PENDING" : "SKIPPED",
            responseStatus: "PENDING",
          },
          select: { id: true, candidateId: true },
        });

        // 7-day default for outreach (LOCKED)
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const link = await this.magicLinks.createMagicLink({
          scope: "CANDIDATE_JOB_INTEREST",
          orderId,
          candidateId,
          outreachRecipientId: recipient.id,
          expiresAt,
        });

        await this.prisma.outreachRecipient.update({
          where: { id: recipient.id },
          data: { magicLinkId: link.id },
        });

        return {
          recipientId: recipient.id,
          candidateId,
          magicLinkToken: link.token,
          expiresAt: link.expiresAt,
        };
      }),
    );

    return {
      batchId: batch.id,
      orderId: batch.orderId,
      createdAt: batch.createdAt,
      recipients,
    };
  }
}
