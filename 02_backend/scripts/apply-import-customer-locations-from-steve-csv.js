/**
 * GATED APPLY importer:
 * - Reads: ../../data_import/steve/steves_customers_2026_02.csv
 * - Matches customers by exact Customer.name == CSV Company
 * - Updates Location.address1, address2, city, state, zip
 * - Never clears fields (only writes non-empty values from CSV)
 * - Does NOT modify defaultSalespersonId
 *
 * Safety gates:
 * - Requires: --apply --confirm APPLY_STEVE_CSV_2026_02
 *
 * Prints:
 * - Pre summary (match count, planned updates, skipped, unmatched)
 * - Post summary (updated count, remaining diffs for planned set)
 */

require("dotenv/config");
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const CONFIRM_TOKEN = "APPLY_STEVE_CSV_2026_02";

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

function getArg(flag, fallback = null) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  const val = process.argv[idx + 1];
  if (!val || val.startsWith("--")) return fallback;
  return val;
}

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
    if (c === "\r") continue;
    field += c;
  }

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
  const parts = street.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) return { address1: street, address2: null };
  return {
    address1: parts[0] || null,
    address2: parts.slice(1).join(", ") || null,
  };
}

function pickTargetLocation(locations) {
  if (!Array.isArray(locations) || locations.length === 0) return null;
  const primary = locations.find(
    (l) => typeof l.name === "string" && l.name.trim().toLowerCase() === "primary"
  );
  return primary || locations[0];
}

function buildDesiredFromBest(best) {
  const { address1, address2 } = splitStreet(best.street);
  const desired = {};
  if (address1) desired.address1 = address1;
  if (address2) desired.address2 = address2;
  if (best.city) desired.city = best.city;
  if (best.state) desired.state = best.state;
  if (best.zip) desired.zip = best.zip;
  return desired;
}

function computeChanges(current, desired) {
  const changes = {};
  for (const [k, to] of Object.entries(desired)) {
    if (norm(current[k]) !== to) {
      changes[k] = { from: norm(current[k]), to };
    }
  }
  return changes;
}

async function planUpdates() {
  const csvPath = path.resolve(
    __dirname,
    "..",
    "..",
    "data_import",
    "steve",
    "steves_customers_2026_02.csv"
  );
  if (!fs.existsSync(csvPath)) throw new Error(`CSV file not found: ${csvPath}`);

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
    __row: i + 2,
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
        reason: `AMBIGUOUS_CUSTOMER_MATCH (${candidates.length})`,
      });
      continue;
    }

    const customer = candidates[0];
    matchCount++;

    if (!best || bestScore <= 0) {
      skippedNoAddressCount++;
      unmatched.push({ company, reason: "NO_ADDRESS_DATA_IN_CSV" });
      continue;
    }

    const loc = pickTargetLocation(customer.locations);
    if (!loc) {
      unmatched.push({ company, reason: "NO_LOCATION_RECORD" });
      continue;
    }

    const desired = buildDesiredFromBest(best);
    const changes = computeChanges(loc, desired);
    const wouldUpdate = Object.keys(changes).length > 0;

    planned.push({
      company,
      customerId: customer.id,
      locationId: loc.id,
      locationName: loc.name,
      sourceRow: best.__row,
      desired,
      changes,
      wouldUpdate,
    });
  }

  const toUpdate = planned.filter((p) => p.wouldUpdate);
  const noChange = planned.filter((p) => !p.wouldUpdate);

  return {
    csvPath,
    csvDataRows: rawRows.length,
    uniqueCompanies: companies.length,
    matchCount,
    skippedNoAddressCount,
    unmatched,
    planned,
    toUpdate,
    noChange,
  };
}

function printPreSummary(plan) {
  console.log("=== APPLY: Customer Location Import (Steve CSV) ===");
  console.log(`CSV path: ${plan.csvPath}`);
  console.log(`CSV data rows: ${plan.csvDataRows}`);
  console.log(`Unique companies in CSV: ${plan.uniqueCompanies}`);
  console.log("");
  console.log(`Matched customers (exact name): ${plan.matchCount}`);
  console.log(`Would update locations: ${plan.toUpdate.length}`);
  console.log(`No changes needed: ${plan.noChange.length}`);
  console.log(`Skipped (no address data in CSV): ${plan.skippedNoAddressCount}`);
  console.log(`Unmatched companies: ${plan.unmatched.length}`);
  console.log("");

  if (plan.toUpdate.length) {
    console.log("Sample updates (first 15):");
    for (const p of plan.toUpdate.slice(0, 15)) {
      console.log(
        `- ${p.company} -> customerId=${p.customerId} locationId=${p.locationId} (csv row ${p.sourceRow})`
      );
      for (const [k, v] of Object.entries(p.changes)) {
        console.log(`    - ${k}: ${String(v.from)} -> ${String(v.to)}`);
      }
    }
    if (plan.toUpdate.length > 15) {
      console.log(`... (${plan.toUpdate.length - 15} more)`);
    }
    console.log("");
  }

  if (plan.unmatched.length) {
    console.log("Unmatched / skipped companies:");
    for (const u of plan.unmatched) {
      console.log(`- ${u.company}: ${u.reason}`);
    }
    console.log("");
  }
}

async function applyUpdates(plan) {
  const updates = plan.toUpdate.map((p) => ({
    locationId: p.locationId,
    data: p.desired,
  }));

  const results = await prisma.$transaction(async (tx) => {
    let updated = 0;
    for (const u of updates) {
      // Only writes non-empty fields from CSV (desired already filtered).
      // This never clears fields.
      await tx.location.update({
        where: { id: u.locationId },
        data: u.data,
      });
      updated++;
    }
    return { updated };
  });

  return results;
}

async function postVerify(plan) {
  const ids = plan.toUpdate.map((p) => p.locationId);
  if (!ids.length) return { remainingDiffs: 0, remaining: [] };

  const fresh = await prisma.location.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      name: true,
      address1: true,
      address2: true,
      city: true,
      state: true,
      zip: true,
    },
  });
  const freshMap = new Map(fresh.map((l) => [l.id, l]));

  const remaining = [];
  for (const p of plan.toUpdate) {
    const loc = freshMap.get(p.locationId);
    if (!loc) {
      remaining.push({
        company: p.company,
        locationId: p.locationId,
        reason: "LOCATION_NOT_FOUND_POST_APPLY",
      });
      continue;
    }
    const changes = computeChanges(loc, p.desired);
    if (Object.keys(changes).length > 0) {
      remaining.push({
        company: p.company,
        locationId: p.locationId,
        changes,
      });
    }
  }

  return { remainingDiffs: remaining.length, remaining };
}

async function main() {
  const apply = process.argv.includes("--apply");
  const confirm = getArg("--confirm", null);

  const plan = await planUpdates();
  printPreSummary(plan);

  if (!apply) {
    console.log(
      `DRY MODE: not applying. To apply, run with: --apply --confirm ${CONFIRM_TOKEN}`
    );
    return;
  }

  if (confirm !== CONFIRM_TOKEN) {
    throw new Error(
      `Refusing to apply. You must pass: --confirm ${CONFIRM_TOKEN}`
    );
  }

  console.log("Applying updates...");
  const res = await applyUpdates(plan);

  console.log("");
  console.log("=== POST SUMMARY ===");
  console.log(`Updated locations: ${res.updated}`);

  const verify = await postVerify(plan);
  console.log(`Remaining diffs (should be 0): ${verify.remainingDiffs}`);
  if (verify.remainingDiffs) {
    console.log("Remaining diffs details:");
    for (const r of verify.remaining.slice(0, 25)) {
      console.log(`- ${r.company} (locationId=${r.locationId})`);
      if (r.changes) {
        for (const [k, v] of Object.entries(r.changes)) {
          console.log(`    - ${k}: ${String(v.from)} -> ${String(v.to)}`);
        }
      } else {
        console.log(`    - ${r.reason}`);
      }
    }
    if (verify.remaining.length > 25) {
      console.log(`... (${verify.remaining.length - 25} more)`);
    }
  }

  console.log("");
  console.log("APPLY complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

