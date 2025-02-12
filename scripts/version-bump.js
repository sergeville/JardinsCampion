#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Bump types
const BUMP_TYPES = {
  patch: 2,
  minor: 1,
  major: 0
};

function getCurrentVersion() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  return packageJson.version;
}

function bumpVersion(currentVersion, type) {
  const parts = currentVersion.split('.').map(Number);
  const idx = BUMP_TYPES[type];
  
  if (idx === undefined) {
    throw new Error('Invalid bump type. Use: major, minor, or patch');
  }

  parts[idx] += 1;
  // Reset all lower version numbers
  for (let i = idx + 1; i < parts.length; i++) {
    parts[i] = 0;
  }

  return parts.join('.');
}

function updatePackageJson(newVersion) {
  const packageJsonPath = 'package.json';
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
}

function updateChangelog(newVersion) {
  const changelogPath = 'CHANGELOG.md';
  const today = new Date().toISOString().split('T')[0];
  const newEntry = `\n## [${newVersion}] - ${today}\n\n### Added\n- \n\n### Changed\n- \n\n### Fixed\n- \n`;
  
  const changelog = fs.readFileSync(changelogPath, 'utf8');
  const updatedChangelog = changelog.replace('# Changelog\n', `# Changelog\n${newEntry}`);
  fs.writeFileSync(changelogPath, updatedChangelog);
}

function createGitTag(version) {
  try {
    execSync(`git tag v${version}`);
    console.log(`Created git tag: v${version}`);
  } catch (error) {
    console.error('Error creating git tag:', error.message);
  }
}

function main() {
  const bumpType = process.argv[2] || 'patch';
  const currentVersion = getCurrentVersion();
  const newVersion = bumpVersion(currentVersion, bumpType);

  console.log(`Bumping version: ${currentVersion} -> ${newVersion}`);

  updatePackageJson(newVersion);
  updateChangelog(newVersion);
  createGitTag(newVersion);

  console.log('\nDone! Please review and update the CHANGELOG.md with your changes.');
  console.log('Then commit the changes and push with tags:');
  console.log(`git add package.json CHANGELOG.md`);
  console.log(`git commit -m "chore(release): bump version to ${newVersion}"`);
  console.log(`git push origin main --tags`);
}

main(); 