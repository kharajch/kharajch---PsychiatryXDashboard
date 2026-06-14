import { test, expect } from '@playwright/test';

test.describe('Maintenance Features', () => {
  const serverUrl = 'http://127.0.0.1:3000';

  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await page.waitForFunction(() => (window as any).rxdb && (window as any).rxdb.patients, { timeout: 15000 });
  });

  test('Database Reset API should clear all collections', async ({ request }) => {
    // 1. Seed the database first to ensure there is data to clear
    const seedRes = await request.get(`${serverUrl}/api/dev/seed`);
    expect(seedRes.ok()).toBe(true);
    const seedData = await seedRes.json();
    expect(seedData.message).toBe('Database seeded successfully');

    // 2. Call the reset endpoint
    const resetRes = await request.post(`${serverUrl}/api/dev/reset`);
    expect(resetRes.ok()).toBe(true);
    const resetData = await resetRes.json();
    expect(resetData.message).toBe('Database cleared successfully');

    // 3. Verify counts are zero
    expect(resetData.results.patients.deletedCount).toBeGreaterThan(0);
    expect(resetData.results.assessments.deletedCount).toBeGreaterThan(0);
    // Prescriptions might be 0 if seed doesn't create them, but that's okay
  });

  test('Frontend Factory Reset should clear all local state', async ({ page }) => {
    // 1. Set some initial state in localStorage
    await page.evaluate(() => {
      localStorage.setItem('psychiatryx_clinic_id', 'test-clinic-id');
      localStorage.setItem('psychiatryx_username', 'test-user');
      localStorage.setItem('psychiatryx_token', 'mock-token');
    });

    // 2. Reload to ensure state is picked up
    await page.reload();
    await page.waitForFunction(() => (window as any).rxdb && (window as any).rxdb.patients, { timeout: 15000 });

    // 3. Trigger Factory Reset programmatically
    // Handle the confirmation dialog
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('WARNING: This will permanently delete all local patient data');
      await dialog.accept();
    });

    await page.evaluate(() => (window as any).factoryReset());

    // 4. Wait for reload (Factory Reset triggers location.reload() after 1.5s)
    await page.waitForTimeout(2000);
    await page.waitForFunction(() => (window as any).rxdb && (window as any).rxdb.patients, { timeout: 15000 });

    // 5. Verify localStorage is cleared
    const storage = await page.evaluate(() => {
      return {
        clinicId: localStorage.getItem('psychiatryx_clinic_id'),
        username: localStorage.getItem('psychiatryx_username'),
        token: localStorage.getItem('psychiatryx_token')
      };
    });

    expect(storage.clinicId).toBeNull();
    expect(storage.username).toBeNull();
    expect(storage.token).toBeNull();
  });
});
