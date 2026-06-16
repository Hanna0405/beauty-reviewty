/**
 * Generate all iOS AppIcon sizes from the branded 1024×1024 source.
 * Run: node scripts/generate-ios-app-icon.js
 */
const fs = require("fs");
const path = require("path");

let sharp;
try {
  sharp = require("sharp");
} catch {
  console.error("Install sharp: npm install sharp --save-dev");
  process.exit(1);
}

const ROOT = path.join(__dirname, "..");
const ICONSET = path.join(
  ROOT,
  "ios",
  "App",
  "App",
  "Assets.xcassets",
  "AppIcon.appiconset"
);
const SOURCE = path.join(ICONSET, "br-icon-1024.png");

/** Pixel sizes for each AppIcon.appiconset entry (modern + legacy). */
const ICONS = [
  { filename: "icon-20@2x.png", size: 40, idiom: "iphone", scale: "2x", logical: "20x20" },
  { filename: "icon-20@3x.png", size: 60, idiom: "iphone", scale: "3x", logical: "20x20" },
  { filename: "icon-29@2x.png", size: 58, idiom: "iphone", scale: "2x", logical: "29x29" },
  { filename: "icon-29@3x.png", size: 87, idiom: "iphone", scale: "3x", logical: "29x29" },
  { filename: "icon-40@2x.png", size: 80, idiom: "iphone", scale: "2x", logical: "40x40" },
  { filename: "icon-40@3x.png", size: 120, idiom: "iphone", scale: "3x", logical: "40x40" },
  { filename: "icon-60@2x.png", size: 120, idiom: "iphone", scale: "2x", logical: "60x60" },
  { filename: "icon-60@3x.png", size: 180, idiom: "iphone", scale: "3x", logical: "60x60" },
  { filename: "icon-20-ipad.png", size: 20, idiom: "ipad", scale: "1x", logical: "20x20" },
  { filename: "icon-20-ipad@2x.png", size: 40, idiom: "ipad", scale: "2x", logical: "20x20" },
  { filename: "icon-29-ipad.png", size: 29, idiom: "ipad", scale: "1x", logical: "29x29" },
  { filename: "icon-29-ipad@2x.png", size: 58, idiom: "ipad", scale: "2x", logical: "29x29" },
  { filename: "icon-40-ipad.png", size: 40, idiom: "ipad", scale: "1x", logical: "40x40" },
  { filename: "icon-40-ipad@2x.png", size: 80, idiom: "ipad", scale: "2x", logical: "40x40" },
  { filename: "icon-76-ipad.png", size: 76, idiom: "ipad", scale: "1x", logical: "76x76" },
  { filename: "icon-76-ipad@2x.png", size: 152, idiom: "ipad", scale: "2x", logical: "76x76" },
  { filename: "icon-83.5-ipad@2x.png", size: 167, idiom: "ipad", scale: "2x", logical: "83.5x83.5" },
  { filename: "br-icon-1024.png", size: 1024, idiom: "ios-marketing", scale: "1x", logical: "1024x1024" },
];

async function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error("Missing source icon:", SOURCE);
    process.exit(1);
  }

  const source = fs.readFileSync(SOURCE);

  for (const icon of ICONS) {
    const outPath = path.join(ICONSET, icon.filename);
    const buf = await sharp(source).resize(icon.size, icon.size).png().toBuffer();
    await fs.promises.writeFile(outPath, buf);
    console.log(`✓ ${icon.filename} (${icon.size}px)`);
  }

  const images = ICONS.map((icon) => ({
    filename: icon.filename,
    idiom: icon.idiom,
    scale: icon.scale,
    size: icon.logical,
  }));

  const contents = {
    images,
    info: { author: "xcode", version: 1 },
  };

  await fs.promises.writeFile(
    path.join(ICONSET, "Contents.json"),
    `${JSON.stringify(contents, null, 2)}\n`
  );

  console.log("\niOS AppIcon.appiconset generated from br-icon-1024.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
