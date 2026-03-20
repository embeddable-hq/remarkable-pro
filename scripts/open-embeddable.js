import { chromium } from '@playwright/test';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROFILE_DIR = path.join(__dirname, '../.playwright-profile');

const url = process.argv[2];
const componentName = process.argv[3];

if (!url || !componentName) {
  console.error('Usage: node scripts/open-embeddable.js <workspace-url> <component-name>');
  process.exit(1);
}

(async () => {
  // Kill any leftover Playwright browser processes before launching
  try {
    execSync('pkill -f "Google Chrome for Testing"', { stdio: 'ignore' });
    await new Promise(r => setTimeout(r, 1000));
  } catch {
    // No processes to kill — continue
  }

  // Use a persistent profile so login, permissions and preferences are saved across runs
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    args: ['--no-first-run', '--no-default-browser-check'],
  });

  const page = await context.newPage();

  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // If not logged in, wait for manual login
  if (page.url().includes('auth') || page.url().includes('login')) {
    console.log('Please log in manually in the browser window...');
    await page.waitForURL('**/workspace/**', { timeout: 120000 });
    console.log('Logged in! Profile saved for future runs.');
  }

  console.log('Waiting for page content to render...');
  await page.waitForSelector('button', { timeout: 30000 });

  // Accept cookie consent if it appears
  try {
    const cookieBtn = page.getByRole('button', { name: /allow all/i });
    await cookieBtn.waitFor({ timeout: 3000 });
    await cookieBtn.click();
    console.log('Cookie consent accepted.');
  } catch {
    // No cookie banner — continue
  }

  // Step 1 — Create new embeddable
  console.log('Looking for "Create new embeddable" button...');
  const createNewBtn = page.locator('button', { hasText: /create new embeddable/i });
  await createNewBtn.waitFor({ timeout: 15000 });
  await createNewBtn.scrollIntoViewIfNeeded();
  await createNewBtn.click();
  console.log('Clicked "Create new embeddable". Waiting for next page...');
  await page.waitForSelector('button', { timeout: 30000 });
  console.log(`New page URL: ${page.url()}`);

  // Step 2 — Add component
  console.log('Looking for "Add Component" button...');
  const addComponentBtn = page.locator('button', { hasText: /add component/i });
  await addComponentBtn.waitFor({ timeout: 15000 });
  await addComponentBtn.click();
  console.log('Clicked "Add Component".');

  // Step 3 — Search and select component
  console.log(`Searching for "${componentName}" component...`);
  const searchInput = page.locator('input[placeholder="Search components"]');
  await searchInput.waitFor({ timeout: 15000 });
  await searchInput.fill(componentName);

  console.log('Selecting first result...');
  const firstSelect = page.locator('button', { hasText: /select/i }).first();
  await firstSelect.waitFor({ timeout: 15000 });
  await firstSelect.click();
  console.log('Component selected. Page is ready for manual input.');

  // Step 4 — Wait for user to fill in the required fields and click "Add to dashboard"
  console.log('Waiting for "Add to dashboard" to be clicked...');
  await page.waitForSelector('button:not([disabled])', { timeout: 120000 });
  const addBtn = page.locator('button', { hasText: /add to dashboard/i });
  await addBtn.waitFor({ timeout: 120000 });
  await addBtn.click();
  console.log('Component added to dashboard!');

  // Step 5 — Click Preview
  console.log('Clicking "Preview" button...');
  const previewBtn = page.locator('button', { hasText: /preview/i });
  await previewBtn.waitFor({ timeout: 15000 });
  await previewBtn.click();
  console.log('Preview mode activated. Component is ready to view.');

  // Keep browser open for inspection
})();