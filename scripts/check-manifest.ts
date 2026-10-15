// Guards the permission non-negotiables (AGENTS.md, project-plan §5.4) on the built manifests.
// Run after `pnpm build` / `pnpm build:firefox`. A missing build is a failure, not a skip.
import { readFileSync } from "node:fs";

const outputs = [".output/chrome-mv3", ".output/firefox-mv3"];

// Any of these would add an install warning or a code path the plan rules out.
const forbidden = [
  "background",
  "content_scripts",
  "host_permissions",
  "optional_permissions",
  "optional_host_permissions",
];

let failed = false;

for (const dir of outputs) {
  const problems: string[] = [];
  let manifest: Record<string, unknown> = {};
  try {
    manifest = JSON.parse(readFileSync(`${dir}/manifest.json`, "utf8"));
  } catch {
    problems.push("manifest.json missing or unreadable (run the build first)");
  }

  if (problems.length === 0) {
    if (manifest.manifest_version !== 3) problems.push("manifest_version is not 3");
    if (JSON.stringify(manifest.permissions) !== '["storage"]') {
      problems.push(
        `permissions must be exactly ["storage"], got ${JSON.stringify(manifest.permissions)}`,
      );
    }
    for (const key of forbidden) {
      if (key in manifest) problems.push(`must not declare ${key}`);
    }
    const overrides = manifest.chrome_url_overrides as { newtab?: string } | undefined;
    if (!overrides?.newtab) problems.push("chrome_url_overrides.newtab is missing");

    if (dir.includes("firefox")) {
      const gecko = (manifest.browser_specific_settings as { gecko?: Record<string, unknown> })
        ?.gecko;
      const required = (gecko?.data_collection_permissions as { required?: unknown } | undefined)
        ?.required;
      if (JSON.stringify(required) !== '["none"]') {
        problems.push('gecko.data_collection_permissions.required must be ["none"]');
      }
    }
  }

  console.log(dir);
  if (problems.length === 0) console.log("  ok   storage-only, no background/host/content scripts");
  for (const problem of problems) console.log(`  FAIL ${problem}`);
  if (problems.length > 0) failed = true;
}

process.exit(failed ? 1 : 0);
