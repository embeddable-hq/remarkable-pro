// scripts/process-css-variables.js
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// Configuration
const sourcePath = path.join(process.cwd(), 'src/theme/styles/styles.constants.ts');
const mainCssPath = path.join(process.cwd(), 'dist/remarkable-pro.css');
const tempDir = path.join(process.cwd(), 'temp-css-vars');

// Cleanup function
const cleanup = () => {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
};

try {
  // Validate source file exists
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source file not found: ${sourcePath}`);
  }

  // Create temp directory
  fs.mkdirSync(tempDir, { recursive: true });

  // Mark temp dir as ESM so Node treats compiled JS as a module
  fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ type: 'module' }));

  // Compile TS → ESM JS with bundler resolution
  execSync(
    `npx tsc "${sourcePath}" ` +
      `--outDir "${tempDir}" ` +
      `--target es2022 ` +
      `--module es2022 ` +
      `--moduleResolution bundler`,
    { stdio: 'inherit' },
  );

  // Path to compiled JS
  const tempCompiledPath = path.join(tempDir, 'styles.constants.js');
  const moduleUrl = pathToFileURL(tempCompiledPath).href;

  // Top-level await is allowed in ESM
  const { remarkableThemeStyles } = await import(moduleUrl);

  if (
    !remarkableThemeStyles ||
    typeof remarkableThemeStyles !== 'object' ||
    Object.keys(remarkableThemeStyles).length === 0
  ) {
    throw new Error('No valid remarkableThemeStyles found in constants file');
  }

  // Generate CSS variables
  const cssVariables =
    `:root {\n` +
    Object.entries(remarkableThemeStyles)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n') +
    `\n}`;

  // Merge with main CSS file
  if (!fs.existsSync(mainCssPath)) {
    throw new Error('Main CSS file not found. Run embeddable buildPackage first.');
  }

  const mainCss = fs.readFileSync(mainCssPath, 'utf8');
  fs.writeFileSync(mainCssPath, cssVariables + '\n' + mainCss);

  console.log(`✔ Merged CSS variables into remarkable-ui.css: ${mainCssPath}`);
} catch (error) {
  console.error('❌ Error processing CSS variables:');
  console.error(`   ${error.message}`);
  console.error('');
  console.error('Please check:');
  console.error('   1. Source file exists: src/theme/styles/styles.constants.ts');
  console.error('   2. Main CSS file exists: dist/remarkable-ui.css');
  console.error('   3. Write permissions to dist directory');
  console.error('   4. TypeScript is installed');
  process.exit(1);
} finally {
  cleanup();
}
