import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Halkyone Screenshot Generator', () => {
  test('Capture all screenshots', async ({ page }) => {
    // Increase timeout for this specific test
    test.setTimeout(180000);

    // Create target directory if it doesn't exist
    const assetsDir = path.resolve(__dirname, '../../qa_report/assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    // 1. Set standard viewport
    await page.setViewportSize({ width: 1280, height: 800 });

    // 2. Go directly to dashboard (Playwright handles authentication automatically)
    console.log('Navigating to dashboard...');
    await page.goto('http://127.0.0.1:3671/dashboard');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 30000 });
    await page.waitForTimeout(3000); // Let dashboard load and render

    // 3. Capture Dashboard
    console.log('Capturing dashboard...');
    await page.screenshot({ path: path.join(assetsDir, 'dashboard.png') });

    // 4. Capture Patients list
    console.log('Capturing patients list...');
    await page.goto('http://127.0.0.1:3671/dashboard/patients');
    await page.waitForSelector('table tbody tr', { state: 'visible', timeout: 15000 });
    await page.waitForTimeout(2000); // wait for data render
    await page.screenshot({ path: path.join(assetsDir, 'patients.png') });

    // 5. Capture Patient Detail
    console.log('Capturing patient detail...');
    const actionsButton = page.locator('table tbody tr').first().locator('button').first();
    if (await actionsButton.isVisible()) {
      await actionsButton.click();
      await page.waitForTimeout(1000); // wait for dropdown animation
      
      const viewProfileItem = page.locator('text=View Clinical Profile');
      if (await viewProfileItem.isVisible()) {
        await viewProfileItem.click();
        await page.waitForURL(/.*patients\/.*/, { timeout: 15000 });
        await page.waitForTimeout(3000); // wait for graphs to animate
        await page.screenshot({ path: path.join(assetsDir, 'patient_detail.png') });
      } else {
        console.log('View Clinical Profile menu item not found, taking screenshot of registry list instead.');
        await page.screenshot({ path: path.join(assetsDir, 'patient_detail.png') });
      }
    } else {
      console.log('No actions button found, taking screenshot of registry list instead.');
      await page.screenshot({ path: path.join(assetsDir, 'patient_detail.png') });
    }

    // 6. Capture Outreach list
    console.log('Capturing outreach...');
    await page.goto('http://127.0.0.1:3671/dashboard/outreach');
    await page.waitForSelector('table tbody tr', { state: 'visible', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(assetsDir, 'outreach.png') });

    // 7. Capture Enrollment Drawer
    console.log('Capturing enrollment drawer...');
    const enrollBtn = page.locator('table tbody tr button[title="Launch Quick Enrollment Drawer"]').first();
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
      await page.waitForTimeout(2000); // wait for drawer animation
      await page.screenshot({ path: path.join(assetsDir, 'enrollment_drawer.png') });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    } else {
      console.log('No enroll button found, taking screenshot of outreach page as fallback...');
      await page.screenshot({ path: path.join(assetsDir, 'enrollment_drawer.png') });
    }

    // 8. Capture Schedule calendar
    console.log('Capturing schedule...');
    await page.goto('http://127.0.0.1:3671/dashboard/schedule');
    await page.waitForTimeout(4000); // let calendar render
    await page.screenshot({ path: path.join(assetsDir, 'schedule.png') });

    // 9. Capture Telemetry hub
    console.log('Capturing telemetry...');
    await page.goto('http://127.0.0.1:3671/dashboard/telemetry');
    await page.waitForSelector('button[title="Initialize Telemetry Link"]', { timeout: 15000 });
    
    // Initialize telemetry links on the first two cards
    const powerButtons = page.locator('button[title="Initialize Telemetry Link"]');
    if (await powerButtons.count() > 0) {
      console.log('Enabling first telemetry stream...');
      await powerButtons.nth(0).click();
      await page.waitForTimeout(2000); // Wait for graphql mutation and SignalR handshake
      if (await powerButtons.count() > 1) {
        console.log('Enabling second telemetry stream...');
        await powerButtons.nth(1).click();
        await page.waitForTimeout(2000);
      }
    }
    await page.waitForTimeout(3000); // let graphs/charts render and animate
    await page.screenshot({ path: path.join(assetsDir, 'telemetry.png') });

    // 10. Capture Admin Security
    console.log('Capturing admin dashboard / security...');
    await page.goto('http://127.0.0.1:3671/admin/dashboard');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(assetsDir, 'security.png') });

    // 11. Capture Admin Audit Log
    console.log('Capturing admin audit / utilization...');
    await page.goto('http://127.0.0.1:3671/admin/audit');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(assetsDir, 'utilization.png') });

    // 12. Switch to Mobile Viewport
    console.log('Switching to mobile viewport for mobile app...');
    await page.setViewportSize({ width: 375, height: 812 });

    // 13. Capture Mobile Login
    console.log('Capturing mobile login...');
    await page.goto('http://127.0.0.1:3672/login');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(assetsDir, 'mobile_login.png') });

    // 14. Simulate Secure Biometrics and Log in
    console.log('Simulating secure biometrics on mobile...');
    const biometricBtn = page.locator('button:has-text("Simulate Secure Biometrics"), button:has-text("SIMULATE SECURE BIOMETRICS")');
    if (await biometricBtn.isVisible()) {
      await biometricBtn.click();
      await page.waitForTimeout(6000); // wait for 4.5s simulation + redirect + page load
      await page.screenshot({ path: path.join(assetsDir, 'mobile_comfort.png') });
    } else {
      console.log('Biometric simulation button not found, logging in using magic token...');
      const authBtn = page.locator('button:has-text("Authenticate Token"), button:has-text("AUTHENTICATE TOKEN")');
      if (await authBtn.isVisible()) {
        await authBtn.click();
        await page.waitForTimeout(4000);
      }
      await page.screenshot({ path: path.join(assetsDir, 'mobile_comfort.png') });
    }

    // 15. Capture Care Hub
    console.log('Capturing mobile care hub...');
    await page.goto('http://127.0.0.1:3672/app/care-hub');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(assetsDir, 'mobile_care_hub.png') });

    // 16. Capture Pharmacy
    console.log('Capturing mobile pharmacy...');
    await page.goto('http://127.0.0.1:3672/app/pharmacy');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(assetsDir, 'mobile_pharmacy.png') });

    console.log('Screenshot generation complete.');
  });
});
