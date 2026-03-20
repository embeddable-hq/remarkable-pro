import { chromium } from '@playwright/test';
import fs from 'fs';
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
    await new Promise((r) => setTimeout(r, 1000));
  } catch {
    // No processes to kill — continue
  }

  // Use a persistent profile so login, permissions and preferences are saved across runs
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    args: ['--no-first-run', '--no-default-browser-check'],
  });

  const page = await context.newPage();

  // First run — may need to log in manually
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

  console.log('Looking for "Create new embeddable" button...');
  const createNewBtn = page.locator('button', { hasText: /create new embeddable/i });
  await createNewBtn.waitFor({ timeout: 15000 });
  await createNewBtn.scrollIntoViewIfNeeded();
  await createNewBtn.click();
  console.log('Clicked "Create new embeddable". Waiting for next page...');

  await page.waitForSelector('button', { timeout: 30000 });
  console.log(`New page URL: ${page.url()}`);

  console.log('Looking for "Add Component" button...');
  const addComponentBtn = page.locator('button', { hasText: /add component/i });
  await addComponentBtn.waitFor({ timeout: 15000 });
  await addComponentBtn.click();
  console.log('Clicked "Add Component".');

  console.log(`Searching for "${componentName}" component...`);
  const searchInput = page.locator('input[placeholder="Search components"]');
  await searchInput.waitFor({ timeout: 15000 });
  await searchInput.fill(componentName);

  console.log('Selecting first result...');
  const firstSelect = page.locator('button', { hasText: /select/i }).first();
  await firstSelect.waitFor({ timeout: 15000 });
  await firstSelect.click();
  console.log('Component selected.');

  console.log('Filling in required fields...');

  // Fill Title with "test"
  const titleInput = page.locator('input[placeholder="No value"]').first();
  await titleInput.waitFor({ timeout: 10000 });
  await titleInput.fill('test');

  // Select first option in all required select fields
  const requiredSelects = page.locator('text=Required ~ * select, .select__control').all();
  const selects = page.locator('[class*="select"]').filter({ hasText: 'Select...' });
  const selectCount = await selects.count();

  // Handle Dataset field — click it and either select first option or create dataset
  console.log('Handling Dataset field...');
  const datasetSelect = selects.nth(0);
  await datasetSelect.click();

  try {
    const firstOption = page.locator('[class*="option"]').first();
    await firstOption.waitFor({ timeout: 3000 });
    await firstOption.click();
    console.log('Selected existing dataset.');
  } catch {
    // No existing options — click "Create dataset"
    const createDatasetBtn = page.locator('button', { hasText: /create dataset/i });
    await createDatasetBtn.waitFor({ timeout: 5000 });
    await createDatasetBtn.click();
    console.log('Clicked "Create dataset".');
  }

  // Select first option in remaining required select fields
  for (let i = 1; i < selectCount; i++) {
    const select = selects.nth(i);
    await select.click();
    const firstOption = page.locator('[class*="option"]').first();
    await firstOption.waitFor({ timeout: 5000 });
    await firstOption.click();
    console.log(`Selected first option in field ${i + 1}`);
  }

  console.log('Clicking "Add to dashboard"...');
  const addBtn = page.locator('button', { hasText: /add to dashboard/i });
  await addBtn.waitFor({ timeout: 10000 });
  await addBtn.click();
  console.log('Component added to dashboard!');

  // Keep browser open for further interactions
})();
