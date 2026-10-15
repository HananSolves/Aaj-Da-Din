// Size-budget check (project-plan §5.3). Run after `pnpm build` / `pnpm build:firefox`.
// Budgets here are for the whole package; refine to "initial JS" once lazy chunks exist.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { gzipSync } from "node:zlib";

const KB = 1024;
const budgets = {
  jsGzip: 25 * KB,
  cssGzip: 8 * KB,
  packageExPhotos: 100 * KB,
};

const outputs = [".output/chrome-mv3", ".output/firefox-mv3"];

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
    console.log(`skip ${dir} (not built)`);
    continue;
  }

  let js = 0;
  let css = 0;
  let pkg = 0;
  for (const file of files) {
    const buf = readFileSync(file);
    const ext = extname(file);
    const isPhoto = /\.(avif|webp|jpe?g|png)$/.test(file) && file.includes("/photos/");
    if (!isPhoto) pkg += buf.length;
    if (ext === ".js") js += gzipSync(buf).length;
    if (ext === ".css") css += gzipSync(buf).length;
  }

  const rows: [string, number, number][] = [
    ["JS gzip", js, budgets.jsGzip],
    ["CSS gzip", css, budgets.cssGzip],
    ["Package (no photos)", pkg, budgets.packageExPhotos],
  ];
  console.log(dir);
  for (const [label, size, max] of rows) {
    const ok = size <= max;
    if (!ok) failed = true;
    console.log(
      `  ${ok ? "ok  " : "FAIL"} ${label}: ${(size / KB).toFixed(1)} KB / ${max / KB} KB`,
    );
  }
}

process.exit(failed ? 1 : 0);
