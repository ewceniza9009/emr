import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Perform clinical login
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Halkyone@Initial!2026';
  await page.goto('/login');
  await page.getByPlaceholder('name@halkyone.clinical').fill('admin@palliative.emr');
  await page.getByPlaceholder('••••••••').fill(adminPassword);

  const signInButton = page.getByRole('button', { name: /Access Workspace/i });
  await expect(signInButton).toBeEnabled();
  await signInButton.click();

  // Verify dashboard hydration
  await expect(page).toHaveURL(/.*dashboard/, { timeout: 30000 });

  // End of setup
  await page.context().storageState({ path: authFile });
});
