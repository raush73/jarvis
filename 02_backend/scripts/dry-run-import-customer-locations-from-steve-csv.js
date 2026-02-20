/**
 * DRY-RUN importer:
 * - Reads: ../../data_import/steve/steves_customers_2026_02.csv
 * - Matches customers by exact Customer.name == CSV Company
 * - Computes what Location updates would be applied (no DB writes)
 *
 * Constraints per request:
 * - Do NOT modify Prisma schema
 * - Do NOT create new models
 * - Do NOT create migrations
 * - Do NOT modify defaultSalespersonId
 * - Do NOT apply changes yet
 */

require("dotenv/config");
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

function buildPgConnectionString(urlRaw) {
  if (!urlRaw) {
    throw new Error(
      "DATABASE_URL is required (PostgreSQL). Set it in your environment or .env"
    );
  }

  // When using the pg driver adapter, Prisma's `schema=` query param is not reliably honored.
  // Force the driver to set search_path using pg `options=-c search_path=...` if schema= is present.
  const m = urlRaw.match(/[?&]schema=([^&]+)/);
  if (!m) return urlRaw;
  if (/[?&]options=/.test(urlRaw)) return urlRaw;

  const schema = decodeURIComponent(m[1]);
  const sep = urlRaw.includes("?") ? "&" : "?";
  return `${urlRaw}${sep}options=-c%20search_path%3D${encodeURIComponent(schema)}`;
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: buildPgConnectionString(process.env.DATABASE_URL),
    ssl: { rejectUnauthorized: false },
  }),
});

function norm(value) {
  const v = typeof value === "string" ? value.trim() : "";
  return v.length ? v : null;
}

// Minimal CSV parser with quoted field support.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    // Skip completely empty trailing rows
    if (row.length === 1 && (row[0] ?? "").trim() === "") {
      row = [];
      return;
    }
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        const next = text[i + 1];
        if (next === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      continue;
    }
    if (c === ",") {
      pushField();
      continue;
    }
    if (c === "\n") {
      pushField();
      pushRow();
      continue;
    }
    if (c === "\r") {
      continue;
    }
    field += c;
  }

  // last field/row
  pushField();
  pushRow();

  return rows;
}

function headerIndexMap(headers) {
  const map = new Map();
  headers.forEach((h, idx) => {
    map.set((h ?? "").trim().toLowerCase(), idx);
  });
  return map;
}

function requireCol(idxMap, name) {
  const idx = idxMap.get(name.toLowerCase());
  if (typeof idx !== "number") {
    const available = [...idxMap.keys()].sort().join(", ");
    throw new Error(
      `Missing required CSV column "${name}". Available columns: ${available}`
    );
  }
  return idx;
}

function pickBestCompanyRow(rows) {
  // prefer rows with most complete address data
  let best = null;
  let bestScore = -1;
  for (const r of rows) {
    const street = norm(r.street);
    const city = norm(r.city);
    const state = norm(r.state);
    const zip = norm(r.zip);
    const score =
      (street ? 4 : 0) + (city ? 2 : 0) + (state ? 2 : 0) + (zip ? 1 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  }
  return { best, bestScore };
}

function splitStreet(streetRaw) {
  const street = norm(streetRaw);
  if (!street) return { address1: null, address2: null };

  // Common pattern: "123 Main St, Suite 100"
  const parts = street.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) return { address1: street, address2: null };
  return { address1: parts[0] || null, address2: parts.slice(1).join(", ") || null };
}

async function main() {
  if (process.argv.includes("--apply")) {
    throw new Error(
      'This script is DRY-RUN only. Refusing to run with "--apply".'
    );
  }

  const csvPath = path.resolve(
    __dirname,
    "..",
    "..",
    "data_import",
    "steve",
    "steves_customers_2026_02.csv"
  );

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found at: ${csvPath}`);
  }

  const csvText = fs.readFileSync(csvPath, "utf8");
  const parsed = parseCsv(csvText);
  if (parsed.length < 2) throw new Error("CSV appears empty (no data rows).");

  const headers = parsed[0];
  const idxMap = headerIndexMap(headers);

  const idxCompany = requireCol(idxMap, "Company");
  const idxStreet = requireCol(idxMap, "Street");
  const idxCity = requireCol(idxMap, "City");
  const idxState = requireCol(idxMap, "Province/State");
  const idxZip = requireCol(idxMap, "Postal/Zip");

  const rawRows = parsed.slice(1).map((cells, i) => ({
    __row: i + 2, // 1-based line number in file
    company: norm(cells[idxCompany]),
    street: norm(cells[idxStreet]),
    city: norm(cells[idxCity]),
    state: norm(cells[idxState]),
    zip: norm(cells[idxZip]),
  }));

  const rowsWithCompany = rawRows.filter((r) => r.company);
  const byCompany = new Map();
  for (const r of rowsWithCompany) {
    const key = r.company;
    if (!byCompany.has(key)) byCompany.set(key, []);
    byCompany.get(key).push(r);
  }

  const companies = [...byCompany.keys()].sort((a, b) => a.localeCompare(b));

  const allCustomers = await prisma.customer.findMany({
    select: {
      id: true,
      name: true,
      locations: {
        orderBy: { createdAt: "asc" },
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
          updatedAt: true,
        },
      },
    },
  });

  const customerNameMap = new Map();
  for (const c of allCustomers) {
    const key = (c.name ?? "").trim();
    if (!customerNameMap.has(key)) customerNameMap.set(key, []);
    customerNameMap.get(key).push(c);
  }

  let matchCount = 0;
  let updateCount = 0;
  let noChangeCount = 0;
  let skippedNoAddressCount = 0;
  const unmatched = [];
  const planned = [];

  for (const company of companies) {
    const companyRows = byCompany.get(company) || [];
    const { best, bestScore } = pickBestCompanyRow(companyRows);
    const candidates = customerNameMap.get(company) || [];

    if (candidates.length === 0) {
      unmatched.push({ company, reason: "NO_CUSTOMER_MATCH" });
      continue;
    }
    if (candidates.length > 1) {
      unmatched.push({
        company,
        reason: `AMBIGUOUS_CUSTOMER_MATCH (${candidates.length} customers share this exact name)`,
      });
      continue;
    }

    const customer = candidates[0];
    matchCount++;

    // If the CSV has no usable address info for this company, skip (do not clear existing data).
    if (!best || bestScore <= 0) {
      skippedNoAddressCount++;
      unmatched.push({ company, reason: "NO_ADDRESS_DATA_IN_CSV" });
      continue;
    }

    const loc = customer.locations?.[0] ?? null;
    if (!loc) {
      unmatched.push({ company, reason: "NO_LOCATION_RECORD" });
      continue;
    }

    const { address1, address2 } = splitStreet(best.street);
    // Do not clear existing values if CSV is missing a field.
    const desired = {};
    if (address1) desired.address1 = address1;
    // allow explicit address2 updates only if present (don't clear)
    if (address2) desired.address2 = address2;
    if (best.city) desired.city = best.city;
    if (best.state) desired.state = best.state;
    if (best.zip) desired.zip = best.zip;

    const current = {
      address1: norm(loc.address1),
      address2: norm(loc.address2),
      city: norm(loc.city),
      state: norm(loc.state),
      zip: norm(loc.zip),
    };

    const changes = {};
    for (const [k, to] of Object.entries(desired)) {
      if (current[k] !== to) {
        changes[k] = { from: current[k], to };
      }
    }

    const wouldUpdate = Object.keys(changes).length > 0;
    if (wouldUpdate) {
      updateCount++;
      planned.push({
        company,
        customerId: customer.id,
        locationId: loc.id,
        locationName: loc.name,
        changes,
        sourceRow: best.__row,
      });
    } else {
      noChangeCount++;
    }
  }

  console.log("=== DRY RUN: Customer Location Import (Steve CSV) ===");
  console.log(`CSV path: ${csvPath}`);
  console.log(`CSV data rows: ${rawRows.length}`);
  console.log(`Unique companies in CSV: ${companies.length}`);
  console.log("");
  console.log(`Matched customers (exact name): ${matchCount}`);
  console.log(`Would update locations: ${updateCount}`);
  console.log(`No changes needed: ${noChangeCount}`);
  console.log(`Skipped (no address data in CSV): ${skippedNoAddressCount}`);
  console.log(`Unmatched companies: ${unmatched.length}`);
  console.log("");

  if (planned.length) {
    console.log("Sample planned updates (first 15):");
    for (const p of planned.slice(0, 15)) {
      console.log(
        `- ${p.company} -> customerId=${p.customerId} locationId=${p.locationId} (csv row ${p.sourceRow})`
      );
      for (const [k, v] of Object.entries(p.changes)) {
        console.log(`    - ${k}: ${String(v.from)} -> ${String(v.to)}`);
      }
    }
    if (planned.length > 15) {
      console.log(`... (${planned.length - 15} more)`);
    }
    console.log("");
  }

  if (unmatched.length) {
    console.log("Unmatched / skipped companies:");
    for (const u of unmatched) {
      console.log(`- ${u.company}: ${u.reason}`);
    }
  }

  console.log("");
  console.log("DRY RUN complete. No database changes were applied.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

