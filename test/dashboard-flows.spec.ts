import { test, expect } from '@playwright/test';

test.describe('PsychiatryX Dashboard E2E Flows', () => {
  let isSyncOffline = false;

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER EXCEPTION:', err.message));

    isSyncOffline = false;
    await page.route('**/api/sync/**', async route => {
      if (isSyncOffline) {
        await route.abort();
      } else {
        const headers = {
          ...route.request().headers(),
          'x-zero-auth-test': 'true'
        };
        await route.continue({ headers });
      }
    });

    // Playwright uses fresh context for each test, so localStorage should be empty
    await page.goto('/');
    await page.waitForFunction(() => (window as any).rxdb && (window as any).rxdb.patients, { timeout: 15000 });
  });

  test('should initialize sync automatically on load', async ({ page }) => {
    const syncText = page.locator('#sync-text');
    
    // 1. Initial state should transition to Connected automatically
    await expect(syncText).toHaveText(/(Syncing data...|Connected & Synced)/, { timeout: 30000 });
  });

  test('should support registering a new patient offline and auto-pushing when online', async ({ page }) => {
    // 1. Go offline via interceptor
    isSyncOffline = true;
    await page.reload();
    await page.waitForFunction(() => (window as any).rxdb && (window as any).rxdb.patients, { timeout: 15000 });

    // 2. Register patient
    await page.locator('#sidebar >> text=Register Patient').click();
    const testName = 'Offline Flow Patient ' + Math.floor(Math.random() * 10000);
    await page.locator('#reg-name').fill(testName);
    await page.locator('#reg-age').fill('41');
    await page.locator('#reg-gender').selectOption('Female');
    await page.locator('button:has-text("Register Patient")').click();

    await expect(page.locator('.profile-header')).toContainText(testName, { timeout: 15000 });

    // 3. Go online and check sync recovery
    isSyncOffline = false;
    await page.evaluate(() => (window as any).setupReplication(true));
    await expect(page.locator('#sync-text')).toHaveText(/(Syncing data...|Connected & Synced)/, { timeout: 40000 });

    // 4. Verify in DB
    await page.waitForTimeout(5000);
    await page.locator('#sidebar >> text=Patient Database').click();
    await expect(page.locator('#patients-list .p-name', { hasText: testName }).first()).toBeVisible({ timeout: 15000 });
  });

  test('should complete suicide risk assessment and trigger critical alert warning', async ({ page }) => {
    await page.locator('#sidebar >> text=Register Patient').click();
    const testName = 'High Risk Patient ' + Math.floor(Math.random() * 10000);
    await page.locator('#reg-name').fill(testName);
    await page.locator('#reg-age').fill('34');
    await page.locator('#reg-gender').selectOption('Male');
    await page.locator('button:has-text("Register Patient")').click();

    await page.locator('#nav-assess').click();
    await page.locator('.assessment-card', { hasText: 'Suicide Risk' }).click();

    for (let i = 1; i <= 20; i++) {
      const isCriticalIndex = [3, 4, 5, 7, 8, 17].includes(i); 
      if (isCriticalIndex) {
        await page.locator('.q-option').nth(2).click();
      } else {
        await page.locator('.q-option').first().click();
      }
      if (i < 20) await page.locator('button:has-text("Next →")').click();
      else await page.locator('button:has-text("Finish ✓")').click();
      await page.waitForTimeout(50);
    }

    await expect(page.locator('text=CRITICAL ALERT').first()).toBeVisible({ timeout: 15000 });
    await page.locator('button:has-text("Patient Profile")').click();
    await expect(page.locator('.alert-danger')).toContainText('SRA-20', { timeout: 10000 });
  });

  test('should build, save, load, and delete a prescription in Prescription Builder', async ({ page }) => {
    await page.locator('#sidebar >> text=Register Patient').click();
    await page.locator('#reg-name').fill('Rx Builder Patient ' + Math.floor(Math.random() * 10000));
    await page.locator('#reg-age').fill('27');
    await page.locator('#reg-gender').selectOption('Female');
    await page.locator('button:has-text("Register Patient")').click();

    await page.locator('button:has-text("New Rx")').click();
    await page.locator('#rx-diagnosis').fill('MDD');
    await page.locator('#rx-med-name').fill('Escitalopram 10mg');
    await page.locator('button:has-text("Add to Prescription")').click();

    await page.locator('button:has-text("Save Rx")').first().click();
    await expect(page.locator('#toast')).toContainText('Prescription saved!', { timeout: 10000 });

    await expect(page.locator('#toast')).toBeHidden({ timeout: 10000 });
    await page.locator('button:has-text("Load")').click();
    await expect(page.locator('#toast')).toContainText('Prescription loaded', { timeout: 15000 });

    page.once('dialog', dialog => dialog.accept()); 
    await page.locator('button:has-text("🗑")').click();
    await expect(page.locator('text=No prescriptions yet')).toBeVisible();
  });

  test('should maintain active patient context during navigation and generate full report PDF', async ({ page }) => {
    await page.locator('#sidebar >> text=Register Patient').click();
    const testName = 'Nav Context Patient ' + Math.floor(Math.random() * 10000);
    await page.locator('#reg-name').fill(testName);
    await page.locator('#reg-age').fill('50');
    await page.locator('#reg-gender').selectOption('Male');
    await page.locator('button:has-text("Register Patient")').click();

    await page.locator('#sidebar >> text=Dashboard').click();
    await expect(page.locator('#hp-name')).toHaveText(testName);

    await page.locator('#sidebar >> text=Patient Profile').click();
    const downloadPromise = page.waitForEvent('download', { timeout: 60000 });
    await page.locator('button:has-text("Full Report")').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');
  });
});
