import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const REQUIRED_CONSENT_TYPES = [
  'ELECTRONIC_COMMUNICATIONS',
  'DATA_STORAGE',
  'LOCATION_ARRIVAL_VERIFICATION',
  'SAFETY_VIDEO_TRACKING',
] as const;

type RequiredConsentType = (typeof REQUIRED_CONSENT_TYPES)[number];

@Injectable()
export class EligibilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getDispatchEligibility(candidateId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const reasons: string[] = [];
    let eligible = true;

    // Must have an APPROVED application
    const approvedApplication = await this.prisma.application.findFirst({
      where: {
        candidateId,
        status: 'APPROVED',
      },
      select: { id: true },
    });

    if (!approvedApplication) {
      eligible = false;
      reasons.push('APPLICATION_NOT_APPROVED');
    }

    // For each required consent type, candidate must have accepted the ACTIVE version
    for (const type of REQUIRED_CONSENT_TYPES) {
      const activeVersion = await this.prisma.consentVersion.findFirst({
        where: {
          type,
          isActive: true,
        },
        select: { id: true },
      });

      if (!activeVersion) {
        eligible = false;
        reasons.push(`MISSING_ACTIVE_CONSENT_VERSION_${type}`);
        continue;
      }

      const accepted = await this.prisma.personConsent.findUnique({
        where: {
          candidateId_consentVersionId: {
            candidateId,
            consentVersionId: activeVersion.id,
          },
        },
        select: { id: true },
      });

      if (!accepted) {
        eligible = false;
        reasons.push(`MISSING_CONSENT_${type}`);
      }
    }

    return {
      eligible,
      reasons,
      computedAt: new Date().toISOString(),
    };
  }
}
