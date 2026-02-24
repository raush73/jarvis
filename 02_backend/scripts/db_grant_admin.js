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
  const db = new Client({
    connectionString: stripSslParams(env.DATABASE_URL),
    ssl: { rejectUnauthorized: false }
  });

  await db.connect();

  const userRes = await db.query(
    `select id, email from "User" where email = $1 limit 1`,
    ["michael+demo@mw4h.com"]
  );

  if (userRes.rowCount !== 1) {
    console.error("User not found.");
    process.exit(1);
  }

  const userId = userRes.rows[0].id;

  // Ensure ADMIN role exists
  let roleRes = await db.query(
    `select id from "Role" where name = $1 limit 1`,
    ["ADMIN"]
  );

  let roleId;

  if (roleRes.rowCount === 1) {
    roleId = roleRes.rows[0].id;
  } else {
    roleId = "role_admin_local";
    await db.query(
      `insert into "Role" (id, name, description, "createdAt", "updatedAt")
       values ($1, $2, $3, now(), now())`,
      [roleId, "ADMIN", "Local development admin"]
    );
  }

  // Ensure UserRole mapping exists
  const existing = await db.query(
    `select 1 from "UserRole" where "userId"=$1 and "roleId"=$2 limit 1`,
    [userId, roleId]
  );

  if (existing.rowCount === 0) {
    await db.query(
      `insert into "UserRole" ("userId", "roleId", "assignedAt")
       values ($1, $2, now())`,
      [userId, roleId]
    );
  }

  console.log("ADMIN role ensured and assigned.");
  console.log("UserId:", userId);
  console.log("RoleId:", roleId);

  await db.end();
})();
