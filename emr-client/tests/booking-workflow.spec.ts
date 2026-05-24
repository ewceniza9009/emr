import { test, expect } from '@playwright/test';

test.describe('Halkyone Clinical OS - Appointment Booking', () => {

  test.beforeEach(async ({ page }) => {
    // Session Verification: Ensure we have a valid clinical context
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`[BROWSER ERROR] ${msg.text()}`);
    });
  });

  test('should create a new booking for Pearline Bauch', async ({ page }) => {
    // Navigate to the Main Dashboard (Verified context for New Encounter)
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('main', { state: 'visible' });

    // 1. Open the Booking Drawer via the "Encounters" stat card
    // Note: The Hero "New Encounter" button navigates, while this card opens the drawer.
    const encountersCard = page.getByText(/Encounters/i);
    await expect(encountersCard).toBeVisible();
    await encountersCard.click();

    // 2. Search and select the patient (Pearline Bauch)
    // Hardening: Corrected placeholder to match the actual UI text
    const searchInput = page.getByPlaceholder(/Search by MRN or patient name/i);
    await expect(searchInput).toBeVisible({ timeout: 15000 });
    await searchInput.fill('Pearl');

    // Wait for the result to appear and click it
    const patientResult = page.getByRole('button', { name: /Pearline Bauch/i });
    await expect(patientResult).toBeVisible({ timeout: 15000 });
    await patientResult.click();

    // 3. Select the time slot (Afternoon)
    const afternoonSlot = page.getByRole('button', { name: /AFTERNOON SLOT/i });
    await expect(afternoonSlot).toBeVisible();
    await afternoonSlot.click();

    // 4. Finalize the booking
    const scheduleBtn = page.getByRole('button', { name: /Schedule Appointment/i });
    await expect(scheduleBtn).toBeEnabled();
    await scheduleBtn.click();

    // 5. Verification: Check for the patient's name appearing in the Recent Activity Log on the dashboard
    const activityItem = page.getByText(/Assessment: Pearline Bauch/i).first();
    await expect(activityItem).toBeVisible({ timeout: 15000 });

    console.log('[SUCCESS] Appointment successfully booked and verified in Activity Log.');

    // 6. Allow backend to finish audit logging before closing connection
    // Resolves the OperationCanceledException in CI logs
    await page.waitForTimeout(2000);
  });

});
