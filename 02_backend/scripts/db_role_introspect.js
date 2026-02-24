const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function readEnvFile(envPath) {
  const raw = fs.readFileSync(envPath, "utf8");
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || /^\s*#/.test(line)) continue;
    const i = line.indexOf("=");
    if (i === -1) continue;
    out[line.slice(0,i).trim()] = line.slice(i+1).trim();
  }
  return out;
}

function stripSslParams(url) {
  try {
    const u = new URL(url);
    ["sslmode","ssl","sslrootcert","sslcert","sslkey","sslpassword","rejectUnauthorized"].forEach(k => u.searchParams.delete(k));
    return u.toString();
  } catch { return url; }
}

(async () => {
  const repoRoot = path.resolve(__dirname, "..");
  const env = readEnvFile(path.join(repoRoot, ".env"));
  const db = new Client({ connectionString: stripSslParams(env.DATABASE_URL), ssl: { rejectUnauthorized: false } });
  await db.connect();

  const roleCols = await db.query(`
    select column_name
    from information_schema.columns
    where table_schema='public' and table_name='Role'
    order by ordinal_position
  `);

  const userRoleCols = await db.query(`
    select column_name
    from information_schema.columns
    where table_schema='public' and table_name='UserRole'
    order by ordinal_position
  `);

  console.log("ROLE_COLS=", roleCols.rows.map(r=>r.column_name).join(", "));
  console.log("USERROLE_COLS=", userRoleCols.rows.map(r=>r.column_name).join(", "));

  const user = await db.query(`select id, email from "User" order by "createdAt" asc limit 1`);
  console.log("TARGET_USER=", user.rows[0]);

  await db.end();
})();
