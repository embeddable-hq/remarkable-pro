#!/usr/bin/env node
/* eslint-env node */
/**
 * parse-changelog.js
 *
 * Reads CHANGELOG.md (Changesets format) and writes:
 *   - /tmp/changelog-parsed.json  — all versions as structured JSON
 *   - /tmp/changelog-latest.json  — just the most recent version entry
 *
 * Changesets CHANGELOG.md format:
 *
 *   # @embeddable.com/remarkable-pro
 *
 *   ## 0.1.15
 *
 *   ### Minor Changes
 *   - abc123: Add new KPI tile variant
 *
 *   ### Patch Changes
 *   - def456: Fix tooltip overflow on small screens
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
const raw = fs.readFileSync(changelogPath, 'utf-8');
const lines = raw.split('\n');

const versions = [];
let currentVersion = null;
let currentSections = {};
let currentSection = null;
let currentItems = [];

function flushSection() {
  if (currentSection && currentItems.length > 0) {
    currentSections[currentSection] = [...currentItems];
  }
  currentItems = [];
}

function flushVersion() {
  if (currentVersion) {
    flushSection();
    versions.push({
      version: currentVersion,
      sections: { ...currentSections },
      // Reconstruct raw markdown for this version block
      markdown: buildVersionMarkdown(currentVersion, currentSections),
    });
  }
  currentSections = {};
  currentSection = null;
  currentItems = [];
}

function buildVersionMarkdown(version, sections) {
  const sectionOrder = ['Major Changes', 'Minor Changes', 'Patch Changes'];
  let md = '';
  for (const heading of sectionOrder) {
    if (sections[heading] && sections[heading].length > 0) {
      md += `\n### ${heading}\n\n`;
      for (const item of sections[heading]) {
        // Strip the changeset hash prefix (e.g. "abc123: ") if present
        const cleaned = item.replace(/^-\s+[a-f0-9]+:\s+/, '- ');
        md += `${cleaned}\n`;
      }
    }
  }
  return md.trim();
}

for (const line of lines) {
  // Version header: "## 0.1.15" or "## 0.1.15-beta.1"
  const versionMatch = line.match(/^## (\d+\.\d+\.\d+(?:[-+][a-zA-Z0-9._-]*)?)\s*$/);
  if (versionMatch) {
    flushVersion();
    currentVersion = versionMatch[1];
    continue;
  }

  // Section header: "### Minor Changes"
  const sectionMatch = line.match(/^### (.+)$/);
  if (sectionMatch && currentVersion) {
    flushSection();
    currentSection = sectionMatch[1];
    continue;
  }

  // Bullet item
  if (line.startsWith('- ') && currentSection) {
    currentItems.push(line);
    continue;
  }

  // Continuation of previous bullet (indented)
  if ((line.startsWith('  ') || line.startsWith('\t')) && currentSection && currentItems.length > 0) {
    currentItems[currentItems.length - 1] += ' ' + line.trim();
  }
}

flushVersion(); // flush the last version

if (versions.length === 0) {
  console.error('No versions found in CHANGELOG.md');
  process.exit(1);
}

const tmpDir = process.env.RUNNER_TEMP ?? '/tmp';

// Write all versions
fs.writeFileSync(`${tmpDir}/changelog-parsed.json`, JSON.stringify(versions, null, 2));

// Write latest version only
fs.writeFileSync(`${tmpDir}/changelog-latest.json`, JSON.stringify(versions[0], null, 2));

console.log(`✅ Parsed ${versions.length} versions. Latest: ${versions[0].version}`);
console.log(`   Sections: ${Object.keys(versions[0].sections).join(', ')}`);