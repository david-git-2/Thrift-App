import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
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

console.log("Android build caches cleared.");
