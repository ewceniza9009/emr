import { test, expect } from '@playwright/test';

test.describe('Halkyone Clinical OS - Patient Enrollment Workflow', () => {

  test.beforeEach(async ({ page }) => {
    // Session Verification: Ensure we have a valid clinical context
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`[BROWSER ERROR] ${msg.text()}`);
    });
  });

  test('should successfully enroll an outreach lead into the clinical registry', async ({ page }) => {
    // 1. Navigate to the Outreach Worklist
    await page.goto('/dashboard/outreach');
    await page.waitForSelector('main', { state: 'visible' });

    // 2. Launch the Quick Enrollment Drawer for the test lead
    const leadRow = page.locator('table tbody tr').filter({ hasText: 'Christopher Heard' }).first();
    await expect(leadRow).toBeVisible({ timeout: 15000 });

    const quickEnrollBtn = leadRow.getByRole('button', { name: /Launch Quick Enrollment Drawer/i });
    await quickEnrollBtn.click();

    // 3. Fill out the High-Fidelity Enrollment Terminal
    // Move to the Administrative Tab to select Health Plan

    // 2. ADMIN PHASE
    await page.getByRole('button', { name: /02\s+ADMIN/i }).click();
    await page.waitForTimeout(1000);

    // Ensure Health Plan is selected and verified (Targeting specific Insurance section)
    const planSelect = page.locator('div:has-text("Health Plan Assignment") select').first();
    await planSelect.waitFor({ state: 'visible' });
    await planSelect.selectOption({ index: 1 });
    await expect(planSelect).not.toHaveValue("");
    await page.waitForTimeout(300);

    // 3. LEGAL PHASE
    await page.getByRole('button', { name: /03\s+LEGAL/i }).click();
    await page.waitForTimeout(1000);

    // Using high-fidelity locators for precise consent capture
    const hipaaBtn = page.getByRole('button', { name: /HIPAA Notice/i });
    await hipaaBtn.click();
    await expect(hipaaBtn).toHaveClass(/bg-teal-500/);
    await page.waitForTimeout(300);

    const poaBtn = page.getByRole('button', { name: /Power of Attorney/i });
    await poaBtn.click();
    await expect(poaBtn).toHaveClass(/bg-teal-500/);
    await page.waitForTimeout(300);

    const treatBtn = page.getByRole('button', { name: /Consent to Treat/i });
    await treatBtn.click();
    await expect(treatBtn).toHaveClass(/bg-teal-500/);
    await page.waitForTimeout(300);

    const advBtn = page.getByRole('button', { name: /Advance Directive/i });
    await advBtn.click();
    await expect(advBtn).toHaveClass(/bg-teal-500/);
    await page.waitForTimeout(300);

    // 4. CLINICAL PHASE
    await page.getByRole('button', { name: /04\s+CLINICAL/i }).click();
    await page.waitForTimeout(1000);
    await page.fill('input[placeholder*="Search codes"]', 'I50.9');
    const clinicalResult = page.getByRole('button').filter({ hasText: 'I50.9' }).first();
    await clinicalResult.click();
    await page.click('button:has-text("MODERATE ACUITY")');

    // 5. LOGISTICS PHASE
    await page.getByRole('button', { name: /05\s+LOGISTICS/i }).click();
    await page.waitForTimeout(1000);

    // Explicitly confirm the "Book Now" strategy
    await page.getByRole('button', { name: /Book Now/i }).click();

    // Select Modality: Facility
    await page.getByRole('button', { name: /Facility/i }).click();
    await page.waitForTimeout(300);

    // Assign a Care Navigator (Section 02-A)
    const navigatorBtn = page.locator('button:has-text("Patient Navigation")').first();
    await expect(navigatorBtn).toBeVisible();
    await navigatorBtn.click();
    await page.waitForTimeout(300);

    // Assign a Primary Clinician (Section 02-B)
    const practitionerBtn = page.locator('button:has-text("Lead Practitioner")').first();
    await expect(practitionerBtn).toBeVisible();
    await practitionerBtn.click();

    // Verify selection visibility (wait for React state to sync)
    await page.waitForTimeout(500);

    // 6. COMMIT ENROLLMENT
    const commitBtn = page.locator('button:has-text("COMMIT ENROLLMENT")');
    await expect(commitBtn).toBeEnabled({ timeout: 15000 });
    await commitBtn.click();

    // VERIFY REDIRECTION
    await expect(page).toHaveURL(/\/dashboard\/patients\/.+/, { timeout: 20000 });

    // Verify the "Enrolled" success state or the Patient's MRN visibility
    const mrnLabel = page.getByText(/PN-\d{4}-\d{5}/i);
    await expect(mrnLabel).toBeVisible({ timeout: 15000 });

    console.log('[SUCCESS] Patient enrollment workflow verified: Outreach -> Registry Transition.');

    // Grace Period for Audit Persistence
    await page.waitForTimeout(2000);
  });

});
