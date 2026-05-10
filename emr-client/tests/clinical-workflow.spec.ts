import { test, expect } from '@playwright/test';

test.describe('Halcyon Clinical OS - Critical Paths', () => {

  // Luxury Clinical Authentication: Every tactical scan requires a secure session
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    
    // Diagnostic Logging: Capture browser-side errors
    page.on('console', msg => {
        if (msg.type() === 'error') console.log(`[BROWSER ERROR] ${msg.text()}`);
    });
    
    await page.getByPlaceholder('name@halcyon.clinical').fill('admin@palliative.emr');
    await page.getByPlaceholder('••••••••').fill('P@ssword123!');
    
    const signInButton = page.getByRole('button', { name: /Sign in to Workspace/i });
    await expect(signInButton).toBeEnabled();
    await signInButton.click();
    
    // Wait for the dashboard to hydrate (Clinical OS can be heavy on initial load)
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 30000 });
  });

  test('should load the dashboard and verify clinical metrics', async ({ page }) => {
    await page.goto('/dashboard');
    
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
    await page.goto('/dashboard/schedule');
    
    // Verify scheduling interface
    await expect(page.getByRole('heading', { name: /Clinical Scheduling/i })).toBeVisible();
    
    // Check for "New Encounter" button in the schedule view
    const newEncounterBtn = page.getByRole('button', { name: /New Encounter/i }).first();
    await expect(newEncounterBtn).toBeVisible();
  });

  test('should navigate to telemetry hub and verify node status', async ({ page }) => {
    await page.goto('/dashboard/telemetry');
    
    // Verify telemetry interface
    await expect(page.getByRole('heading', { name: /Clinical Telemetry/i })).toBeVisible();
    
    // Check for the "Scan Clinical Grid" button
    const scanBtn = page.getByRole('button', { name: /Scan Clinical Grid/i });
    await expect(scanBtn).toBeVisible();
  });

});
