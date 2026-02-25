import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

/**
 * Normalize websiteUrl: trim whitespace, convert empty string to null
 */
function normalizeWebsiteUrl(value: string | undefined | null): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCustomerDto) {
    const customer = await this.prisma.customer.create({
      data: {
        name: dto.name,
        websiteUrl: normalizeWebsiteUrl(dto.websiteUrl),
      },
      select: {
        id: true,
        name: true,
        websiteUrl: true,
        registrySalespersonId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return customer;
  }
  // Normalize US state to 2-letter code (e.g., "Pennsylvania" -> "PA", "pa" -> "PA")
  private normalizeStateToCode(input: string | null | undefined): string | null {
    if (!input) return null;
    const raw = String(input).trim();
    if (!raw) return null;

    const upper = raw.toUpperCase();
    if (upper.length === 2) return upper;

    const NAME_TO_CODE: Record<string, string> = {
      'ALABAMA':'AL','ALASKA':'AK','ARIZONA':'AZ','ARKANSAS':'AR','CALIFORNIA':'CA',
      'COLORADO':'CO','CONNECTICUT':'CT','DELAWARE':'DE','FLORIDA':'FL','GEORGIA':'GA',
      'HAWAII':'HI','IDAHO':'ID','ILLINOIS':'IL','INDIANA':'IN','IOWA':'IA',
      'KANSAS':'KS','KENTUCKY':'KY','LOUISIANA':'LA','MAINE':'ME','MARYLAND':'MD',
      'MASSACHUSETTS':'MA','MICHIGAN':'MI','MINNESOTA':'MN','MISSISSIPPI':'MS','MISSOURI':'MO',
      'MONTANA':'MT','NEBRASKA':'NE','NEVADA':'NV','NEW HAMPSHIRE':'NH','NEW JERSEY':'NJ',
      'NEW MEXICO':'NM','NEW YORK':'NY','NORTH CAROLINA':'NC','NORTH DAKOTA':'ND','OHIO':'OH',
      'OKLAHOMA':'OK','OREGON':'OR','PENNSYLVANIA':'PA','RHODE ISLAND':'RI','SOUTH CAROLINA':'SC',
      'SOUTH DAKOTA':'SD','TENNESSEE':'TN','TEXAS':'TX','UTAH':'UT','VERMONT':'VT',
      'VIRGINIA':'VA','WASHINGTON':'WA','WEST VIRGINIA':'WV','WISCONSIN':'WI','WYOMING':'WY',
      'DISTRICT OF COLUMBIA':'DC'
    };

    return NAME_TO_CODE[upper] ?? raw;
  }

  async findAll(params: { take?: number; skip?: number; search?: string; sort?: string; order?: string; state?: string } = {}) {
    const take = params.take ?? 25;
    const skip = params.skip ?? 0;

    const rawSearch = (params.search ?? '').trim();
    const search = rawSearch.length > 0 ? rawSearch : undefined;

    const sortKey = (params.sort ?? 'name').trim();
    const sortOrder = ((params.order ?? 'asc').toLowerCase() === 'desc') ? 'desc' : 'asc';

    // Whitelist sortable fields (prevents arbitrary DB field sorting)
    const allowedSort: Record<string, any> = {
      name: { name: sortOrder },
      createdAt: { createdAt: sortOrder },
      updatedAt: { updatedAt: sortOrder },
    };

    const orderBy = allowedSort[sortKey] ?? { name: 'asc' };

    // Search (case-insensitive) across customer name + websiteUrl
    const filters: any = {};

if (search) {
  filters.OR = [
    { name: { contains: search, mode: 'insensitive' as const } },
    { websiteUrl: { contains: search, mode: 'insensitive' as const } },
  ];
}

if (params.state) {
  const raw = String(params.state).trim();
  const upper = raw.toUpperCase();

  const CODE_TO_NAME: Record<string, string> = {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
    CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
    HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
    KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
    MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
    MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
    NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
    OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
    SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
    VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
    DC: 'District of Columbia'
  };

  const full = (upper.length === 2) ? CODE_TO_NAME[upper] : undefined;
  const variants = [raw, upper, full].filter(Boolean) as string[];

  filters.locations = {
    some: {
      OR: variants.map((v) => ({
        state: { equals: v, mode: 'insensitive' as const },
      })),
    },
  };
}

const where = Object.keys(filters).length > 0 ? filters : undefined;const [rows, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy,
        take,
        skip,
        select: {
          id: true,
          name: true,
          websiteUrl: true,
          registrySalespersonId: true,
          registrySalesperson: {
  select: {
    id: true,
    firstName: true,
    lastName: true,
  },
},
          locations: {
            orderBy: { createdAt: 'asc' },
            take: 1,
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
            },
          },
          contacts: {
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
            take: 1,
            select: {
              officePhone: true,
              cellPhone: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    const data = rows.map((row) => {
      const loc = row.locations[0] ?? null;
      const contact = row.contacts[0] ?? null;
      const { locations, contacts, ...rest } = row;

      return {
        ...rest,
        locationCity: loc?.city ?? null,
        locationState: this.normalizeStateToCode(loc?.state) ?? null,
        locationName: loc?.name ?? null,
        mainPhone: contact?.officePhone ?? contact?.cellPhone ?? null,
      };
    });

    return {
      data,
      meta: { total, take, skip },
    };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        websiteUrl: true,
        registrySalespersonId: true,
        registrySalesperson: {
  select: {
    id: true,
    firstName: true,
    lastName: true,
  },
},
        locations: {
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: {
            id: true,
            name: true,
            address1: true,
            address2: true,
            city: true,
            state: true,
            zip: true,
            createdAt: true,
          },
        },
        contacts: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            email: true,
            officePhone: true,
            cellPhone: true,
            isActive: true,
            createdAt: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    // Validate customer exists
    const existing = await this.prisma.customer.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Customer not found');
    }

    const data: { name?: string; websiteUrl?: string | null } = {};
    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }
    if (dto.websiteUrl !== undefined) {
      data.websiteUrl = normalizeWebsiteUrl(dto.websiteUrl);
    }

    return this.prisma.customer.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        websiteUrl: true,
        registrySalespersonId: true,
        registrySalesperson: {
  select: {
    id: true,
    firstName: true,
    lastName: true,
  },
},
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * CUST-REL-01: Assign default salesperson to customer
   * Purpose: Owner of customer profile, default commission attribution fallback
   */
  async assignDefaultSalesperson(customerId: string, salespersonUserId: string | null) {
    // Validate customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Validate salesperson exists if provided
    if (salespersonUserId !== null) {
      const salesperson = await this.prisma.user.findUnique({
        where: { id: salespersonUserId },
        select: { id: true },
      });

      if (!salesperson) {
        throw new BadRequestException('Salesperson user not found');
      }
    }

    return this.prisma.customer.update({
      where: { id: customerId },
      data: { defaultSalespersonUserId: salespersonUserId },
      select: {
        id: true,
        name: true,
        registrySalespersonId: true,
        registrySalesperson: {
  select: {
    id: true,
    firstName: true,
    lastName: true,
  },
},
        updatedAt: true,
      },
    });
  }
  /**
   * Assign registry salesperson (economic ownership)
   */
  async assignRegistrySalesperson(customerId: string, registrySalespersonId: string | null) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (registrySalespersonId !== null) {
      const salesperson = await this.prisma.salesperson.findUnique({
        where: { id: registrySalespersonId },
        select: { id: true },
      });

      if (!salesperson) {
        throw new BadRequestException('Registry salesperson not found');
      }
    }

    return this.prisma.customer.update({
      where: { id: customerId },
      data: { registrySalespersonId },
      select: {
        id: true,
        name: true,
        registrySalespersonId: true,
        registrySalesperson: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        updatedAt: true,
      },
    });
  }
}


