import { test, expect } from '@playwright/test';

test.describe('Halkyone Clinical OS - Patient Enrollment Workflow', () => {

  test.beforeEach(async ({ page }) => {
    // Session Verification: Ensure we have a valid clinical context
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`[BROWSER ERROR] ${msg.text()}`);
    });
  });

  test('should successfully enroll an outreach lead into the clinical registry', async ({ page }) => {
    test.slow();
    // 1. Navigate to the Outreach Worklist
    await page.goto('/dashboard/outreach');
    await page.waitForSelector('main', { state: 'visible' });

    // 2. Find a lead that is NOT yet enrolled (status = LEAD or INITIAL ASSESSMENT)
    //    We need an unenrolled lead to test the enrollment flow.
    //    First, try Christopher Heard. If already enrolled, reverse it first.
    const leadRow = page.locator('table tbody tr').filter({ hasText: 'Christopher Heard' }).first();
    await expect(leadRow).toBeVisible({ timeout: 15000 });

    // Check if already enrolled — if so, reverse enrollment first
    const statusCell = leadRow.locator('td').nth(5); // STATUS column
    const statusText = await statusCell.textContent();

    if (statusText?.includes('ENROLLED')) {
      console.log('[SETUP] Christopher Heard is already enrolled. Reversing enrollment...');

      const quickEnrollBtn = leadRow.getByRole('button', { name: /Launch Quick Enrollment Drawer/i });
      await quickEnrollBtn.click();
      await expect(page.getByRole('heading', { name: 'Enrollment', exact: true })).toBeVisible({ timeout: 10000 });

      // Click "REVERSE ENROLLMENT" button
      const reverseBtn = page.locator('button:has-text("REVERSE ENROLLMENT")');
      await expect(reverseBtn).toBeVisible({ timeout: 5000 });
      await reverseBtn.click();

      // Fill in the reversal reason in the modal
      const reversalTextarea = page.locator('textarea').first();
      await expect(reversalTextarea).toBeVisible({ timeout: 5000 });
      await reversalTextarea.fill('Automated test cleanup: resetting enrollment state');

      // Confirm the reversal (button text is "COMMIT REVERSAL")
      const confirmReverseBtn = page.locator('button:has-text("COMMIT REVERSAL")');
      await expect(confirmReverseBtn).toBeVisible({ timeout: 5000 });
      await confirmReverseBtn.click();

      // Wait for the reversal to complete in the UI
      await expect(statusCell).not.toContainText('ENROLLED', { timeout: 15000 });

      // Close the drawer
      const closeBtn = page.locator('button').filter({ has: page.locator('svg.lucide-x') }).first();
      await closeBtn.click();
      await page.waitForTimeout(1000);

      // Reload to get fresh state
      await page.goto('/dashboard/outreach');
      await page.waitForSelector('main', { state: 'visible' });
      await expect(leadRow).toBeVisible({ timeout: 15000 });
    }

    // 3. Launch the Quick Enrollment Drawer
    const quickEnrollBtn = leadRow.getByRole('button', { name: /Launch Quick Enrollment Drawer/i });
    await quickEnrollBtn.click();

    // Wait for the drawer to fully render
    await expect(page.getByRole('heading', { name: 'Enrollment', exact: true })).toBeVisible({ timeout: 10000 });

    // 4. ADMIN PHASE
    await page.getByRole('button', { name: /Next Step/i }).click();
    await page.waitForTimeout(500);

    // Health Plan Selection (Targeting by label specifically)
    const planSelect = page.locator('label:has-text("Health Plan Assignment") + select').first();
    await expect(async () => {
      const count = await planSelect.locator('option').count();
      expect(count).toBeGreaterThan(1);
    }).toPass({ timeout: 10000 });
    
    await planSelect.selectOption({ index: 1 });
    await expect(planSelect).not.toHaveValue("");

    // MANDATORY VALIDATION: Fill DOB and Biological Sex
    await page.fill('label:has-text("Date of Birth") + div input', '1985-05-20');
    const sexSelect = page.locator('label:has-text("Biological Sex") + select').first();
    await sexSelect.selectOption('MALE');
    await page.waitForTimeout(500);

    // 5. LEGAL PHASE
    await page.getByRole('button', { name: /Next Step/i }).click();
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

    // 6. CLINICAL PHASE
    await page.getByRole('button', { name: /Next Step/i }).click();
    await page.waitForTimeout(500);
    await page.fill('input[placeholder*="Search codes"]', 'I50.9');
    const clinicalResult = page.getByRole('button').filter({ hasText: 'I50.9' }).first();
    await clinicalResult.click();
    await page.click('button:has-text("MODERATE ACUITY")');

    // 7. LOGISTICS PHASE
    await page.getByRole('button', { name: /Next Step/i }).click();
    await page.waitForTimeout(500);

    // Select Modality: Facility (in left panel)
    await page.getByRole('button', { name: /Facility/i }).click();
    await page.waitForTimeout(300);

    // Assign Practitioners - wait for the practitioner cards to render
    const navCard = page.locator('button:has-text("Patient Navigation")').first();
    await expect(navCard).toBeVisible({ timeout: 10000 });
    await navCard.click();

    const leadCard = page.locator('button:has-text("Lead Practitioner")').first();
    await expect(leadCard).toBeVisible({ timeout: 10000 });
    await leadCard.click();

    // Select "Later" scheduling strategy to bypass weekend scheduling issues
    const laterBtn = page.getByRole('button', { name: 'Later' });
    await expect(laterBtn).toBeVisible({ timeout: 10000 });
    await laterBtn.click();

    // Verify selection visibility (wait for React state to sync)
    await page.waitForTimeout(500);

    // 8. ENROLL - Intercept the GraphQL response BEFORE clicking
    const enrollmentResponsePromise = page.waitForResponse(
      resp => resp.url().includes('/graphql') && (resp.request().postData()?.includes('FinalizeEnrollment') ?? false),
      { timeout: 30000 }
    );

    const enrollBtn = page.locator('button:has-text("ENROLL")').last();
    await expect(enrollBtn).toBeEnabled({ timeout: 15000 });
    await enrollBtn.click();

    // Wait for the mutation to complete and capture response safely
    const enrollmentResponse = await enrollmentResponsePromise;
    
    // Safety check: ensure response is still valid before reading JSON
    let responseBody;
    try {
      responseBody = await enrollmentResponse.json();
      if (responseBody.errors) {
        console.error('[ENROLLMENT ERRORS]', JSON.stringify(responseBody.errors));
      } else {
        console.log('[ENROLLMENT OK] Patient ID:', responseBody.data?.finalizeEnrollment);
      }
    } catch (e) {
      console.log('[NETWORK NOTE] Response body could not be parsed, proceeding to URL verification.');
    }

    // VERIFY REDIRECTION
    await expect(page).toHaveURL(/\/dashboard\/patients\/.+/, { timeout: 45000 });

    // Verify the "Enrolled" success state or the Patient's MRN visibility
    const mrnLabel = page.getByText(/PN-\d{4}-\d{5}/i);
    await expect(mrnLabel).toBeVisible({ timeout: 15000 });

    console.log('[SUCCESS] Patient enrollment workflow verified: Outreach -> Registry Transition.');

    // Grace Period for Audit Persistence
    await page.waitForTimeout(2000);
  });

});
