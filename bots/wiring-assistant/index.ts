#!/usr/bin/env node
import * as fs from "fs";
import * as path from "path";

const REPO_ROOT = path.resolve(__dirname, "../..");
const FRONTEND_ROOT = path.join(REPO_ROOT, "03_frontend");
const BACKEND_ROOT = path.join(REPO_ROOT, "02_backend");

// ── CLI parsing ──────────────────────────────────────────────────────

function parseArgs(): { route?: string; file?: string } {
  const args = process.argv.slice(2);
  let route: string | undefined;
  let file: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--route" && args[i + 1]) route = args[++i];
    if (args[i] === "--file" && args[i + 1]) file = args[++i];
  }
  return { route, file };
}

// ── Filesystem helpers ───────────────────────────────────────────────

function walkDir(dir: string, extensions: string[]): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (["node_modules", ".next", "dist"].includes(e.name)) continue;
      results.push(...walkDir(full, extensions));
    } else if (extensions.some((ext) => e.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

// ── Step 1: Resolve frontend page ────────────────────────────────────

function resolvePageFromRoute(route: string): string | null {
  const normalized = route.replace(/^\//, "").replace(/\/$/, "");
  const segments = normalized ? normalized.split("/") : [];

  const candidate = path.join(
    FRONTEND_ROOT,
    "app",
    ...segments,
    "page.tsx"
  );
  if (fs.existsSync(candidate)) return candidate;

  // Fuzzy: try replacing segments with dynamic [param] directories
  const appDir = path.join(FRONTEND_ROOT, "app");
  const match = fuzzyFindPage(appDir, segments, 0);
  return match;
}

function fuzzyFindPage(
  currentDir: string,
  segments: string[],
  depth: number
): string | null {
  if (depth === segments.length) {
    const page = path.join(currentDir, "page.tsx");
    return fs.existsSync(page) ? page : null;
  }
  if (!fs.existsSync(currentDir)) return null;

  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  const target = segments[depth];

  // Exact match first
  for (const e of entries) {
    if (e.isDirectory() && e.name === target) {
      const result = fuzzyFindPage(path.join(currentDir, e.name), segments, depth + 1);
      if (result) return result;
    }
  }
  // Dynamic segment match [xxx]
  for (const e of entries) {
    if (e.isDirectory() && e.name.startsWith("[") && e.name.endsWith("]")) {
      const result = fuzzyFindPage(path.join(currentDir, e.name), segments, depth + 1);
      if (result) return result;
    }
  }
  return null;
}

function resolvePageFromFile(filePath: string): string | null {
  const abs = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(REPO_ROOT, filePath);
  return fs.existsSync(abs) ? abs : null;
}

// ── Step 2: Discover API references in frontend files ────────────────

interface ApiRef {
  endpoint: string;
  raw: string;
  sourceFile: string;
  line: number;
}

function collectFrontendFiles(pageFile: string): string[] {
  const dir = path.dirname(pageFile);
  const files = [pageFile];
  // Also scan sibling .ts/.tsx files in the same directory (components, hooks, actions)
  if (fs.existsSync(dir)) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (
        !e.isDirectory() &&
        (e.name.endsWith(".ts") || e.name.endsWith(".tsx")) &&
        path.join(dir, e.name) !== pageFile
      ) {
        files.push(path.join(dir, e.name));
      }
    }
  }

  // Trace local imports from the page file to pull in shared libs
  try {
    const content = fs.readFileSync(pageFile, "utf-8");
    const importMatches = content.matchAll(
      /from\s+['"](@\/|\.\.?\/)([^'"]+)['"]/g
    );
    for (const m of importMatches) {
      const prefix = m[1];
      const importPath = m[2];
      let resolved: string;
      if (prefix === "@/") {
        resolved = path.join(FRONTEND_ROOT, importPath);
      } else {
        resolved = path.resolve(path.dirname(pageFile), prefix + importPath);
      }
      for (const ext of ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]) {
        const candidate = resolved + ext;
        if (fs.existsSync(candidate) && !files.includes(candidate)) {
          files.push(candidate);
          break;
        }
      }
    }
  } catch {
    // ignore read errors
  }
  return files;
}

function discoverApiRefs(files: string[]): ApiRef[] {
  const refs: ApiRef[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    let content: string;
    try {
      content = fs.readFileSync(file, "utf-8");
    } catch {
      continue;
    }
    const lines = content.split("\n");
    const relFile = path.relative(REPO_ROOT, file);

    // Skip the apiFetch wrapper definition itself
    if (relFile.replace(/\\/g, "/").includes("lib/api.ts")) continue;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // /api/xxx references (string literals)
      const apiMatches = line.matchAll(/['"`](\/api\/[^'"`\s${}]+)['"`]/g);
      for (const m of apiMatches) {
        addRef(m[1], m[1], relFile, i + 1);
      }

      // fetch("..." ) — extract URL
      const fetchMatch = line.match(
        /fetch\s*\(\s*['"`](\/[^'"`]+)['"`]/
      );
      if (fetchMatch) {
        addRef(fetchMatch[1], fetchMatch[1], relFile, i + 1);
      }

      // fetch with template literal
      const fetchTpl = line.match(/fetch\s*\(\s*`(\/[^`]+)`/);
      if (fetchTpl) {
        const cleaned = fetchTpl[1].replace(/\$\{[^}]+\}/g, ":param");
        addRef(cleaned, fetchTpl[1], relFile, i + 1);
      }

      // apiFetch("...") — these resolve to /api/<path> via API_BASE
      const apiFetchStr = line.match(/apiFetch\s*\(\s*['"`](\/[^'"`]+)['"`]/);
      if (apiFetchStr) {
        const rawPath = apiFetchStr[1];
        const effectiveEndpoint = rawPath.startsWith("/api/")
          ? rawPath
          : "/api" + rawPath;
        addRef(effectiveEndpoint, rawPath, relFile, i + 1);
      }
      const apiFetchTpl = line.match(/apiFetch\s*\(\s*`(\/[^`]+)`/);
      if (apiFetchTpl) {
        const rawPath = apiFetchTpl[1].replace(/\$\{[^}]+\}/g, ":param");
        const effectiveEndpoint = rawPath.startsWith("/api/")
          ? rawPath
          : "/api" + rawPath;
        addRef(effectiveEndpoint, apiFetchTpl[1], relFile, i + 1);
      }

      // axios.verb("...")
      const axiosMatch = line.match(
        /axios\.\w+\s*\(\s*['"`](\/[^'"`]+)['"`]/
      );
      if (axiosMatch) {
        addRef(axiosMatch[1], axiosMatch[1], relFile, i + 1);
      }
    }
  }

  function addRef(endpoint: string, raw: string, sourceFile: string, line: number) {
    const key = `${endpoint}::${sourceFile}::${line}`;
    if (seen.has(key)) return;
    seen.add(key);
    refs.push({ endpoint, raw, sourceFile, line });
  }

  return refs;
}

// ── Step 3: Check Next.js proxy routes ───────────────────────────────

interface ProxyStatus {
  endpoint: string;
  routeFile: string | null;
  exists: boolean;
}

function checkProxyRoutes(apiRefs: ApiRef[]): ProxyStatus[] {
  const checked = new Map<string, ProxyStatus>();

  for (const ref of apiRefs) {
    if (!ref.endpoint.startsWith("/api/")) continue;
    if (checked.has(ref.endpoint)) continue;

    // /api/customers => app/api/customers/route.ts
    const segments = ref.endpoint
      .replace(/^\/api\//, "")
      .replace(/\/:param/g, "/[param]")
      .split("/")
      .filter(Boolean);

    const routeFile = path.join(
      FRONTEND_ROOT,
      "app",
      "api",
      ...segments,
      "route.ts"
    );
    checked.set(ref.endpoint, {
      endpoint: ref.endpoint,
      routeFile: path.relative(REPO_ROOT, routeFile),
      exists: fs.existsSync(routeFile),
    });
  }
  return Array.from(checked.values());
}

// ── Step 4: Discover backend routes ──────────────────────────────────

interface BackendRoute {
  method: string;
  fullPath: string;
  sourceFile: string;
  line: number;
}

function scanBackendRoutes(): BackendRoute[] {
  const srcDir = path.join(BACKEND_ROOT, "src");
  const controllerFiles = walkDir(srcDir, [".controller.ts"]);
  const routes: BackendRoute[] = [];

  for (const file of controllerFiles) {
    let content: string;
    try {
      content = fs.readFileSync(file, "utf-8");
    } catch {
      continue;
    }
    const relFile = path.relative(REPO_ROOT, file);

    const ctrlMatch = content.match(
      /@Controller\s*\(\s*['"`]([^'"`]*)['"`]\s*\)/
    );
    const basePath = ctrlMatch ? ctrlMatch[1].replace(/^\//, "") : "";

    const lines = content.split("\n");
    const decorators: Array<{ method: string; regex: RegExp }> = [
      { method: "GET", regex: /@Get\s*\(\s*['"`]?([^'"`)]*)['"`]?\s*\)/ },
      { method: "POST", regex: /@Post\s*\(\s*['"`]?([^'"`)]*)['"`]?\s*\)/ },
      { method: "PATCH", regex: /@Patch\s*\(\s*['"`]?([^'"`)]*)['"`]?\s*\)/ },
      { method: "PUT", regex: /@Put\s*\(\s*['"`]?([^'"`)]*)['"`]?\s*\)/ },
      { method: "DELETE", regex: /@Delete\s*\(\s*['"`]?([^'"`)]*)['"`]?\s*\)/ },
    ];

    for (let i = 0; i < lines.length; i++) {
      for (const dec of decorators) {
        const m = lines[i].match(dec.regex);
        if (m) {
          const routePath = (m[1] || "").trim();
          const full = joinPath(basePath, routePath);
          routes.push({
            method: dec.method,
            fullPath: full,
            sourceFile: relFile,
            line: i + 1,
          });
        }
      }
    }
  }
  return routes;
}

function joinPath(base: string, route: string): string {
  const b = base.replace(/^\//, "").replace(/\/$/, "");
  const r = route.replace(/^\//, "").replace(/\/$/, "");
  if (!b && !r) return "/";
  if (!b) return "/" + r;
  if (!r) return "/" + b;
  return "/" + b + "/" + r;
}

// ── Step 5: Match proxy endpoints to backend routes ──────────────────

interface BackendMatch {
  proxyEndpoint: string;
  backendPath: string;
  matched: boolean;
  backendRoute?: BackendRoute;
}

function matchBackendRoutes(
  proxyStatuses: ProxyStatus[],
  backendRoutes: BackendRoute[]
): BackendMatch[] {
  const results: BackendMatch[] = [];

  for (const proxy of proxyStatuses) {
    // /api/customers => backend path /customers
    const backendPath = proxy.endpoint.replace(/^\/api/, "");
    const normalizedTarget = backendPath
      .replace(/:param/g, ":id")
      .toLowerCase();

    const match = backendRoutes.find((r) => {
      const normalizedRoute = r.fullPath
        .replace(/:[^/]+/g, ":id")
        .toLowerCase();
      return normalizedRoute === normalizedTarget;
    });

    results.push({
      proxyEndpoint: proxy.endpoint,
      backendPath,
      matched: !!match,
      backendRoute: match,
    });
  }
  return results;
}

// ── Report generation ────────────────────────────────────────────────

function printReport(
  input: string,
  pageFile: string | null,
  apiRefs: ApiRef[],
  proxyStatuses: ProxyStatus[],
  backendMatches: BackendMatch[]
): boolean {
  const proxyPresent = proxyStatuses.filter((p) => p.exists);
  const proxyMissing = proxyStatuses.filter((p) => !p.exists);
  const backendMatched = backendMatches.filter((b) => b.matched);
  const backendMissing = backendMatches.filter((b) => !b.matched);

  let noGo = false;

  console.log("");
  console.log("WIRING ASSISTANT — REPORT");
  console.log("-------------------------");
  console.log(`Input: ${input}`);
  console.log(
    `Frontend page: ${pageFile ? path.relative(REPO_ROOT, pageFile) : "NOT FOUND"}`
  );

  if (!pageFile) noGo = true;

  console.log("");
  console.log("Discovered API references:");
  if (apiRefs.length === 0) {
    console.log("  (none)");
  } else {
    for (const ref of apiRefs) {
      console.log(`  - ${ref.endpoint}  (${ref.sourceFile}:${ref.line})`);
    }
  }

  console.log("");
  console.log("Proxy routes present:");
  if (proxyPresent.length === 0) {
    console.log("  (none)");
  } else {
    for (const p of proxyPresent) {
      console.log(`  - ${p.endpoint}  => ${p.routeFile}`);
    }
  }

  console.log("");
  console.log("Proxy routes missing:");
  if (proxyMissing.length === 0) {
    console.log("  (none)");
  } else {
    noGo = true;
    for (const p of proxyMissing) {
      console.log(`  - ${p.endpoint}  (expected: ${p.routeFile})`);
    }
  }

  console.log("");
  console.log("Backend routes matched:");
  if (backendMatched.length === 0) {
    console.log("  (none)");
  } else {
    for (const b of backendMatched) {
      console.log(
        `  - ${b.proxyEndpoint} => ${b.backendRoute!.method} ${b.backendRoute!.fullPath}  (${b.backendRoute!.sourceFile}:${b.backendRoute!.line})`
      );
    }
  }

  console.log("");
  console.log("Backend routes missing:");
  if (backendMissing.length === 0) {
    console.log("  (none)");
  } else {
    for (const b of backendMissing) {
      console.log(`  - ${b.proxyEndpoint} => expected backend ${b.backendPath}  [WARNING]`);
    }
  }

  const verdict = noGo ? "NO_GO" : "GO";
  console.log("");
  console.log(`VERDICT: ${verdict}`);
  console.log("");
  return noGo;
}

// ── Main ─────────────────────────────────────────────────────────────

function main(): void {
  const { route, file } = parseArgs();

  if (!route && !file) {
    console.error("Usage: npm run bot:wiring -- --route \"/admin/salespeople\"");
    console.error("       npm run bot:wiring -- --file \"03_frontend/app/admin/salespeople/page.tsx\"");
    process.exit(1);
  }

  const input = route ? `--route ${route}` : `--file ${file}`;

  // Step 1: resolve page
  let pageFile: string | null = null;
  if (route) {
    pageFile = resolvePageFromRoute(route);
  } else if (file) {
    pageFile = resolvePageFromFile(file!);
  }

  // Step 2: discover API refs
  let apiRefs: ApiRef[] = [];
  if (pageFile) {
    const filesToScan = collectFrontendFiles(pageFile);
    apiRefs = discoverApiRefs(filesToScan);
  }

  // Step 3: check proxy routes
  const proxyStatuses = checkProxyRoutes(apiRefs);

  // Step 4: scan backend
  const backendRoutes = scanBackendRoutes();

  // Step 5: match
  const backendMatches = matchBackendRoutes(proxyStatuses, backendRoutes);

  // Step 6: report
  const noGo = printReport(input, pageFile, apiRefs, proxyStatuses, backendMatches);

  process.exit(noGo ? 1 : 0);
}

main();
