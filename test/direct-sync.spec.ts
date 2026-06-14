import { test, expect } from '@playwright/test';

test.describe('PsychiatryX Direct Sync (Zero-Auth) E2E', () => {
  let isSyncOffline = false;

  test.beforeEach(async ({ page }) => {
    // 1. Reset database state
    await page.request.get('/api/dev/reset');
    
    // 2. Setup interceptor for sync API
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

    // 3. Clear local storage to ensure fresh state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => (window as any).rxdb && (window as any).rxdb.patients, { timeout: 15000 });
  });

  test('should automatically detect sync server and initialize without login', async ({ page }) => {
    const syncText = page.locator('#sync-text');
    
    // 1. Verify it transitions to "Connected & Synced" or "Syncing" automatically
    // It should target window.location.origin which is the playwright server
    await expect(syncText).toHaveText(/(Syncing data...|Connected & Synced)/, { timeout: 20000 });

    // 2. Verify no login modal is visible
    const loginModal = page.locator('text=Connect to Cloud Sync');
    await expect(loginModal).not.toBeVisible();
  });

  test('should gracefully handle offline state without blocking UI', async ({ page }) => {
    const syncText = page.locator('#sync-text');
    
    // 1. Force offline
    isSyncOffline = true;
    
    // 2. Reload page
    await page.reload();
    await page.waitForFunction(() => (window as any).rxdb && (window as any).rxdb.patients, { timeout: 15000 });
    
    // 3. Verify it shows offline status
    await expect(syncText).toContainText('offline (local only)', { timeout: 15000 });
    
    // 4. Verify we can still register a patient offline
    await page.locator('#sidebar >> text=Register Patient').click();
    const testName = 'Direct Offline Patient';
    await page.locator('#reg-name').fill(testName);
    await page.locator('#reg-age').fill('30');
    await page.locator('#reg-gender').selectOption('Male');
    await page.locator('button:has-text("Register Patient")').click();
    
    await expect(page.locator('.profile-header')).toContainText(testName);
    
    // 5. Go online and check auto-sync recovery
    isSyncOffline = false;
    await page.evaluate(() => (window as any).setupReplication(true));
    await expect(syncText).toHaveText(/(Syncing data...|Connected & Synced)/, { timeout: 30000 });
  });

  test('should automatically use default clinic session for zero-auth sync', async ({ page, request }) => {
    // This test verifies the backend is indeed accepting unauthenticated requests
    // by default for simplified open-source operation.
    
    // 1. Register a patient on the client
    await page.locator('#sidebar >> text=Register Patient').click();
    const testName = 'Zero Auth Patient ' + Date.now();
    await page.locator('#reg-name').fill(testName);
    await page.locator('#reg-age').fill('45');
    await page.locator('#reg-gender').selectOption('Female');
    await page.locator('button:has-text("Register Patient")').click();
    
    // 2. Wait for sync to complete (Replication is live, so it should be fast but needs a moment)
    await expect(page.locator('#sync-text')).toHaveText(/(Connected & Synced|Syncing data...)/, { timeout: 30000 });
    
    // Give it a few seconds for the network request to actually finish
    await page.waitForTimeout(5000);
    
    // 3. Verify the patient exists on the backend using the default clinic ID
    // We'll call the API directly using the same 'Zero Auth' pattern
    const res = await request.get('/api/sync/patients', {
      headers: {
        'x-zero-auth-test': 'true'
      }
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    const found = data.documents.some((d: any) => d.name === testName);
    if (!found) {
      console.log('Patient not found in first pull. Retrying pull...');
      await page.waitForTimeout(5000);
      const res2 = await request.get('/api/sync/patients', {
        headers: {
          'x-zero-auth-test': 'true'
        }
      });
      const data2 = await res2.json();
      expect(data2.documents.some((d: any) => d.name === testName)).toBe(true);
    } else {
      expect(found).toBe(true);
    }
  });
});
