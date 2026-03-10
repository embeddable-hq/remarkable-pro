#!/usr/bin/env node
/* eslint-env node */
/**
 * update-handbook-changelog.js
 *
 * Reads /tmp/changelog-latest.json and prepends a new version block
 * to handbook/pages/changelog.mdx.
 *
 * Env vars (set by the GitHub Actions workflow):
 *   RELEASE_VERSION  — e.g. "v0.1.15"
 *   RELEASE_DATE     — e.g. "2026-03-10"
 *   RELEASE_URL      — GitHub release URL
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const tmpDir = process.env.RUNNER_TEMP ?? '/tmp';
const latest = JSON.parse(fs.readFileSync(`${tmpDir}/changelog-latest.json`, 'utf-8'));
const handbookPath = path.join(process.cwd(), 'handbook', 'pages', 'component-libraries', 'remarkable-pro', 'changelog.mdx');

// Strip leading "v" if present for display
const rawVersion = process.env.RELEASE_VERSION || latest.version;
const version = rawVersion.replace(/^v/, '');
const date = process.env.RELEASE_DATE || new Date().toISOString().split('T')[0];
const releaseUrl = process.env.RELEASE_URL || `https://github.com/embeddable-hq/remarkable-pro/releases/tag/v${version}`;
const npmUrl = `https://www.npmjs.com/package/@embeddable.com/remarkable-pro/v/${version}`;



// Build the MDX entry for this version
function buildEntry() {
  const sections = latest.sections;
  const sectionOrder = ['Major Changes', 'Minor Changes', 'Patch Changes'];

  let content = '';
  for (const heading of sectionOrder) {
    if (sections[heading] && sections[heading].length > 0) {
      const labels = {
        'Major Changes': '🚨 Breaking changes',
        'Minor Changes': '✨ Changes',
        'Patch Changes': '✨ Changes',
      };
      content += `#### ${labels[heading] || heading}\n\n`;
      for (const item of sections[heading]) {
        // Clean changeset hash prefix
        const cleaned = item.replace(/^-\s+[a-f0-9]{7,}:\s+/, '- ');
        content += `${cleaned}\n`;
      }
      content += '\n';
    }
  }

  return `### v${version} - ${date}

- View [GitHub release](${releaseUrl})
- View [npm](${npmUrl})

${content.trim()}

---
`;
}

const newEntry = buildEntry();
const marker = '## Changelog entries';

const existing = fs.readFileSync(handbookPath, 'utf-8');

if (!existing.includes(marker)) {
  console.error(`❌ Marker "${marker}" not found in ${handbookPath}. Aborting.`);
  process.exit(1);
}

const updated = existing.replace(marker, `${marker}\n\n${newEntry}`);

fs.writeFileSync(handbookPath, updated);
console.log(`✅ Updated handbook/pages/component-libraries/remarkable-pro/changelog.mdx with v${version}`);