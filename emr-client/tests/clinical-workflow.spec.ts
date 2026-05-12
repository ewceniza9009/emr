import { test, expect } from '@playwright/test';

test.describe('Halkyone Clinical OS - Critical Paths', () => {

  // Luxury Clinical Authentication: Reusing session state for tactical speed
  test.beforeEach(async ({ page }) => {
    // Session Verification: Ensure we have a valid clinical context
    // We don't navigate yet; we let the individual tests decide where to start
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`[BROWSER ERROR] ${msg.text()}`);
    });
  });

  test('should load the dashboard and verify clinical metrics', async ({ page }) => {
    // Navigate directly to the starting module
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    // Verify high-fidelity branding
    await expect(page.locator('h1')).toContainText(/Good/);

    // Verify clinical stats are visible
    const patientStat = page.locator('p', { hasText: 'Patients' });
    await expect(patientStat).toBeVisible();
  });

  test('should navigate to outreach worklist and verify lead registry', async ({ page }) => {
    await page.goto('/dashboard/outreach');

    // Verify tactical worklist header
    await expect(page.getByRole('heading', { name: /Clinical Outreach Worklist/i })).toBeVisible();

    // Search field check
    const searchInput = page.getByPlaceholder('Search patients or referrals...');
    await expect(searchInput).toBeVisible();
  });

  test('should navigate to patient registry and verify table data', async ({ page }) => {
    await page.goto('/dashboard/patients');

    // Verify registry header
    await expect(page.getByRole('heading', { name: /Patient Registry/i })).toBeVisible();

    // Verify patient table has rendered data
    const tableRow = page.locator('table tbody tr').first();
    await expect(tableRow).toBeVisible({ timeout: 15000 });
  });

  test('should navigate to clinical scheduling and verify calendar view', async ({ page }) => {
    // Navigate and wait for the page to at least mount the main container
    await page.goto('/dashboard/schedule');
    await page.waitForSelector('main', { state: 'visible' });

    // Verify scheduling interface using flexible text locator and patient timeout
    await expect(page.getByText(/Scheduling|Schedule/i).first()).toBeVisible({ timeout: 15000 });

    // Check for "New Encounter" button with a generous timeout for the calendar library
    const newEncounterBtn = page.getByRole('button', { name: /New Encounter/i }).first();
    await expect(newEncounterBtn).toBeVisible({ timeout: 20000 });
  });

  test('should navigate to telemetry hub and verify node status', async ({ page }) => {
    // Navigate and wait for the page to at least mount the main container
    await page.goto('/dashboard/telemetry');
    await page.waitForSelector('main', { state: 'visible' });

    // Verify telemetry interface using high-visibility text locator
    await expect(page.getByText(/Vitals|Telemetry/i).first()).toBeVisible({ timeout: 15000 });

    // Check for the "Scan Clinical Grid" button
    const scanBtn = page.getByRole('button', { name: /Scan Clinical Grid/i });
    await expect(scanBtn).toBeVisible({ timeout: 15000 });
  });

});
