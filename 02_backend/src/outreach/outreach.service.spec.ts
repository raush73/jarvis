import { Test, TestingModule } from '@nestjs/testing';
import { OutreachService } from './outreach.service';
import { PrismaService } from '../prisma/prisma.service';
import { MagicLinksService } from '../magic-links/magic-links.service';

describe('OutreachService', () => {
  let service: OutreachService;

  const prismaMock = {} as unknown as PrismaService;
  const magicLinksMock = {} as unknown as MagicLinksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutreachService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: MagicLinksService, useValue: magicLinksMock },
      ],
    }).compile();

    service = module.get<OutreachService>(OutreachService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
