import { Test, TestingModule } from '@nestjs/testing';
import { EligibilityService } from './eligibility.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('EligibilityService', () => {
  let service: EligibilityService;
  let mockPrismaService: any;

  beforeEach(async () => {
    mockPrismaService = {
      candidate: {
        findUnique: jest.fn(),
      },
      application: {
        findFirst: jest.fn(),
      },
      consentVersion: {
        findFirst: jest.fn(),
      },
      personConsent: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EligibilityService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<EligibilityService>(EligibilityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDispatchEligibility', () => {
    it('should return eligible=true when application approved and all consents accepted', async () => {
      const candidateId = 'cand-1';

      mockPrismaService.candidate.findUnique.mockResolvedValue({ id: candidateId });

      // approved application exists
      mockPrismaService.application.findFirst.mockResolvedValue({ id: 'app-1' });

      // For each consent type, there is an active version and it is accepted
      const activeByType: Record<string, string> = {
        ELECTRONIC_COMMUNICATIONS: 'cv-1',
        DATA_STORAGE: 'cv-2',
        LOCATION_ARRIVAL_VERIFICATION: 'cv-3',
        SAFETY_VIDEO_TRACKING: 'cv-4',
      };

      mockPrismaService.consentVersion.findFirst.mockImplementation(async ({ where }: any) => {
        const id = activeByType[where.type];
        return id ? { id } : null;
      });

      mockPrismaService.personConsent.findUnique.mockImplementation(async ({ where }: any) => {
        const consentVersionId = where.candidateId_consentVersionId.consentVersionId;
        return consentVersionId ? { id: `pc-${consentVersionId}` } : null;
      });

      const result = await service.getDispatchEligibility(candidateId);

      expect(result.eligible).toBe(true);
      expect(result.reasons).toEqual([]);
      expect(typeof result.computedAt).toBe('string');
    });

    it('should return APPLICATION_NOT_APPROVED when no approved application', async () => {
      const candidateId = 'cand-1';

      mockPrismaService.candidate.findUnique.mockResolvedValue({ id: candidateId });

      // no approved application
      mockPrismaService.application.findFirst.mockResolvedValue(null);

      // no active consent versions (so we also get missing-active reasons)
      mockPrismaService.consentVersion.findFirst.mockResolvedValue(null);

      const result = await service.getDispatchEligibility(candidateId);

      expect(result.eligible).toBe(false);
      expect(result.reasons).toContain('APPLICATION_NOT_APPROVED');
      expect(result.reasons.some((r: string) => r.startsWith('MISSING_ACTIVE_CONSENT_VERSION_'))).toBe(true);
    });

    it('should return MISSING_CONSENT_* when required consents not accepted', async () => {
      const candidateId = 'cand-1';

      mockPrismaService.candidate.findUnique.mockResolvedValue({ id: candidateId });

      // approved application exists
      mockPrismaService.application.findFirst.mockResolvedValue({ id: 'app-1' });

      // active versions exist for each type
      const activeByType: Record<string, string> = {
        ELECTRONIC_COMMUNICATIONS: 'cv-1',
        DATA_STORAGE: 'cv-2',
        LOCATION_ARRIVAL_VERIFICATION: 'cv-3',
        SAFETY_VIDEO_TRACKING: 'cv-4',
      };

      mockPrismaService.consentVersion.findFirst.mockImplementation(async ({ where }: any) => {
        const id = activeByType[where.type];
        return id ? { id } : null;
      });

      // none accepted
      mockPrismaService.personConsent.findUnique.mockResolvedValue(null);

      const result = await service.getDispatchEligibility(candidateId);

      expect(result.eligible).toBe(false);
      expect(result.reasons.some((r: string) => r.startsWith('MISSING_CONSENT_'))).toBe(true);
    });

    it('should throw NotFoundException when candidate does not exist', async () => {
      mockPrismaService.candidate.findUnique.mockResolvedValue(null);
      await expect(service.getDispatchEligibility('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
