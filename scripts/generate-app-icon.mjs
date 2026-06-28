import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const resourcesDir = join(root, "resources");
const androidRes = join(root, "src-capacitor/android/app/src/main/res");

mkdirSync(resourcesDir, { recursive: true });

const iconOnlySvg = readFileSync(join(resourcesDir, "icon-only.svg"));
const iconSvg = readFileSync(join(resourcesDir, "icon.svg"));

await sharp(iconOnlySvg)
  .resize(1024, 1024)
  .png()
  .toFile(join(resourcesDir, "icon-only.png"));
await sharp(iconSvg)
  .resize(1024, 1024)
  .png()
  .toFile(join(resourcesDir, "icon.png"));

const legacySizes = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192
};

for (const [folder, size] of Object.entries(legacySizes)) {
  const dir = join(androidRes, folder);
  mkdirSync(dir, { recursive: true });

  const png = await sharp(iconSvg).resize(size, size).png().toBuffer();
  writeFileSync(join(dir, "ic_launcher.png"), png);
  writeFileSync(join(dir, "ic_launcher_round.png"), png);
}

console.log("Generated Android launcher PNGs and resources/icon.png");
