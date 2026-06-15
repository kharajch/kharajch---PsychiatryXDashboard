import { test, expect } from '@playwright/test';

test.describe('PsychiatryX Security & Sanitization', () => {
  test.beforeEach(async ({ page }) => {
    // Use test=true to bypass login
    await page.goto('/?test=true');
    await page.waitForFunction(() => (window as any).rxdb && (window as any).rxdb.patients, { timeout: 15000 });
  });

  test('should sanitize patient name to prevent XSS in dashboard and database', async ({ page }) => {
    const xssPayload = '<img src=x onerror="window.XSS_DETECTED=true">';
    
    // 1. Register a patient with XSS payload in name
    await page.locator('button:has-text("New Patient")').first().click();
    await page.locator('#reg-name').fill(xssPayload);
    await page.locator('#reg-age').fill('30');
    await page.locator('#reg-gender').selectOption('Male');
    await page.locator('button:has-text("Register Patient")').click();

    // 2. Check if XSS executed
    const isXssExecuted = await page.evaluate(() => (window as any).XSS_DETECTED === true);
    expect(isXssExecuted, 'XSS payload in patient name should NOT execute').not.toBe(true);

    // 3. Navigate to Patient Database and check if payload is sanitized/escaped
    await page.locator('#sidebar >> text=Patient Database').click();
    const patientRow = page.locator('.patient-row', { hasText: xssPayload });
    // If it's sanitized/escaped, we should see the literal characters or a clean version
    // If it executed, we might see nothing or the alert
    await expect(patientRow).toBeVisible();
  });

  test('should sanitize clinical notes in assessments to prevent XSS', async ({ page }) => {
    const xssPayload = '<svg/onload="window.XSS_NOTES_DETECTED=true">';
    
    // 1. Register a normal patient
    await page.locator('button:has-text("New Patient")').first().click();
    await page.locator('#reg-name').fill('Normal Patient');
    await page.locator('#reg-age').fill('25');
    await page.locator('#reg-gender').selectOption('Female');
    await page.locator('button:has-text("Register Patient")').click();

    // 2. Run an assessment and add XSS in notes
    await page.locator('#nav-assess').click();
    await page.locator('text=Depression (CDA-17)').click();
    
    // Finish assessment quickly (all 0s)
    for (let i = 1; i <= 17; i++) {
      await page.locator('.q-option').first().click();
      if (i < 17) await page.locator('button:has-text("Next →")').click();
      else await page.locator('button:has-text("Finish ✓")').click();
      await page.waitForTimeout(50);
    }

    // 3. Enter XSS payload in notes
    const notesArea = page.locator('#assess-notes');
    await notesArea.fill(xssPayload);
    await page.locator('button:has-text("Save & Print PDF")').click();

    // 4. Verify in Patient Profile (where notes might be rendered)
    await page.locator('button:has-text("Patient Profile")').click();
    await page.locator('button:has-text("View")').first().click(); // Open assessment detail modal

    const isXssExecuted = await page.evaluate(() => (window as any).XSS_NOTES_DETECTED === true);
    expect(isXssExecuted, 'XSS payload in clinical notes should NOT execute').not.toBe(true);
  });
});
