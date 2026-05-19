import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Halkyone Modernized Features Screenshots', () => {
  test('Capture new compact and sorting features', async ({ page }) => {
    test.setTimeout(180000);

    const assetsDir = path.resolve(__dirname, '../../qa_report/assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    // Set standard high-fidelity viewport
    await page.setViewportSize({ width: 1280, height: 800 });

    // 1. Capture Aligned Resource Heatmap
    console.log('Navigating to Admin Resource Heatmap...');
    await page.goto('http://127.0.0.1:3671/admin/dashboard?tab=utilization');
    await page.waitForSelector('h2:has-text("Resource Utilization Heatmap")', { timeout: 30000 });
    await page.waitForTimeout(3000); // Allow data hydration
    await page.screenshot({ path: path.join(assetsDir, 'utilization.png') });
    console.log('Saved utilization.png');

    // 2. Open and Capture Workload Drill-down Modal
    console.log('Opening Workload Drill-down Modal...');
    const reviewBtn = page.locator('button:has-text("Review Workflow")').first();
    await expect(reviewBtn).toBeVisible({ timeout: 15000 });
    await reviewBtn.click();
    await page.waitForSelector('text=Active Session', { timeout: 10000 });
    await page.waitForTimeout(2000); // Wait for modal slide-in animation
    await page.screenshot({ path: path.join(assetsDir, 'utilization_modal.png') });
    console.log('Saved utilization_modal.png');

    // Close the modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // 3. Navigate to Patient Detail and Open Visit Schedule Tab
    console.log('Navigating to Patient Registry...');
    await page.goto('http://127.0.0.1:3671/dashboard/patients');
    await page.waitForSelector('table tbody tr', { state: 'visible', timeout: 15000 });
    await page.waitForTimeout(1000);

    console.log('Opening first patient clinical profile...');
    const actionsButton = page.locator('table tbody tr').first().locator('button').first();
    await expect(actionsButton).toBeVisible();
    await actionsButton.click();
    await page.waitForTimeout(500);

    const viewProfileItem = page.locator('text=View Clinical Profile');
    await expect(viewProfileItem).toBeVisible();
    await viewProfileItem.click();
    await page.waitForURL(/.*patients\/.*/, { timeout: 15000 });
    await page.waitForTimeout(3000);

    console.log('Switching to Visit Schedule Tab...');
    const visitScheduleTab = page.locator('button:has-text("Visit Schedule")');
    await expect(visitScheduleTab).toBeVisible();
    await visitScheduleTab.click();
    await page.waitForSelector('h2:has-text("Patient Visit Registry")', { timeout: 10000 });
    await page.waitForTimeout(2000); // Wait for list animation

    // Take screenshot of the visit schedule showing the sorting toggle
    await page.screenshot({ path: path.join(assetsDir, 'patient_detail_schedule.png') });
    console.log('Saved patient_detail_schedule.png');

    console.log('Screenshots generated successfully!');
  });
});
