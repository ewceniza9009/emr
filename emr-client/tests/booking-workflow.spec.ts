import { test, expect } from '@playwright/test';

test.describe('Halcyon Clinical OS - Appointment Booking', () => {

  test.beforeEach(async ({ page }) => {
    // Session Verification: Ensure we have a valid clinical context
    page.on('console', msg => {
        if (msg.type() === 'error') console.log(`[BROWSER ERROR] ${msg.text()}`);
    });
  });

  test('should create a new booking for Pearline Bauch', async ({ page }) => {
    // Navigate to the Scheduling Module
    await page.goto('/dashboard/schedule');
    await page.waitForSelector('main', { state: 'visible' });

    // 1. Open the New Encounter modal
    const newEncounterBtn = page.getByRole('button', { name: /New Encounter/i });
    await expect(newEncounterBtn).toBeVisible();
    await newEncounterBtn.click();

    // 2. Search and select the patient (Pearline Bauch)
    const searchInput = page.getByPlaceholder(/Search by name, ID, or phone/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Pearl');
    
    // Wait for the result to appear and click it
    const patientResult = page.getByRole('button', { name: /Pearline Bauch/i });
    await expect(patientResult).toBeVisible({ timeout: 10000 });
    await patientResult.click();

    // 3. Select the time slot (Afternoon)
    const afternoonSlot = page.getByRole('button', { name: /AFTERNOON SLOT/i });
    await expect(afternoonSlot).toBeVisible();
    await afternoonSlot.click();

    // 4. Finalize the booking
    const scheduleBtn = page.getByRole('button', { name: /Schedule Appointment/i });
    await expect(scheduleBtn).toBeEnabled();
    await scheduleBtn.click();

    // 5. Verification: Check for the patient's name appearing in the calendar grid
    // The calendar cards use h4 for patient names
    const calendarEntry = page.locator('h4', { hasText: 'Pearline Bauch' }).first();
    await expect(calendarEntry).toBeVisible({ timeout: 15000 });
    
    console.log('[SUCCESS] Appointment successfully booked for Pearline Bauch.');
  });

});
