import { Test, TestingModule } from '@nestjs/testing';
import { CallTargetsService } from './call-targets.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CallTargetsService', () => {
  let service: CallTargetsService;

  const prismaMock = {
    // Add model mocks here only if a test needs them later.
  } as unknown as PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CallTargetsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<CallTargetsService>(CallTargetsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

