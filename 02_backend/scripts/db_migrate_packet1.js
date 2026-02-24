const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function readEnvFile(envPath) {
  const raw = fs.readFileSync(envPath, "utf8");
  const lines = raw.split(/\r?\n/);
  const out = {};
  for (const line of lines) {
    if (!line || /^\s*#/.test(line)) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim();
    if (k) out[k] = v;
  }
  return out;
}

function stripSslParams(url) {
  try {
    const u = new URL(url);
    ["sslmode","ssl","sslrootcert","sslcert","sslkey","sslpassword","rejectUnauthorized"].forEach(k => u.searchParams.delete(k));
    return u.toString();
  } catch {
    return url;
  }
}

function qIdent(name) {
  return '"' + String(name).replace(/"/g, '""') + '"';
}

async function getColumns(client, table) {
  const res = await client.query(
    `select column_name
     from information_schema.columns
     where table_schema='public' and table_name=$1
     order by ordinal_position asc`,
    [table]
  );
  return res.rows.map(r => r.column_name);
}

async function fetchAll(client, table, cols) {
  const colList = cols.map(qIdent).join(", ");
  const res = await client.query(`select ${colList} from ${qIdent(table)}`);
  return res.rows;
}

async function insertIgnoreById(target, table, cols, rows) {
  if (rows.length === 0) return;
  if (!cols.includes("id")) throw new Error(`Table ${table}: missing id in selected columns.`);

  const colList = cols.map(qIdent).join(", ");
  const valuesSql = rows.map((_, rIdx) => {
    const ph = cols.map((_, cIdx) => `$${rIdx * cols.length + cIdx + 1}`).join(", ");
    return `(${ph})`;
  }).join(",\n");

  const sql = `
    insert into ${qIdent(table)} (${colList})
    values
    ${valuesSql}
    on conflict (id) do nothing
  `;

  const params = [];
  for (const r of rows) for (const c of cols) params.push(r[c]);
  await target.query(sql, params);
}

async function copyTableIntersection(source, target, table, debug=false) {
  if (table === "_prisma_migrations" || table.startsWith("stg_")) {
    console.log(`SKIP ${table}`);
    return;
  }

  const srcCols = await getColumns(source, table);
  const tgtCols = await getColumns(target, table);

  // copy only columns that exist in BOTH (target order)
  const shared = tgtCols.filter(c => srcCols.includes(c));

  if (!shared.includes("id")) throw new Error(`Table ${table}: shared columns missing id.`);

  if (debug) console.log(`DEBUG ${table} shared cols: ${shared.join(", ")}`);

  const rows = await fetchAll(source, table, shared);

  const chunkSize = 200;
  for (let i = 0; i < rows.length; i += chunkSize) {
    await insertIgnoreById(target, table, shared, rows.slice(i, i + chunkSize));
  }

  console.log(`COPIED ${table}: rows ${rows.length}, cols ${shared.length}`);
}

(async () => {
  const repoRoot = path.resolve(__dirname, "..");
  const targetEnvPath = path.join(repoRoot, ".env");
  const sourceEnvPath = path.join(__dirname, "_db_source.env");

  const targetEnv = readEnvFile(targetEnvPath);
  const sourceEnv = readEnvFile(sourceEnvPath);

  const TARGET_URL = stripSslParams(targetEnv.DATABASE_URL);
  const SOURCE_URL = stripSslParams(sourceEnv.DATABASE_URL);

  if (!TARGET_URL || !SOURCE_URL) throw new Error("Missing DATABASE_URL(s).");

  const source = new Client({ connectionString: SOURCE_URL, ssl: { rejectUnauthorized: false } });
  const target = new Client({ connectionString: TARGET_URL, ssl: { rejectUnauthorized: false } });

  await source.connect();
  await target.connect();

  console.log("Starting data-only migration (Packet 1 baseline) ...");

  await target.query("begin");
  try {
    // Packet 1: registry + customers baseline
    await copyTableIntersection(source, target, "Salesperson", true); // debug proves userId not included
    await copyTableIntersection(source, target, "Customer");
    await copyTableIntersection(source, target, "Location");
    await copyTableIntersection(source, target, "CustomerContact");

    await target.query("commit");
    console.log("COMMIT OK");
  } catch (e) {
    await target.query("rollback");
    console.error("ROLLBACK (error):", e.message);
    process.exitCode = 1;
  } finally {
    await source.end();
    await target.end();
  }
})();


