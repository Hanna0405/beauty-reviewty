// scripts/clear-cache.js
// Universal cache cleanup script for Next.js builds
const fs = require('fs');
const path = require('path');

const root = process.cwd();

// Cache directories to clean
const cacheDirs = [
  path.join(root, '.next', 'cache'),
  path.join(root, '.next'),
  path.join(root, '.turbo'),
  path.join(root, 'node_modules', '.cache'),
];

// Parse command line arguments
const args = process.argv.slice(2);
const aggressive = args.includes('--aggressive') || args.includes('-a');

function deleteDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return false;
  }

  try {
    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) {
      return false;
    }

    // Delete directory contents recursively
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        deleteDir(fullPath);
      } else {
        fs.unlinkSync(fullPath);
      }
    }
    fs.rmdirSync(dirPath);
    return true;
  } catch (error) {
    // Silently ignore errors (directory might be locked or not exist)
    return false;
  }
}

function clearCache() {
  let cleared = 0;

  if (aggressive) {
    // Aggressive mode: clear all cache directories
    cacheDirs.forEach((dir) => {
      if (deleteDir(dir)) {
        cleared++;
      }
    });
  } else {
    // Standard mode: always clear .next/cache
    const cacheDir = cacheDirs[0];
    if (deleteDir(cacheDir)) {
      cleared++;
    }
  }

  // Only log if something was actually cleared
  if (cleared > 0) {
    const mode = aggressive ? 'aggressive' : 'standard';
    console.log(`[clear-cache] Cleared ${cleared} cache directory(ies) (${mode} mode)`);
  }
}

clearCache();

