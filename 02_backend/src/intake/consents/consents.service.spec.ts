import { Test, TestingModule } from '@nestjs/testing';
import { ConsentsService } from './consents.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ConsentsService', () => {
  let service: ConsentsService;
  let mockPrismaService: any;

  beforeEach(async () => {
    mockPrismaService = {
      consentVersion: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findMany: jest.fn(),
      },
      personConsent: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
      candidate: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsentsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ConsentsService>(ConsentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('activateVersion', () => {
    it('should activate version and deactivate others of same type in transaction', async () => {
      const dto = { consentVersionId: 'version-1' };
      const targetVersion = { id: 'version-1', type: 'ELECTRONIC_COMMUNICATIONS' };

      mockPrismaService.consentVersion.findUnique.mockResolvedValue(targetVersion);

      mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          consentVersion: {
            updateMany: mockPrismaService.consentVersion.updateMany,
            update: mockPrismaService.consentVersion.update,
          },
        };
        return callback(tx);
      });

      mockPrismaService.consentVersion.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.consentVersion.update.mockResolvedValue({ ...targetVersion, isActive: true });

      const result = await service.activateVersion(dto as any);

      expect(mockPrismaService.consentVersion.updateMany).toHaveBeenCalledWith({
        where: { type: targetVersion.type, isActive: true },
        data: { isActive: false },
      });

      expect(mockPrismaService.consentVersion.update).toHaveBeenCalledWith({
        where: { id: dto.consentVersionId },
        data: { isActive: true },
      });

      expect(result.isActive).toBe(true);
    });

    it('should throw NotFoundException if consent version not found', async () => {
      mockPrismaService.consentVersion.findUnique.mockResolvedValue(null);

      await expect(
        service.activateVersion({ consentVersionId: 'missing' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('acceptConsent', () => {
    it('should return existing consent if already accepted (idempotent)', async () => {
      const existing = { id: 'pc-1' };

      mockPrismaService.candidate.findUnique.mockResolvedValue({ id: 'cand-1' });
      mockPrismaService.consentVersion.findUnique.mockResolvedValue({ id: 'ver-1' });
      mockPrismaService.personConsent.findUnique.mockResolvedValue(existing);

      const result = await service.acceptConsent({
        candidateId: 'cand-1',
        consentVersionId: 'ver-1',
      } as any);

      expect(result).toEqual(existing);
    });

    it('should create new consent if not already accepted', async () => {
      mockPrismaService.candidate.findUnique.mockResolvedValue({ id: 'cand-1' });
      mockPrismaService.consentVersion.findUnique.mockResolvedValue({ id: 'ver-1' });
      mockPrismaService.personConsent.findUnique.mockResolvedValue(null);
      mockPrismaService.personConsent.create.mockResolvedValue({ id: 'pc-1' });

      const result = await service.acceptConsent({
        candidateId: 'cand-1',
        consentVersionId: 'ver-1',
      } as any);

      expect(result.id).toBe('pc-1');
    });

    it('should throw NotFoundException if candidate does not exist', async () => {
      mockPrismaService.candidate.findUnique.mockResolvedValue(null);

      await expect(
        service.acceptConsent({ candidateId: 'missing', consentVersionId: 'ver-1' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if consent version does not exist', async () => {
      mockPrismaService.candidate.findUnique.mockResolvedValue({ id: 'cand-1' });
      mockPrismaService.consentVersion.findUnique.mockResolvedValue(null);

      await expect(
        service.acceptConsent({ candidateId: 'cand-1', consentVersionId: 'missing' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
