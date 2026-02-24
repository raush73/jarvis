import { Test, TestingModule } from '@nestjs/testing';
import { OutreachController } from './outreach.controller';
import { OutreachService } from './outreach.service';
import { PrismaService } from '../prisma/prisma.service';
import { MagicLinksService } from '../magic-links/magic-links.service';

describe('OutreachController', () => {
  let controller: OutreachController;

  const prismaMock = {} as unknown as PrismaService;
  const magicLinksMock = {} as unknown as MagicLinksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OutreachController],
      providers: [
        OutreachService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: MagicLinksService, useValue: magicLinksMock },
      ],
    }).compile();

    controller = module.get<OutreachController>(OutreachController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
