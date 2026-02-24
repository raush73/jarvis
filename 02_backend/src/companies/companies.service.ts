import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { normalizeCompanyName } from '../utils/normalize-company-name';
import { normalizeDomain } from '../utils/normalize-domain';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCompanyDto) {
    const normalizedName = normalizeCompanyName(dto.legalName);

    const domain =
      normalizeDomain(dto.domain) ??
      normalizeDomain(dto.website) ??
      null;

    return this.prisma.company.create({
      data: {
        legalName: dto.legalName,
        normalizedName,
        website: dto.website ?? null,
        domain,
      },
    });
  }

  async findAll() {
    return this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
