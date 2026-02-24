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
    // remove params that may force verify-full behavior in pg-connection-string
    u.searchParams.delete("sslmode");
    u.searchParams.delete("ssl");
    u.searchParams.delete("sslrootcert");
    u.searchParams.delete("sslcert");
    u.searchParams.delete("sslkey");
    u.searchParams.delete("sslpassword");
    u.searchParams.delete("rejectUnauthorized");
    return u.toString();
  } catch {
    return url;
  }
}

function safeDbNameFromUrl(url) {
  try {
    const u = new URL(url);
    return (u.pathname || "").replace(/^\//, "") || "(unknown_db)";
  } catch {
    return "(invalid_url)";
  }
}

async function listTablesAndCounts(dbUrl) { dbUrl = stripSslParams(dbUrl);
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const tablesRes = await client.query(`
    select tablename
    from pg_catalog.pg_tables
    where schemaname = 'public'
    order by tablename asc;
  `);

  const tables = tablesRes.rows.map(r => r.tablename);
  const counts = {};

  for (const t of tables) {
    const q = `select count(*)::bigint as c from "${t.replace(/"/g, '""')}"`;
    const r = await client.query(q);
    counts[t] = BigInt(r.rows[0].c);
  }

  await client.end();
  return { tables, counts };
}

(async () => {
  const repoRoot = path.resolve(__dirname, "..");
  const targetEnvPath = path.join(repoRoot, ".env");
  const sourceEnvPath = path.join(__dirname, "_db_source.env");

  if (!fs.existsSync(targetEnvPath)) {
    console.error("ERROR: target .env not found.");
    process.exit(1);
  }

  if (!fs.existsSync(sourceEnvPath)) {
    console.error("ERROR: source env file not found.");
    process.exit(1);
  }

  const targetEnv = readEnvFile(targetEnvPath);
  const sourceEnv = readEnvFile(sourceEnvPath);

  const TARGET_URL = targetEnv.DATABASE_URL;
  const SOURCE_URL = sourceEnv.DATABASE_URL;

  const targetDb = safeDbNameFromUrl(TARGET_URL);
  const sourceDb = safeDbNameFromUrl(SOURCE_URL);

  console.log("TARGET_DB =", targetDb);
  console.log("SOURCE_DB =", sourceDb);
  console.log("");

  const [source, target] = await Promise.all([
    listTablesAndCounts(SOURCE_URL),
    listTablesAndCounts(TARGET_URL),
  ]);

  const allTables = Array.from(new Set([...source.tables, ...target.tables])).sort();

  console.log("Table".padEnd(40), "SOURCE".padStart(12), "TARGET".padStart(12), "Δ".padStart(12));
  console.log("-".repeat(78));

  for (const t of allTables) {
    const s = source.counts[t] ?? 0n;
    const g = target.counts[t] ?? 0n;
    const d = s - g;

    console.log(
      t.padEnd(40),
      String(s).padStart(12),
      String(g).padStart(12),
      String(d).padStart(12)
    );
  }

  console.log("\nDONE.");
})().catch(err => {
  console.error("FATAL:", err.message);
  process.exit(1);
});


