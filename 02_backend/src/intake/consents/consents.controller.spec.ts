import { Test, TestingModule } from '@nestjs/testing';
import { ConsentsController } from './consents.controller';
import { ConsentsService } from './consents.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ConsentsController', () => {
  let controller: ConsentsController;

  const prismaMock = {} as unknown as PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsentsController],
      providers: [
        ConsentsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    controller = module.get<ConsentsController>(ConsentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

