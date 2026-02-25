/**
 * Austin ZoomInfo Importer (no deps, drift-safe)
 *
 * - Uses PrismaService (adapter-pg) instead of new PrismaClient()
 * - Reads CSV from _imports
 * - Creates/updates Customers, Locations, CustomerContacts
 *
 * Default = DRY RUN (no writes)
 * Use: --commit to write to DB
 */

import * as fs from "fs";
import * as path from "path";
import { PrismaService } from "../src/prisma/prisma.service";

type Row = Record<string, string>;

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

function parseCsv(content: string): Row[] {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map(h => h.trim());
  const rows: Row[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length === 1 && cols[0].trim() === "") continue;

    const row: Row = {};
    for (let c = 0; c < headers.length; c++) {
      row[headers[c]] = (cols[c] ?? "").trim();
    }
    rows.push(row);
  }
  return rows;
}

// RFC4180-ish line parser: supports quoted fields, commas inside quotes, escaped "".
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inQ) {
      if (ch === '"') {
        // escaped quote
        if (i + 1 < line.length && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQ = true;
      } else if (ch === ",") {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
  }
  out.push(cur);
  return out;
}

function norm(s: string | undefined | null): string {
  return (s ?? "").trim();
}

function normState(raw: string): string | null {
  const v = norm(raw);
  if (!v) return null;

  // if already 2 letters, use it
  if (/^[A-Za-z]{2}$/.test(v)) return v.toUpperCase();

  // common full-name mapping (minimal + safe)
  const map: Record<string, string> = {
    "ALABAMA":"AL","ALASKA":"AK","ARIZONA":"AZ","ARKANSAS":"AR","CALIFORNIA":"CA","COLORADO":"CO",
    "CONNECTICUT":"CT","DELAWARE":"DE","FLORIDA":"FL","GEORGIA":"GA","HAWAII":"HI","IDAHO":"ID",
    "ILLINOIS":"IL","INDIANA":"IN","IOWA":"IA","KANSAS":"KS","KENTUCKY":"KY","LOUISIANA":"LA",
    "MAINE":"ME","MARYLAND":"MD","MASSACHUSETTS":"MA","MICHIGAN":"MI","MINNESOTA":"MN","MISSISSIPPI":"MS",
    "MISSOURI":"MO","MONTANA":"MT","NEBRASKA":"NE","NEVADA":"NV","NEW HAMPSHIRE":"NH","NEW JERSEY":"NJ",
    "NEW MEXICO":"NM","NEW YORK":"NY","NORTH CAROLINA":"NC","NORTH DAKOTA":"ND","OHIO":"OH","OKLAHOMA":"OK",
    "OREGON":"OR","PENNSYLVANIA":"PA","RHODE ISLAND":"RI","SOUTH CAROLINA":"SC","SOUTH DAKOTA":"SD",
    "TENNESSEE":"TN","TEXAS":"TX","UTAH":"UT","VERMONT":"VT","VIRGINIA":"VA","WASHINGTON":"WA",
    "WEST VIRGINIA":"WV","WISCONSIN":"WI","WYOMING":"WY",
    "DISTRICT OF COLUMBIA":"DC"
  };

  const key = v.toUpperCase();
  return map[key] ?? v; // if unknown, keep original (don’t destroy data)
}

function locationName(company: string, city: string | null, state: string | null): string {
  const c = norm(company);
  const ci = norm(city);
  const st = norm(state);
  if (ci && st) return `${ci}, ${st}`;
  if (ci) return ci;
  if (st) return st;
  return c || "Primary";
}

function isTruthy(s: string): boolean {
  const v = norm(s).toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "y";
}

async function main() {
  const args = process.argv.slice(2);
  const commit = args.includes("--commit");
  const fileArgIdx = args.findIndex(a => a === "--file");
  const fileOverride = fileArgIdx >= 0 ? args[fileArgIdx + 1] : null;

  loadDotEnvIfMissing();

  const csvPath = fileOverride
    ? path.resolve(process.cwd(), fileOverride)
    : path.resolve(process.cwd(), "_imports", "Austin Contacts Zoom Info.csv");

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV not found: ${csvPath}`);
  }

  const raw = fs.readFileSync(csvPath, "utf8");
  const rows = parseCsv(raw);

  console.log(`CSV: ${csvPath}`);
  console.log(`Rows: ${rows.length}`);
  console.log(`Mode: ${commit ? "COMMIT" : "DRY RUN"}`);

  const prisma = new PrismaService();
  await prisma.$connect();

  try {
    // 1) Find Austin salesperson
    const austin = await prisma.salesperson.findFirst({
      where: { email: { equals: "austin@mw4h.com", mode: "insensitive" }, isActive: true },
    });

    if (!austin) {
      throw new Error(`Salesperson not found: Austin Rauschenberger (isActive=true)`);
    }

    console.log(`Austin Salesperson ID: ${austin.id}`);

    // Stats
    const stats = {
      customersCreated: 0,
      customersUpdated: 0,
      customersOwnerSet: 0,
      customersOwnerSkipped: 0,
      locationsUpserted: 0,
      contactsCreated: 0,
      contactsUpdated: 0,
      contactsSkippedNoName: 0,
      contactsSkippedDuplicateNoKey: 0,
      errors: 0,
    };

    // small in-run dedupe to prevent pounding the same customer repeatedly
    const customerCache = new Map<string, { id: string; registrySalespersonId: string | null }>();

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];

      const company = norm(r["Company"]);
      if (!company) continue;

      const website = norm(r["Website"]) || null;

      // Contact fields
      const firstName = norm(r["First Name"]);
      const lastName = norm(r["Last Name"]);
      const email = norm(r["Email"]) || null;
      const officePhone = norm(r["Direct Phone"]) || null;
      const cellPhone = norm(r["Mobile Phone"]) || null;
      const jobTitle = norm(r["Job Title"]) || null;

      // Location fields
      const street = norm(r["Street"]) || null;
      const city = norm(r["City"]) || null;
      const state = normState(r["Province/State"]);
      const zip = norm(r["Postal/Zip"]) || null;

      // 2) Customer find/create
      let cust = customerCache.get(company.toLowerCase());

      if (!cust) {
        const existing = await prisma.customer.findFirst({
          where: { name: { equals: company, mode: "insensitive" } },
          select: { id: true, registrySalespersonId: true, websiteUrl: true },
        });

        if (!existing) {
          if (commit) {
            const created = await prisma.customer.create({
              data: {
                name: company,
                websiteUrl: website,
                registrySalespersonId: austin.id,
              },
              select: { id: true, registrySalespersonId: true },
            });
            cust = created;
            stats.customersCreated++;
            stats.customersOwnerSet++;
          } else {
            // dry-run fake id marker
            cust = { id: "(dry-run)", registrySalespersonId: austin.id };
            stats.customersCreated++;
            stats.customersOwnerSet++;
          }
        } else {
          cust = { id: existing.id, registrySalespersonId: existing.registrySalespersonId };

          // Update website if missing and we have one; set owner only if blank (do not overwrite existing owner)
          const needWebsite = !existing.websiteUrl && website;
          const needOwner = !existing.registrySalespersonId;

          if (needWebsite || needOwner) {
            if (commit) {
              const updated = await prisma.customer.update({
                where: { id: existing.id },
                data: {
                  ...(needWebsite ? { websiteUrl: website } : {}),
                  ...(needOwner ? { registrySalespersonId: austin.id } : {}),
                },
                select: { id: true, registrySalespersonId: true },
              });
              cust = updated;
            }

            stats.customersUpdated++;
            if (needOwner) stats.customersOwnerSet++;
          } else {
            stats.customersOwnerSkipped++;
          }
        }

        customerCache.set(company.toLowerCase(), cust);
      }

      // If dry-run, skip downstream writes but still count shape
      const customerId = cust.id;

      // 3) Location upsert (primary-ish)
      const locName = locationName(company, city, state);
      if (commit && customerId !== "(dry-run)") {
        await prisma.location.upsert({
          where: { customerId_name: { customerId, name: locName } },
          create: {
            customerId,
            name: locName,
            address1: street,
            city,
            state: state ?? undefined,
            zip,
          },
          update: {
            address1: street,
            city,
            state: state ?? undefined,
            zip,
          },
        });
      }
      stats.locationsUpserted++;

      // 4) Contact upsert
      if (!firstName && !lastName) {
        stats.contactsSkippedNoName++;
        continue;
      }

      // Prefer email as key; else fallback composite-ish
      if (commit && customerId !== "(dry-run)") {
        let existingContactId: string | null = null;

        if (email) {
          const existingContact = await prisma.customerContact.findFirst({
            where: {
              customerId,
              email: { equals: email, mode: "insensitive" },
            },
            select: { id: true },
          });
          existingContactId = existingContact?.id ?? null;
        } else {
          // no email: attempt match on name + (officePhone or cellPhone)
          const phoneKey = officePhone || cellPhone;
          if (!phoneKey) {
            // No stable key; skip to avoid dup spam
            stats.contactsSkippedDuplicateNoKey++;
            continue;
          }

          const existingContact = await prisma.customerContact.findFirst({
            where: {
              customerId,
              firstName: { equals: firstName, mode: "insensitive" },
              lastName: { equals: lastName, mode: "insensitive" },
              OR: [
                { officePhone: phoneKey },
                { cellPhone: phoneKey },
              ],
            },
            select: { id: true },
          });
          existingContactId = existingContact?.id ?? null;
        }

        if (!existingContactId) {
          await prisma.customerContact.create({
            data: {
              customerId,
              firstName: firstName || "Unknown",
              lastName: lastName || "Unknown",
              email,
              officePhone,
              cellPhone,
              jobTitle,
            },
          });
          stats.contactsCreated++;
        } else {
          await prisma.customerContact.update({
            where: { id: existingContactId },
            data: {
              email,
              officePhone,
              cellPhone,
              jobTitle,
              // Keep first/last as-is unless empty; don’t rewrite names unexpectedly
              ...(firstName ? { firstName } : {}),
              ...(lastName ? { lastName } : {}),
            },
          });
          stats.contactsUpdated++;
        }
      } else {
        // dry-run counts: assume create unless email duplicates are seen in-run
        stats.contactsCreated++;
      }

      if ((i + 1) % 25 === 0) {
        console.log(`Progress: ${i + 1}/${rows.length}`);
      }
    }

    console.log("---- DONE ----");
    console.log(JSON.stringify(stats, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("IMPORT FAILED:", e?.message ?? e);
  process.exit(1);
});