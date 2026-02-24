import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ReviewApplicationDto } from './dto/review-application.dto';

type ApplicationStatusStr = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates an Application in DRAFT status.
   * If one already exists for the candidate, returns the existing one (no duplicates).
   */
  async create(dto: CreateApplicationDto, userId: string) {
    // userId is intentionally unused here (kept for signature consistency + future audit hooks)
    void userId;

    // Validate candidate exists
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: dto.candidateId },
      select: { id: true },
    });
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    // Check if application already exists
    const existing = await this.prisma.application.findFirst({
      where: { candidateId: dto.candidateId },
      select: { id: true, status: true },
    });

    if (existing) {
      return existing;
    }

    // Create new application in DRAFT status
    return this.prisma.application.create({
      data: {
        candidateId: dto.candidateId,
        status: 'DRAFT',
      },
    });
  }

  /**
   * Updates an application ONLY when status=DRAFT.
   */
  async update(id: string, dto: UpdateApplicationDto) {
    void dto;

    const existing = await this.prisma.application.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new NotFoundException('Application not found');
    }

    if ((existing.status as ApplicationStatusStr) !== 'DRAFT') {
      throw new BadRequestException('Application can only be updated when status is DRAFT');
    }

    // For now, UpdateApplicationDto is empty, but this maintains the pattern
    return this.prisma.application.update({
      where: { id },
      data: {},
    });
  }

  /**
   * Submits an application: DRAFT -> SUBMITTED.
   * Sets submittedAt and blocks if already submitted/reviewed.
   */
  async submit(id: string) {
    const existing = await this.prisma.application.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new NotFoundException('Application not found');
    }

    if ((existing.status as ApplicationStatusStr) !== 'DRAFT') {
      throw new BadRequestException('Application can only be submitted from DRAFT status');
    }

    return this.prisma.application.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });
  }

  /**
   * Approves an application: SUBMITTED -> APPROVED.
   * Sets reviewedAt, reviewedByUserId, and optional reviewNote.
   */
  async approve(id: string, userId: string, dto: ReviewApplicationDto) {
    const existing = await this.prisma.application.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new NotFoundException('Application not found');
    }

    if ((existing.status as ApplicationStatusStr) !== 'SUBMITTED') {
      throw new BadRequestException('Application can only be approved from SUBMITTED status');
    }

    return this.prisma.application.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedByUserId: userId,
        reviewNote: dto.reviewNote ?? null,
      },
    });
  }

  /**
   * Rejects an application: SUBMITTED -> REJECTED.
   * Sets reviewedAt, reviewedByUserId, and optional reviewNote.
   */
  async reject(id: string, userId: string, dto: ReviewApplicationDto) {
    const existing = await this.prisma.application.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new NotFoundException('Application not found');
    }

    if ((existing.status as ApplicationStatusStr) !== 'SUBMITTED') {
      throw new BadRequestException('Application can only be rejected from SUBMITTED status');
    }

    return this.prisma.application.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedByUserId: userId,
        reviewNote: dto.reviewNote ?? null,
      },
    });
  }

  /**
   * Gets an application by ID.
   */
  async findOne(id: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        candidate: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  /**
   * Lists applications with optional status filter.
   */
  async findAll(status?: ApplicationStatusStr) {
    return this.prisma.application.findMany({
      where: status ? { status } : {},
      include: {
        candidate: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
