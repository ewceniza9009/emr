import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Perform clinical login
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Halcyon@Initial!2026';
  await page.goto('/login');
  await page.getByPlaceholder('name@halcyon.clinical').fill('admin@palliative.emr');
  await page.getByPlaceholder('••••••••').fill(adminPassword);
  
  const signInButton = page.getByRole('button', { name: /Sign in to Workspace/i });
  await expect(signInButton).toBeEnabled();
  await signInButton.click();

  // Verify dashboard hydration
  await expect(page).toHaveURL(/.*dashboard/);

  // End of setup
  await page.context().storageState({ path: authFile });
});
