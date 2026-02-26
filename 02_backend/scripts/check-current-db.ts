import * as fs from "fs";
import * as path from "path";
import { PrismaService } from "../src/prisma/prisma.service";

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
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

async function main() {
  loadDotEnvIfMissing();

  const prisma = new PrismaService();
  await prisma.$connect();

  const result = await prisma.$queryRawUnsafe(
    "select current_database() as db, current_schema() as schema"
  );

  console.log(result);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});