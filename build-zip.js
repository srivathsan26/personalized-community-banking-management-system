#!/usr/bin/env node

/**
 * Create distribution zip package
 * Compresses Windows installer into distributable zip file
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const RELEASE_DIR = path.join(process.cwd(), 'release-new');
const DIST_DIR = path.join(process.cwd(), 'dist-package');
const INSTALLER_NAME = 'Gramin Connect Hub-Setup-1.0.0.exe';
const ZIP_NAME = 'Gramin-Connect-Hub-Setup.zip';

const INSTALLER_PATH = path.join(RELEASE_DIR, INSTALLER_NAME);
const ZIP_PATH = path.join(DIST_DIR, ZIP_NAME);

// Create dist-package directory if it doesn't exist
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// Check if installer exists
if (!fs.existsSync(INSTALLER_PATH)) {
  console.error(`\n❌ ERROR: Installer not found at:`);
  console.error(`   ${INSTALLER_PATH}\n`);
  console.error('Run "npm run desktop:build" first to create the installer.\n');
  process.exit(1);
}

console.log('\n📦 Creating distribution package...');
console.log(`   Source: ${INSTALLER_PATH}`);
console.log(`   Target: ${ZIP_PATH}\n`);

try {
  // Use appropriate command based on platform
  if (process.platform === 'win32') {
    // Windows: use PowerShell or cmd
    try {
      // Try PowerShell first
      execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${INSTALLER_PATH}' -DestinationPath '${ZIP_PATH}' -Force"`, {
        stdio: 'pipe',
        shell: 'cmd'
      });
      console.log('✅ Zip created successfully!');
      const size = (fs.statSync(ZIP_PATH).size / (1024 * 1024)).toFixed(1);
      console.log(`   File: ${ZIP_PATH}`);
      console.log(`   Size: ${size}MB\n`);
    } catch (psError) {
      console.error('⚠️  PowerShell compression failed, trying alternative method...\n');
      // Fallback: use archiver if available or provide instructions
      tryAlternative();
    }
  } else {
    // Linux/Mac: use zip
    execSync(`zip -q -j "${ZIP_PATH}" "${INSTALLER_PATH}"`, {
      stdio: 'inherit'
    });
    console.log('✅ Zip created successfully!');
    const size = (fs.statSync(ZIP_PATH).size / (1024 * 1024)).toFixed(1);
    console.log(`   File: ${ZIP_PATH}`);
    console.log(`   Size: ${size}MB\n`);
  }

  // Final verification
  if (!fs.existsSync(ZIP_PATH)) {
    throw new Error('Zip file was created but cannot be verified');
  }
} catch (error) {
  console.error(`\n❌ ERROR: ${error.message}\n`);
  process.exit(1);
}

function tryAlternative() {
  try {
    import('archiver').then((archiverModule) => {
      const archiver = archiverModule.default;
      const output = fs.createWriteStream(ZIP_PATH);
      const archive = archiver('zip', { zlib: { level: 6 } });

      archive.on('error', (err) => {
        console.error(`\n❌ Archive error: ${err.message}\n`);
        process.exit(1);
      });

      output.on('close', () => {
        console.log('✅ Zip created successfully!');
        const size = (fs.statSync(ZIP_PATH).size / (1024 * 1024)).toFixed(1);
        console.log(`   File: ${ZIP_PATH}`);
        console.log(`   Size: ${size}MB\n`);
      });

      archive.pipe(output);
      archive.file(INSTALLER_PATH, { name: INSTALLER_NAME });
      archive.finalize();
    }).catch((archiveError) => {
      console.error('\n❌ ERROR: Unable to create zip file\n');
      console.error('Please install one of:');
      console.error('  - PowerShell 5+ (Windows)');
      console.error('  - zip command (Linux/Mac)');
      console.error('  - npm package: npm install archiver --save-dev\n');
      process.exit(1);
    });
  } catch (archiveError) {
    console.error('\n❌ ERROR: Unable to create zip file\n');
    console.error('Please install one of:');
    console.error('  - PowerShell 5+ (Windows)');
    console.error('  - zip command (Linux/Mac)');
    console.error('  - npm package: npm install archiver --save-dev\n');
    process.exit(1);
  }
}
