import { PrismaService } from '../../prisma/prisma.service';

const prisma = new PrismaService();

async function main() {
  await prisma.$connect();

  const permissions = [
    { key: 'companies.read' },
    { key: 'companies.write' },
    { key: 'companySignals.read' },
    { key: 'companySignals.write' },

    { key: 'callLogs.read' },
    { key: 'callLogs.write' },

    { key: 'payments.write' },

    { key: 'commissions.export' },
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: {},
      create: { key: p.key },
    });
  }

  const count = await prisma.permission.count();
  // eslint-disable-next-line no-console
  console.log(`✅ permissions seeded (total in DB: ${count})`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
