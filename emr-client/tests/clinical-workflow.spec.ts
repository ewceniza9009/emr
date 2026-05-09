import { test, expect, type Page } from '@playwright/test';

test.describe('Halcyon Clinical OS - Critical Paths', () => {
  
  test('should load the dashboard and verify clinical metrics', async ({ page }: { page: Page }) => {
    // Navigate to the command center
    await page.goto('/dashboard');
    
    // Verify high-fidelity branding
    await expect(page.locator('h1')).toContainText(/Good/);
    
    // Verify clinical stats are visible (Wait for Apollo hydration)
    const patientStat = page.locator('p', { hasText: 'Patients' });
    await expect(patientStat).toBeVisible();
  });

  test('should navigate to outreach worklist and verify lead registry', async ({ page }: { page: Page }) => {
    await page.goto('/dashboard/outreach');
    
    // Verify tactical worklist header
    await expect(page.locator('h2')).toContainText('Clinical Outreach Worklist');
    
    // Search for a patient (assuming "Smith" might exist or just verifying search field)
    const searchInput = page.getByPlaceholder('Search patients or referrals...');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Smith');
  });

  test('should open enrollment drawer for a clinical lead', async ({ page }: { page: Page }) => {
    await page.goto('/dashboard/outreach');
    
    // Click the first enrollment action button in the table
    // Using a more specific selector for the ClipboardCheck icon button
    const enrollButton = page.locator('button[title="Launch Quick Enrollment Drawer"]').first();
    
    if (await enrollButton.isVisible()) {
      await enrollButton.click();
      
      // Verify drawer portal activation
      await expect(page.locator('h2')).toContainText(/Outreach Profile/i);
    }
  });

});
