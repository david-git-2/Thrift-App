import { existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const targets = [
  join(root, "src-capacitor/www"),
  join(root, "src-capacitor/android/app/src/main/assets/public"),
  join(root, "dist/spa")
];

for (const target of targets) {
  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
    console.log(`Removed ${target}`);
  }
}

const strip = spawnSync(
  process.execPath,
  [join(root, "scripts/strip-capacitor-server-url.mjs")],
  { stdio: "inherit" }
);
if (strip.status !== 0) {
  process.exit(strip.status ?? 1);
}

console.log("Android build caches cleared.");
