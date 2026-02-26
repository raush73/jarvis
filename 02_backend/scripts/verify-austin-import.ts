import { PrismaService } from "../src/prisma/prisma.service";
import * as fs from "fs";
import * as path from "path";

function loadDotEnvIfMissing() {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) return;
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  }
}

async function main() {
  loadDotEnvIfMissing();
  const prisma = new PrismaService();
  await prisma.$connect();

  const austin = await prisma.salesperson.findFirst({
    where: { email: { equals: "austin@mw4h.com", mode: "insensitive" } },
    select: { id: true, firstName: true, lastName: true, email: true },
  });

  const customersOwnedByAustin = austin
    ? await prisma.customer.count({ where: { registrySalespersonId: austin.id } })
    : null;

  const customersTotal = await prisma.customer.count();
  const contactsTotal = await prisma.customerContact.count();
  const locationsTotal = await prisma.location.count();

  console.log(JSON.stringify({
    austin,
    customersOwnedByAustin,
    customersTotal,
    contactsTotal,
    locationsTotal
  }, null, 2));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});