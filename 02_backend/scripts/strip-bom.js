/**
 * strip-bom.js
 * Removes UTF-8 BOM (EF BB BF) from text files in the repo.
 * Intentionally skips node_modules and dist.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git']);

const TEXT_EXTS = new Set([
  '.ts', '.js', '.json', '.md', '.txt', '.html', '.css', '.yml', '.yaml',
  '.env', '.gitignore', '.gitattributes', '.editorconfig'
]);

function isTextFile(filePath) {
  const base = path.basename(filePath);
  if (base === 'package-lock.json') return true;
  const ext = path.extname(base).toLowerCase();
  return TEXT_EXTS.has(ext) || TEXT_EXTS.has(base);
}

function walk(dir, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      walk(full, out);
    } else if (ent.isFile()) {
      if (isTextFile(full)) out.push(full);
    }
  }
}

function hasUtf8Bom(buf) {
  return buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
}

const files = [];
walk(ROOT, files);

let fixed = 0;
const fixedFiles = [];

for (const f of files) {
  let buf;
  try {
    buf = fs.readFileSync(f);
  } catch {
    continue;
  }
  if (hasUtf8Bom(buf)) {
    const stripped = buf.subarray(3);
    fs.writeFileSync(f, stripped);
    fixed++;
    fixedFiles.push(path.relative(ROOT, f));
  }
}

console.log(`[STRIP BOM] Fixed ${fixed} file(s).`);
if (fixedFiles.length) {
  for (const f of fixedFiles) console.log(' - ' + f);
}