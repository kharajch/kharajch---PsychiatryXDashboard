import { test, expect, chromium } from '@playwright/test';
import * as path from 'path';

const fileUrl = 'file://' + path.resolve(__dirname, '../PsychiatryX_Dashboard.html');

test.describe('PsychiatryX Dashboard E2E Tests', () => {
  let browser: any;
  let context: any;
  let page: any;

  test.beforeEach(async () => {
    // Launch a completely fresh Chromium browser process for absolute process-level isolation
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext();
    page = await context.newPage();

    // Log browser console messages and errors
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER EXCEPTION:', err.message));

    // Open the dashboard from the root endpoint
    await page.goto('/');
    
    // Wait for RxDB to dynamically import and initialize database
    await page.waitForFunction(() => (window as any).rxdb && (window as any).rxdb.patients, { timeout: 15000 });
  });

  test.afterEach(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('should automatically connect to the sync server on load', async () => {
    const syncText = page.locator('#sync-text');
    await expect(syncText).toHaveText(/(Syncing data...|Connected & Synced)/, { timeout: 30000 });
  });

  test('should support registering a new patient and automatically sync', async () => {
    // 1. Verify connection to dev server is active
    await expect(page.locator('#sync-text')).toHaveText(/(Syncing data...|Connected & Synced)/, { timeout: 30000 });

    // 2. Navigate to New Patient page
    await page.locator('button:has-text("New Patient")').first().click();
    await expect(page.locator('text=Register Patient').first()).toBeVisible();

    // 3. Fill registration details
    const testName = 'E2E Test Patient ' + Math.floor(Math.random() * 10000);
    await page.locator('#reg-name').fill(testName);
    await page.locator('#reg-age').fill('38');
    await page.locator('#reg-gender').selectOption('Male');
    await page.locator('#reg-phone').fill('9876543210');
    await page.locator('#reg-complaint').fill('Feeling stressed and anxious lately.');

    // 4. Click Register
    await page.locator('button:has-text("Register Patient")').click();

    // 5. Verify patient profile is rendered and toast shows success
    await expect(page.locator('text=Patient Profile').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.profile-header')).toContainText(testName);

    // 6. Verify auto-generated patient ID has MKS- prefix
    const patientIdTag = page.locator('span.tag').first();
    const patientIdText = await patientIdTag.textContent();
    expect(patientIdText).toContain('MKS-');
  });

  test('should complete a clinical assessment and calculate score', async () => {
    // 1. Select a patient or register one first
    await page.locator('button:has-text("New Patient")').first().click();
    const testName = 'Assessment Test Patient';
    await page.locator('#reg-name').fill(testName);
    await page.locator('#reg-age').fill('29');
    await page.locator('#reg-gender').selectOption('Female');
    await page.locator('button:has-text("Register Patient")').click();
    await expect(page.locator('text=Patient Profile').first()).toBeVisible({ timeout: 10000 });

    // 2. Navigate to assessments view
    await page.locator('#nav-assess').click();
    await expect(page.locator('#header-title')).toHaveText('Assessments');

    // 3. Start Depression (CDA-17)
    await page.locator('text=Depression (CDA-17)').click();
    
    // Verify question 1 is active
    await expect(page.locator('text=Question 1 of 17')).toBeVisible();

    // 4. Complete all 17 questions
    for (let i = 1; i <= 17; i++) {
      // Click first option (score 0)
      await page.locator('.q-option').first().click();
      
      if (i < 17) {
        // Click Next
        await page.locator('button:has-text("Next →")').click();
      } else {
        // Click Finish
        await page.locator('button:has-text("Finish ✓")').click();
      }
      await page.waitForTimeout(100);
    }

    // 5. Verify score result is displayed
    await expect(page.locator('text=Clinician Notes (optional)').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Clinical Depression Assessment').first()).toBeVisible();
  });

  test('should support editing patient details and deleting the patient completely without it showing up after reload', async () => {
    // 1. Register a new patient
    await page.locator('button:has-text("New Patient")').first().click();
    const testName = 'Edit Delete Test Patient ' + Math.floor(Math.random() * 10000);
    await page.locator('#reg-name').fill(testName);
    await page.locator('#reg-age').fill('45');
    await page.locator('#reg-gender').selectOption('Male');
    await page.locator('button:has-text("Register Patient")').click();
    await expect(page.locator('text=Patient Profile').first()).toBeVisible({ timeout: 10000 });

    // 2. Click "Edit Details"
    await page.locator('button:has-text("Edit Details")').first().click();
    await expect(page.locator('text=Edit Patient').first()).toBeVisible();

    // 3. Edit details (e.g. change name, age)
    const updatedName = testName + ' Updated';
    await page.locator('#edit-name').fill(updatedName);
    await page.locator('#edit-age').fill('46');
    await page.locator('button:has-text("Save Changes")').click();

    // 4. Verify patient profile reflects the changes
    await expect(page.locator('.profile-header')).toContainText(updatedName, { timeout: 10000 });
    await expect(page.locator('.profile-header')).toContainText('46y', { timeout: 10000 });

    // 5. Navigate to Patient Database
    await page.locator('#sidebar >> text=Patient Database').click();
    await expect(page.locator('#patients-list .p-name', { hasText: updatedName }).first()).toBeVisible({ timeout: 10000 });

    // 6. Delete the patient
    page.once('dialog', dialog => dialog.accept());
    await page.locator('.patient-row', { hasText: updatedName }).locator('button.btn-danger').click();
    
    // 7. Verify the patient is no longer listed
    await expect(page.locator('#patients-list .p-name', { hasText: updatedName }).first()).not.toBeVisible({ timeout: 10000 });

    // 8. Wait for sync/replication to run and push the delete
    await page.waitForTimeout(4000);

    // 9. Reload page
    await page.reload();
    await page.waitForFunction(() => (window as any).rxdb && (window as any).rxdb.patients, { timeout: 15000 });

    // 10. Verify patient database is still empty / does not contain the patient
    await page.locator('#sidebar >> text=Patient Database').click();
    await expect(page.locator('#patients-list .p-name', { hasText: updatedName }).first()).not.toBeVisible({ timeout: 10000 });
  });
});
