import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const urlRaw = process.env.DATABASE_URL;
    if (!urlRaw) {
      throw new Error(
        'DATABASE_URL is required (PostgreSQL). Set it in your environment or .env',
      );
    }

    // DEV schema support:
    // When using the pg driver adapter, Prisma's `schema=` query param is not reliably honored.
    // Force the driver to set search_path using pg `options=-c search_path=...` if schema= is present.
    const url = (() => {
      const m = urlRaw.match(/[?&]schema=([^&]+)/);
      if (!m) return urlRaw;
      if (/[?&]options=/.test(urlRaw)) return urlRaw;

      const schema = decodeURIComponent(m[1]);
      const sep = urlRaw.includes('?') ? '&' : '?';
      return `${urlRaw}${sep}options=-c%20search_path%3D${encodeURIComponent(schema)}`;
    })();

    // AWS RDS Postgres typically requires SSL; without it, pg_hba.conf rejects the connection.
    const adapter = new PrismaPg({
      connectionString: url,
      ssl: { rejectUnauthorized: false },
    });

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
