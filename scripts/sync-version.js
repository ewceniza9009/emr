const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const manifestPath = path.join(rootDir, 'version-manifest.json');
const clientPackagePath = path.join(rootDir, 'emr-client', 'package.json');
const changelogMdPath = path.join(rootDir, 'CHANGELOG.md');
const clientDataPath = path.join(rootDir, 'emr-client', 'src', 'data', 'changelog.json');

// 1. Read Manifest
if (!fs.existsSync(manifestPath)) {
  console.error('Manifest not found at:', manifestPath);
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

console.log(`[SYNC] Synchronizing Version: ${manifest.version} (Build ${manifest.build})`);

// 2. Update Client Package.json
if (fs.existsSync(clientPackagePath)) {
  const pkg = JSON.parse(fs.readFileSync(clientPackagePath, 'utf8'));
  pkg.version = manifest.version;
  fs.writeFileSync(clientPackagePath, JSON.stringify(pkg, null, 2) + '\n');
  console.log('[SYNC] Updated emr-client/package.json');
}

// 3. Update Client Data Store
const dataDir = path.dirname(clientDataPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
fs.writeFileSync(clientDataPath, JSON.stringify(manifest, null, 2) + '\n');
console.log('[SYNC] Updated emr-client/src/data/changelog.json');

// 4. Regenerate CHANGELOG.md
let changelogMd = '# Changelog\n\nAll notable changes to the Halkyone Clinical OS will be documented in this file.\n';

manifest.changelog.forEach(entry => {
  changelogMd += `\n## [${entry.v.replace(/^v/, '')}] - ${entry.date}\n`;
  entry.items.forEach(item => {
    changelogMd += `- ${item}\n`;
  });
});

fs.writeFileSync(changelogMdPath, changelogMd);
console.log('[SYNC] Updated CHANGELOG.md');

console.log('[SYNC] Done. Repository synchronized.');
