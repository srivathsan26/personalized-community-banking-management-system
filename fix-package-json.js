#!/usr/bin/env node

/**
 * Fix package.json - Remove duplicate/problematic package:zip entries
 */

const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, 'package.json');
let content = fs.readFileSync(packagePath, 'utf8');

// Count occurrences of package:zip
const matches = content.match(/"package:zip"/g);
console.log(`Found ${matches ? matches.length : 0} occurrences of "package:zip"`);

// Remove the powershell version (line 19 equivalent)
// Look for the pattern: "package:zip": "powershell...
const powerShellPattern = /"package:zip":\s*"powershell[^"]*"[,]?/;
if (powerShellPattern.test(content)) {
  console.log('Removing PowerShell version...');
  content = content.replace(powerShellPattern, '');
  
  // Clean up any double commas or spaces
  content = content.replace(/,\s*,/g, ',');
  content = content.replace(/,\s*\n\s*\}/g, '\n  }');
  
  fs.writeFileSync(packagePath, content, 'utf8');
  console.log('✓ package.json fixed!');
} else {
  console.log('No PowerShell package:zip found - file appears clean');
}

// Validate JSON
try {
  JSON.parse(content);
  console.log('✓ JSON is valid');
} catch (e) {
  console.error('ERROR: JSON is invalid after fix:', e.message);
  process.exit(1);
}
