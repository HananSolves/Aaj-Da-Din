// Size-budget check (project-plan §5.3). Run after `pnpm build` / `pnpm build:firefox`.
// JS is budgeted as initial JS: the scripts newtab.html loads and everything they import
// statically. Lazy chunks (settings, calendar code and data) count toward the package total only.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { gzipSync } from "node:zlib";

const KB = 1024;
const budgets = {
  jsGzip: 25 * KB,
  cssGzip: 8 * KB,
  packageExPhotos: 300 * KB,
};

const outputs = [".output/chrome-mv3", ".output/firefox-mv3"];

// Static imports compile to `from"./x.js"` or `import"./x.js"`; dynamic ones are `import(...)`.
const staticImport = /(?:from|import)\s*["'`](\.\/[^"'`]+\.js)["'`]/g;

function initialScripts(dir: string): Set<string> {
  const html = readFileSync(join(dir, "newtab.html"), "utf8");
  const queue = [...html.matchAll(/<script[^>]*\ssrc="\/([^"]+\.js)"/g)].map((m) => m[1] ?? "");
  const seen = new Set<string>();
  for (let file = queue.pop(); file !== undefined; file = queue.pop()) {
    if (seen.has(file)) continue;
    seen.add(file);
    const source = readFileSync(join(dir, file), "utf8");
    for (const [, target] of source.matchAll(staticImport)) {
      queue.push(join(dirname(file), target ?? ""));
    }
  }
  if (seen.size === 0) throw new Error(`${dir}/newtab.html loads no scripts; check the parser`);
  return seen;
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

let failed = false;

for (const dir of outputs) {
  let files: string[];
  try {
    files = walk(dir);
  } catch {
    console.log(`FAIL ${dir} (not built; run pnpm build and pnpm build:firefox first)`);
    failed = true;
    continue;
  }

  const initial = initialScripts(dir);
  let js = 0;
  let allJs = 0;
  let css = 0;
  let pkg = 0;
  for (const file of files) {
    const buf = readFileSync(file);
    const ext = extname(file);
    const isPhoto = /\.(avif|webp|jpe?g|png)$/.test(file) && file.includes("/photos/");
    if (!isPhoto) pkg += buf.length;
    if (ext === ".js") {
      const size = gzipSync(buf).length;
      allJs += size;
      if (initial.has(relative(dir, file))) js += size;
    }
    if (ext === ".css") css += gzipSync(buf).length;
  }

  const rows: [string, number, number][] = [
    ["JS gzip (initial)", js, budgets.jsGzip],
    ["CSS gzip", css, budgets.cssGzip],
    ["Package (no photos)", pkg, budgets.packageExPhotos],
  ];
  console.log(dir);
  console.log(`  info JS gzip (all chunks): ${(allJs / KB).toFixed(1)} KB`);
  for (const [label, size, max] of rows) {
    const ok = size <= max;
    if (!ok) failed = true;
    console.log(
      `  ${ok ? "ok  " : "FAIL"} ${label}: ${(size / KB).toFixed(1)} KB / ${max / KB} KB`,
    );
  }
}

process.exit(failed ? 1 : 0);
