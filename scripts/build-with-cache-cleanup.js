// scripts/build-with-cache-cleanup.js
// Enhanced build script that handles cache cleanup and warning detection
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = process.cwd();

// Cache directories to clean
const cacheDirs = [
  path.join(root, '.next', 'cache'),
  path.join(root, '.next'),
  path.join(root, '.turbo'),
  path.join(root, 'node_modules', '.cache'),
];

function deleteDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return false;
  }

  try {
    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) {
      return false;
    }

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
    return false;
  }
}

function clearAllCaches() {
  let cleared = 0;
  cacheDirs.forEach((dir) => {
    if (deleteDir(dir)) {
      cleared++;
    }
  });
  if (cleared > 0) {
    console.log(`[clear-cache] Cleared ${cleared} cache directory(ies) (aggressive mode)`);
  }
}

function runBuild(isRetry = false) {
  return new Promise((resolve, reject) => {
    // Use next build directly to avoid triggering prebuild hook again
    const buildProcess = spawn('npx', ['next', 'build'], {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true,
      cwd: root,
    });

    let output = '';
    let hasWarnings = false;

    // Capture stdout to detect warnings
    buildProcess.stdout.on('data', (data) => {
      const text = data.toString();
      process.stdout.write(text); // Forward to console
      output += text;
      // Check for webpack cache or deserialization warnings
      if (
        /webpack.*cache/i.test(text) ||
        /deserialization/i.test(text) ||
        /cache.*warning/i.test(text) ||
        /Failed to deserialize/i.test(text)
      ) {
        hasWarnings = true;
      }
    });

    // Capture stderr to detect warnings
    buildProcess.stderr.on('data', (data) => {
      const text = data.toString();
      process.stderr.write(text); // Forward to console
      output += text;
      if (
        /webpack.*cache/i.test(text) ||
        /deserialization/i.test(text) ||
        /cache.*warning/i.test(text) ||
        /Failed to deserialize/i.test(text)
      ) {
        hasWarnings = true;
      }
    });

    buildProcess.on('close', (code) => {
      if (code === 0) {
        if (hasWarnings && !isRetry) {
          console.log('\n[build-with-cache-cleanup] Cache warning detected. Clearing all caches and retrying...');
          clearAllCaches();
          // Retry build once
          runBuild(true).then(resolve).catch(reject);
        } else {
          resolve();
        }
      } else {
        reject(new Error(`Build failed with exit code ${code}`));
      }
    });

    buildProcess.on('error', (error) => {
      reject(error);
    });
  });
}

// Main execution
async function main() {
  try {
    await runBuild();
  } catch (error) {
    console.error('[build-with-cache-cleanup] Build failed:', error.message);
    process.exit(1);
  }
}

main();

