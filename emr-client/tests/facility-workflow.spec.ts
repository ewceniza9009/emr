import { test, expect } from '@playwright/test';

test.describe('Halkyone Clinical OS - Facility Appointment Booking', () => {

  test.beforeEach(async ({ page }) => {
    // Session Verification: Ensure we have a valid clinical context
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`[BROWSER ERROR] ${msg.text()}`);
    });
  });

  test('should create a new facility booking for Pearline Bauch', async ({ page }) => {
    // Navigate to the Main Dashboard
    await page.goto('/dashboard');
    await page.waitForSelector('main', { state: 'visible' });

    // 1. Open the Booking Drawer via the "Encounters" stat card
    const encountersCard = page.getByText(/Encounters/i);
    await expect(encountersCard).toBeVisible();
    await encountersCard.click();

    // 2. Search and select the patient (Pearline Bauch)
    const searchInput = page.getByPlaceholder(/Search by MRN or patient name/i);
    await expect(searchInput).toBeVisible({ timeout: 15000 });
    await searchInput.fill('Pearl');

    const patientResult = page.getByRole('button', { name: /Pearline Bauch/i });
    await expect(patientResult).toBeVisible({ timeout: 15000 });
    await patientResult.click();

    // 3. Switch Modality to "Facility"
    const facilityModalityBtn = page.getByRole('button', { name: /Facility/i });
    await expect(facilityModalityBtn).toBeVisible();
    await facilityModalityBtn.click();

    // 4. Select a Target Facility from the dropdown
    const facilitySelect = page.locator('select').filter({ hasText: /-- Select active clinical facility --/i });
    await expect(facilitySelect).toBeVisible();
    // Select the first actual facility option by index (since value is dynamic GUID)
    await facilitySelect.selectOption({ index: 1 });

    // 5. Select the time slot (Afternoon)
    const afternoonSlot = page.getByRole('button', { name: /AFTERNOON SLOT/i });
    await expect(afternoonSlot).toBeVisible();
    await afternoonSlot.click();

    // 6. Finalize the booking
    const scheduleBtn = page.getByRole('button', { name: /Schedule Appointment/i });
    await expect(scheduleBtn).toBeEnabled();
    await scheduleBtn.click();

    // 7. Verification: Check for the patient's name appearing in the Recent Activity Log on the dashboard
    const activityItem = page.getByText(/Assessment: Pearline Bauch/i).first();
    await expect(activityItem).toBeVisible({ timeout: 15000 });

    console.log('[SUCCESS] Facility Appointment successfully booked and verified in Activity Log.');

    // 8. Allow backend to finish audit logging before closing connection
    await page.waitForTimeout(2000);
  });

});
