import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsService } from './applications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let mockPrismaService: any;

  beforeEach(async () => {
    mockPrismaService = {
      candidate: {
        findUnique: jest.fn(),
      },
      application: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new application in DRAFT status', async () => {
      const dto = { candidateId: 'candidate-1' };
      const userId = 'user-1';

      mockPrismaService.candidate.findUnique.mockResolvedValue({ id: 'candidate-1' });
      mockPrismaService.application.findFirst.mockResolvedValue(null);
      mockPrismaService.application.create.mockResolvedValue({
        id: 'app-1',
        candidateId: 'candidate-1',
        status: 'DRAFT',
      });

      const result = await service.create(dto as any, userId);

      expect(mockPrismaService.application.create).toHaveBeenCalledWith({
        data: {
          candidateId: 'candidate-1',
          status: 'DRAFT',
        },
      });
      expect(result.status).toBe('DRAFT');
    });

    it('should return existing application if one already exists', async () => {
      const dto = { candidateId: 'candidate-1' };
      const userId = 'user-1';
      const existing = { id: 'app-1', status: 'DRAFT' };

      mockPrismaService.candidate.findUnique.mockResolvedValue({ id: 'candidate-1' });
      mockPrismaService.application.findFirst.mockResolvedValue(existing);

      const result = await service.create(dto as any, userId);

      expect(mockPrismaService.application.create).not.toHaveBeenCalled();
      expect(result).toEqual(existing);
    });

    it('should throw NotFoundException if candidate does not exist', async () => {
      const dto = { candidateId: 'candidate-404' };
      const userId = 'user-1';

      mockPrismaService.candidate.findUnique.mockResolvedValue(null);

      await expect(service.create(dto as any, userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update application when status is DRAFT', async () => {
      const id = 'app-1';
      const dto = {};

      mockPrismaService.application.findUnique.mockResolvedValue({
        id: 'app-1',
        status: 'DRAFT',
      });
      mockPrismaService.application.update.mockResolvedValue({
        id: 'app-1',
        status: 'DRAFT',
      });

      const result = await service.update(id, dto as any);

      expect(mockPrismaService.application.update).toHaveBeenCalledWith({
        where: { id },
        data: {},
      });
      expect(result.id).toBe('app-1');
    });

    it('should throw BadRequestException when updating non-DRAFT application', async () => {
      const id = 'app-1';
      const dto = {};

      mockPrismaService.application.findUnique.mockResolvedValue({
        id: 'app-1',
        status: 'SUBMITTED',
      });

      await expect(service.update(id, dto as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('submit', () => {
    it('should submit application from DRAFT to SUBMITTED', async () => {
      const id = 'app-1';

      mockPrismaService.application.findUnique.mockResolvedValue({
        id: 'app-1',
        status: 'DRAFT',
      });
      mockPrismaService.application.update.mockResolvedValue({
        id: 'app-1',
        status: 'SUBMITTED',
        submittedAt: new Date(),
      });

      const result = await service.submit(id);

      expect(mockPrismaService.application.update).toHaveBeenCalledWith({
        where: { id },
        data: {
          status: 'SUBMITTED',
          submittedAt: expect.any(Date),
        },
      });
      expect(result.status).toBe('SUBMITTED');
    });

    it('should throw BadRequestException when submitting non-DRAFT application', async () => {
      const id = 'app-1';

      mockPrismaService.application.findUnique.mockResolvedValue({
        id: 'app-1',
        status: 'SUBMITTED',
      });

      await expect(service.submit(id)).rejects.toThrow(BadRequestException);
    });
  });

  describe('approve', () => {
    it('should approve application and set reviewedByUserId + reviewedAt', async () => {
      const id = 'app-1';
      const userId = 'user-1';
      const dto = { reviewNote: 'ok' };

      mockPrismaService.application.findUnique.mockResolvedValue({
        id: 'app-1',
        status: 'SUBMITTED',
      });
      mockPrismaService.application.update.mockResolvedValue({
        id: 'app-1',
        status: 'APPROVED',
        reviewedByUserId: userId,
        reviewedAt: new Date(),
        reviewNote: 'ok',
      });

      const result = await service.approve(id, userId, dto as any);

      expect(mockPrismaService.application.update).toHaveBeenCalledWith({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedAt: expect.any(Date),
          reviewedByUserId: userId,
          reviewNote: 'ok',
        },
      });
      expect(result.status).toBe('APPROVED');
    });

    it('should throw BadRequestException when approving non-SUBMITTED application', async () => {
      const id = 'app-1';
      const userId = 'user-1';
      const dto = {};

      mockPrismaService.application.findUnique.mockResolvedValue({
        id: 'app-1',
        status: 'DRAFT',
      });

      await expect(service.approve(id, userId, dto as any)).rejects.toThrow(BadRequestException);
    });
  });
});
