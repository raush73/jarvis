import { Test, TestingModule } from '@nestjs/testing';
import { CallTargetsController } from './call-targets.controller';
import { CallTargetsService } from './call-targets.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CallTargetsController', () => {
  let controller: CallTargetsController;

  const prismaMock = {} as unknown as PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CallTargetsController],
      providers: [
        CallTargetsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    controller = module.get<CallTargetsController>(CallTargetsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
