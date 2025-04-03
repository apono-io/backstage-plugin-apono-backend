/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const packageJson = require('../package.json');

const versionFilePath = path.join(__dirname, '../src/version.ts');
const content = `export const VERSION = '${packageJson.version}';\n`;

fs.writeFileSync(versionFilePath, content, 'utf-8');

// Stage the version file
require('child_process').execSync('git add src/version.ts');

// Check if there are any changes to commit
try {
  const status = require('child_process').execSync('git status --porcelain src/version.ts', { encoding: 'utf-8' });

  // Only commit if there are changes
  if (status.length > 0) {
    require('child_process').execSync('git commit -m "chore: update version.ts [skip ci]"');
  } else {
    console.log('No changes to version.ts, skipping commit');
  }
} catch (error) {
  console.error('Error during git operations:', error);
  process.exit(1);
}
