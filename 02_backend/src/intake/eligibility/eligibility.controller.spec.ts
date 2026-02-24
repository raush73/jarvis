import { Test, TestingModule } from '@nestjs/testing';
import { EligibilityController } from './eligibility.controller';
import { EligibilityService } from './eligibility.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('EligibilityController', () => {
  let controller: EligibilityController;

  const prismaMock = {} as unknown as PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EligibilityController],
      providers: [
        EligibilityService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    controller = module.get<EligibilityController>(EligibilityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

