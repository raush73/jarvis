#!/usr/bin/env node
import * as fs from "fs";
import * as path from "path";

// ── CLI parsing ──────────────────────────────────────────────────────

interface CliArgs {
  csv: string;
  companyCol: string;
  ownerCol: string;
  outDir: string;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  let csv = "";
  let companyCol = "Company";
  let ownerCol = "Sales Person - Ownership";
  let outDir = "reports/data-mapper";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--csv" && args[i + 1]) csv = args[++i];
    else if (args[i] === "--company-col" && args[i + 1]) companyCol = args[++i];
    else if (args[i] === "--owner-col" && args[i + 1]) ownerCol = args[++i];
    else if (args[i] === "--out-dir" && args[i + 1]) outDir = args[++i];
  }

  return { csv, companyCol, ownerCol, outDir };
}

// ── Minimal CSV parser (handles quoted commas) ───────────────────────

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

function parseCsv(text: string): string[][] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const rows: string[][] = [];
  for (const line of lines) {
    if (line.length === 0) continue;
    rows.push(parseCsvLine(line));
  }
  return rows;
}

// ── Normalization ────────────────────────────────────────────────────

function normalizeField(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normKey(value: string): string {
  return normalizeField(value).toLowerCase();
}

// ── Row helpers ──────────────────────────────────────────────────────

function isEmptyRow(cells: string[]): boolean {
  return cells.every((c) => c.trim() === "");
}

interface Record {
  [header: string]: string;
}

function rowToRecord(headers: string[], cells: string[]): Record {
  const rec: Record = {};
  for (let i = 0; i < headers.length; i++) {
    rec[headers[i]] = normalizeField(cells[i] ?? "");
  }
  return rec;
}

// ── Output generators ────────────────────────────────────────────────

function buildColumnInventory(headers: string[], records: Record[]): object {
  return headers.map((h) => {
    const values = records.map((r) => r[h] ?? "");
    const nonEmpty = values.filter((v) => v !== "");
    const unique = [...new Set(nonEmpty)];
    return {
      column: h,
      totalRows: records.length,
      populated: nonEmpty.length,
      empty: records.length - nonEmpty.length,
      uniqueValues: unique.length,
      sampleValues: unique.slice(0, 5),
    };
  });
}

interface CompanyMapping {
  raw: string;
  raw_norm: string;
  owner: string;
  owner_norm: string;
  rowCount: number;
}

function buildMapping(
  records: Record[],
  companyCol: string,
  ownerCol: string
): CompanyMapping[] {
  const map = new Map<string, CompanyMapping>();

  for (const rec of records) {
    const raw = rec[companyCol] ?? "";
    if (raw === "") continue;
    const key = normKey(raw);

    if (map.has(key)) {
      map.get(key)!.rowCount++;
    } else {
      const owner = rec[ownerCol] ?? "";
      map.set(key, {
        raw,
        raw_norm: key,
        owner: normalizeField(owner),
        owner_norm: normKey(owner),
        rowCount: 1,
      });
    }
  }

  return [...map.values()].sort((a, b) => a.raw_norm.localeCompare(b.raw_norm));
}

function buildUniqueCompaniesCsv(mappings: CompanyMapping[]): string {
  const header = "company,company_norm,owner,owner_norm,row_count";
  const lines = mappings.map(
    (m) =>
      `${csvEscape(m.raw)},${csvEscape(m.raw_norm)},${csvEscape(m.owner)},${csvEscape(m.owner_norm)},${m.rowCount}`
  );
  return [header, ...lines].join("\n");
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCleanedContactsCsv(headers: string[], records: Record[]): string {
  const outHeaders = [...headers, ...headers.map((h) => `${h}_norm`)];
  const headerLine = outHeaders.map(csvEscape).join(",");

  const dataLines = records.map((rec) => {
    const cells: string[] = [];
    for (const h of headers) {
      cells.push(csvEscape(rec[h] ?? ""));
    }
    for (const h of headers) {
      cells.push(csvEscape(normKey(rec[h] ?? "")));
    }
    return cells.join(",");
  });

  return [headerLine, ...dataLines].join("\n");
}

function buildOutputReadme(
  csvPath: string,
  rowCount: number,
  uniqueCompanies: number,
  timestamp: string
): string {
  return `# Data Mapper Output — ${timestamp}

Source CSV: ${csvPath}
Rows (after dropping empty): ${rowCount}
Unique companies: ${uniqueCompanies}

## Files

| File | Description |
|------|-------------|
| column-inventory.json | Per-column stats: populated, empty, unique counts, samples |
| mapping.json | Deterministic company→owner mapping with normalized keys |
| companies.unique.csv | Deduplicated company list with owner and row counts |
| contacts.cleaned.csv | Full contact data with appended _norm columns |
| README.md | This file |
`;
}

// ── Main ─────────────────────────────────────────────────────────────

function main(): void {
  const args = parseArgs();

  if (!args.csv) {
    console.error("ERROR: --csv <path> is required.");
    process.exit(1);
  }

  const csvPath = path.resolve(args.csv);

  if (!fs.existsSync(csvPath)) {
    console.error(`NO_GO — CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  let csvText: string;
  try {
    csvText = fs.readFileSync(csvPath, "utf-8");
  } catch (err: any) {
    console.error(`NO_GO — Cannot read CSV: ${err.message}`);
    process.exit(1);
  }

  const rawRows = parseCsv(csvText);
  if (rawRows.length < 1) {
    console.error("NO_GO — CSV is empty (no header row).");
    process.exit(1);
  }

  const headers = rawRows[0].map(normalizeField);
  const dataRows = rawRows.slice(1).filter((r) => !isEmptyRow(r));

  if (!headers.includes(args.companyCol)) {
    console.error(
      `NO_GO — Company column "${args.companyCol}" not found in headers: [${headers.join(", ")}]`
    );
    process.exit(1);
  }

  const records = dataRows.map((r) => rowToRecord(headers, r));

  const columnInventory = buildColumnInventory(headers, records);
  const mappings = buildMapping(records, args.companyCol, args.ownerCol);
  const uniqueCompaniesCsv = buildUniqueCompaniesCsv(mappings);
  const cleanedContactsCsv = buildCleanedContactsCsv(headers, records);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outRoot = path.resolve(args.outDir, timestamp);

  fs.mkdirSync(outRoot, { recursive: true });

  fs.writeFileSync(
    path.join(outRoot, "column-inventory.json"),
    JSON.stringify(columnInventory, null, 2)
  );
  fs.writeFileSync(
    path.join(outRoot, "mapping.json"),
    JSON.stringify(mappings, null, 2)
  );
  fs.writeFileSync(path.join(outRoot, "companies.unique.csv"), uniqueCompaniesCsv);
  fs.writeFileSync(path.join(outRoot, "contacts.cleaned.csv"), cleanedContactsCsv);
  fs.writeFileSync(
    path.join(outRoot, "README.md"),
    buildOutputReadme(args.csv, records.length, mappings.length, timestamp)
  );

  console.log("");
  console.log("DATA MAPPER — REPORT");
  console.log("--------------------");
  console.log(`CSV:                ${args.csv}`);
  console.log(`Rows:               ${records.length}`);
  console.log(`Unique companies:   ${mappings.length}`);
  console.log(`Output:             ${outRoot}`);
  console.log(`VERDICT:            GO`);
  console.log("");

  process.exit(0);
}

main();
