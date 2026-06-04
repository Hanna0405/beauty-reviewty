/**
 * Generate BeautyReviewty Android launcher icons and splash screens.
 * Run: node scripts/generate-android-assets.js
 */
const fs = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error('Install sharp: npm install sharp --save-dev');
  process.exit(1);
}

const ROOT = path.join(__dirname, '..');
const SVG = path.join(ROOT, 'public', 'icons', 'br-icon-512.svg');
const RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');

const SPLASH_BG = { r: 255, g: 245, b: 247, alpha: 1 }; // #fff5f7

const LAUNCHER = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

const FOREGROUND = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

const SPLASH_PORT = {
  'drawable-port-mdpi': [320, 480],
  'drawable-port-hdpi': [480, 800],
  'drawable-port-xhdpi': [720, 1280],
  'drawable-port-xxhdpi': [1080, 1920],
  'drawable-port-xxxhdpi': [1440, 2560],
};

const SPLASH_LAND = {
  'drawable-land-mdpi': [480, 320],
  'drawable-land-hdpi': [800, 480],
  'drawable-land-xhdpi': [1280, 720],
  'drawable-land-xxhdpi': [1920, 1080],
  'drawable-land-xxxhdpi': [2560, 1440],
};

async function iconPng(svgBuffer, size) {
  return sharp(svgBuffer).resize(size, size).png().toBuffer();
}

/** Adaptive foreground: logo ~72% of canvas, transparent outside circle. */
async function foregroundPng(svgBuffer, canvas) {
  const logo = Math.round(canvas * 0.72);
  const buf = await iconPng(svgBuffer, logo);
  return sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: buf, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function splashPng(svgBuffer, width, height) {
  const logo = Math.round(Math.min(width, height) * 0.28);
  const buf = await iconPng(svgBuffer, logo);
  return sharp({
    create: { width, height, channels: 4, background: SPLASH_BG },
  })
    .composite([{ input: buf, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function write(dir, name, buffer) {
  const folder = path.join(RES, dir);
  fs.mkdirSync(folder, { recursive: true });
  await fs.promises.writeFile(path.join(folder, name), buffer);
}

async function main() {
  if (!fs.existsSync(SVG)) {
    console.error('Missing:', SVG);
    process.exit(1);
  }
  const svg = fs.readFileSync(SVG);

  for (const [folder, size] of Object.entries(LAUNCHER)) {
    const buf = await iconPng(svg, size);
    await write(folder, 'ic_launcher.png', buf);
    await write(folder, 'ic_launcher_round.png', buf);
    console.log(`✓ ${folder}/ic_launcher.png (${size}px)`);
  }

  for (const [folder, size] of Object.entries(FOREGROUND)) {
    const buf = await foregroundPng(svg, size);
    await write(folder, 'ic_launcher_foreground.png', buf);
    console.log(`✓ ${folder}/ic_launcher_foreground.png (${size}px)`);
  }

  for (const [folder, [w, h]] of Object.entries(SPLASH_PORT)) {
    const buf = await splashPng(svg, w, h);
    await write(folder, 'splash.png', buf);
    console.log(`✓ ${folder}/splash.png (${w}x${h})`);
  }

  for (const [folder, [w, h]] of Object.entries(SPLASH_LAND)) {
    const buf = await splashPng(svg, w, h);
    await write(folder, 'splash.png', buf);
    console.log(`✓ ${folder}/splash.png (${w}x${h})`);
  }

  const defaultSplash = await splashPng(svg, 1080, 1920);
  await write('drawable', 'splash.png', defaultSplash);
  console.log('✓ drawable/splash.png (1080x1920)');

  console.log('\nAndroid assets generated.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
