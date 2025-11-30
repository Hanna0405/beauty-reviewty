/**
 * Script to generate PNG icons from SVG for PWA
 * Run with: node scripts/generate-pwa-icons.js
 * Requires: sharp (npm install sharp --save-dev)
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('Error: sharp is required. Install it with: npm install sharp --save-dev');
  process.exit(1);
}

const publicDir = path.join(__dirname, '..', 'public');
const iconsDir = path.join(publicDir, 'icons');
const svgPath = path.join(iconsDir, 'br-icon-192.svg');

if (!fs.existsSync(svgPath)) {
  console.error(`Error: SVG file not found at ${svgPath}`);
  process.exit(1);
}

async function generateIcons() {
  try {
    // Read SVG
    const svgBuffer = fs.readFileSync(svgPath);

    // Generate 192x192 PNG
    await sharp(svgBuffer)
      .resize(192, 192)
      .png()
      .toFile(path.join(iconsDir, 'br-icon-192.png'));

    console.log('✓ Generated br-icon-192.png');

    // Generate 512x512 PNG
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile(path.join(iconsDir, 'br-icon-512.png'));

    console.log('✓ Generated br-icon-512.png');

    // Generate 180x180 apple-touch-icon
    await sharp(svgBuffer)
      .resize(180, 180)
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));

    console.log('✓ Generated apple-touch-icon.png');
    console.log('\nAll PWA icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();

