import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const configPath = join(
  root,
  "src-capacitor/android/app/src/main/assets/capacitor.config.json"
);

if (!existsSync(configPath)) {
  console.log("No capacitor.config.json in Android assets yet; skip strip.");
  process.exit(0);
}

const raw = readFileSync(configPath, "utf8");
let config;
try {
  config = JSON.parse(raw);
} catch (err) {
  console.error("Failed to parse capacitor.config.json:", err);
  process.exit(1);
}

let changed = false;

if (config.server) {
  delete config.server;
  changed = true;
  console.log("Stripped live-reload server block from capacitor.config.json");
}

if (config.backgroundColor !== "#030f08") {
  config.backgroundColor = "#030f08";
  changed = true;
  console.log("Set Capacitor backgroundColor to #030f08");
}

if (changed) {
  writeFileSync(configPath, `${JSON.stringify(config, null, "\t")}\n`);
} else {
  console.log("capacitor.config.json already production-safe");
}
