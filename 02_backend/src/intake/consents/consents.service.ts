import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConsentVersionDto } from './dto/create-consent-version.dto';
import { SetConsentActiveDto } from './dto/set-consent-active.dto';
import { AcceptConsentDto } from './dto/accept-consent.dto';
import { ConsentType } from '@prisma/client';

@Injectable()
export class ConsentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a ConsentVersion.
   * Enforces unique [type, version].
   */
  async createVersion(dto: CreateConsentVersionDto) {
    // Check if [type, version] already exists
    const existing = await this.prisma.consentVersion.findUnique({
      where: {
        type_version: {
          type: dto.type,
          version: dto.version,
        },
      },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException(
        `ConsentVersion with type ${dto.type} and version ${dto.version} already exists`,
      );
    }

    // If setting as active, deactivate others of the same type in a transaction
    if (dto.isActive) {
      return this.prisma.$transaction(async (tx) => {
        // Deactivate all other versions of the same type
        await tx.consentVersion.updateMany({
          where: {
            type: dto.type,
            isActive: true,
          },
          data: {
            isActive: false,
          },
        });

        // Create the new version
        return tx.consentVersion.create({
          data: {
            type: dto.type,
            version: dto.version,
            title: dto.title,
            content: dto.content,
            isActive: true,
          },
        });
      });
    }

    // Create inactive version
    return this.prisma.consentVersion.create({
      data: {
        type: dto.type,
        version: dto.version,
        title: dto.title,
        content: dto.content,
        isActive: false,
      },
    });
  }

  /**
   * Activates a ConsentVersion by ID or by [type, version].
   * Sets isActive=true for the target version and isActive=false for all other versions of the same type (transaction).
   */
  async activateVersion(dto: SetConsentActiveDto) {
    let targetVersion;

    if (dto.consentVersionId) {
      targetVersion = await this.prisma.consentVersion.findUnique({
        where: { id: dto.consentVersionId },
        select: { id: true, type: true },
      });

      if (!targetVersion) {
        throw new NotFoundException('ConsentVersion not found');
      }
    } else if (dto.type && dto.version !== undefined) {
      targetVersion = await this.prisma.consentVersion.findUnique({
        where: {
          type_version: {
            type: dto.type,
            version: dto.version,
          },
        },
        select: { id: true, type: true },
      });

      if (!targetVersion) {
        throw new NotFoundException('ConsentVersion not found');
      }
    } else {
      throw new BadRequestException('Must provide either consentVersionId or [type, version]');
    }

    // Transaction: deactivate all others of the same type, activate the target
    return this.prisma.$transaction(async (tx) => {
      // Deactivate all other versions of the same type
      await tx.consentVersion.updateMany({
        where: {
          type: targetVersion.type,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });

      // Activate the target version
      return tx.consentVersion.update({
        where: { id: targetVersion.id },
        data: { isActive: true },
      });
    });
  }

  /**
   * Returns active versions by type (only isActive=true).
   */
  async getActiveVersions() {
    const versions = await this.prisma.consentVersion.findMany({
      where: { isActive: true },
      orderBy: [{ type: 'asc' }, { version: 'desc' }],
    });

    // Group by type (should only be one active per type, but return all for safety)
    const byType: Record<ConsentType, typeof versions> = {} as any;
    for (const version of versions) {
      if (!byType[version.type]) {
        byType[version.type] = [];
      }
      byType[version.type].push(version);
    }

    return byType;
  }

  /**
   * Records PersonConsent for candidateId + consentVersionId.
   * Must be idempotent: if already accepted, return existing (no error).
   */
  async acceptConsent(dto: AcceptConsentDto) {
    // Validate candidate exists
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: dto.candidateId },
      select: { id: true },
    });
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    // Validate consent version exists
    const consentVersion = await this.prisma.consentVersion.findUnique({
      where: { id: dto.consentVersionId },
      select: { id: true },
    });
    if (!consentVersion) {
      throw new NotFoundException('ConsentVersion not found');
    }

    // Check if already accepted (idempotent)
    const existing = await this.prisma.personConsent.findUnique({
      where: {
        candidateId_consentVersionId: {
          candidateId: dto.candidateId,
          consentVersionId: dto.consentVersionId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    // Create new PersonConsent
    return this.prisma.personConsent.create({
      data: {
        candidateId: dto.candidateId,
        consentVersionId: dto.consentVersionId,
        acceptedFromIp: dto.ip ?? null,
        acceptedFromUserAgent: dto.userAgent ?? null,
      },
    });
  }

  /**
   * Lists accepted consents for a candidate (include ConsentVersion.type/version/title).
   */
  async getCandidateConsents(candidateId: string) {
    // Validate candidate exists
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true },
    });
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    return this.prisma.personConsent.findMany({
      where: { candidateId },
      include: {
        consentVersion: {
          select: {
            id: true,
            type: true,
            version: true,
            title: true,
            isActive: true,
          },
        },
      },
      orderBy: { acceptedAt: 'desc' },
    });
  }
}

