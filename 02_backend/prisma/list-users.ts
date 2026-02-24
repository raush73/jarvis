import 'dotenv/config';
import { PrismaService } from '../src/prisma/prisma.service';

async function main() {
  const prisma = new PrismaService();
  await prisma.$connect();

  const users = await prisma.user.findMany({
    select: { id: true, email: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  console.log('--- USERS (latest 20) ---');
  for (const u of users) {
    console.log(`${u.id}  |  ${u.email}  |  ${u.createdAt.toISOString()}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
