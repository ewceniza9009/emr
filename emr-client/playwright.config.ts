import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load local environment variables for tactical testing
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/screenshot-generator.spec.ts', '**/new-screenshots.spec.ts'],
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Prevent accidental test.only in CI */
  forbidOnly: !!process.env.CI,
  /* Retry failed tests twice in CI */
  retries: process.env.CI ? 2 : 0,
  /* Single worker locally to avoid DB locks; 2 in CI */
  workers: process.env.CI ? 2 : 1,
  /* Wait up to 60s for slow clinical pages */
  timeout: 60000,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://127.0.0.1:3671',

    /* Save trace on first retry for debugging */
    trace: 'on-first-retry',
    
    /* Auto-screenshot when a test fails */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    // Setup project
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Use prepared auth state.
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
