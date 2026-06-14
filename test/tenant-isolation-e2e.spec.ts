import './setup-env';
import { test, expect } from '@playwright/test';
import { encode } from 'next-auth/jwt';

test.describe('PsychiatryX Dashboard Multi-tenancy E2E', () => {
  test('Clinicians from different clinics should have isolated data', async ({ browser, request }) => {
    // 1. Seed the database to ensure we have a clean state
    const seedRes = await request.get('/api/dev/seed');
    expect(seedRes.status()).toBe(200);

    // Generate JWT tokens for Clinic A and Clinic B
    const secret = process.env.NEXTAUTH_SECRET || '';
    const authTokenA = await encode({
      token: {
        id: 'user-a',
        name: 'Clinician A',
        email: 'clinicianA@clinicA.com',
        clinicId: 'clinic-a',
        role: 'clinician'
      },
      secret,
      maxAge: 30 * 24 * 60 * 60
    });

    const authTokenB = await encode({
      token: {
        id: 'user-b',
        name: 'Clinician B',
        email: 'clinicianB@clinicB.com',
        clinicId: 'clinic-b',
        role: 'clinician'
      },
      secret,
      maxAge: 30 * 24 * 60 * 60
    });

    // 2. Setup Clinic A
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await pageA.goto('/');
    
    // Clear all local state and set Clinic A credentials
    await pageA.evaluate(async (token) => {
      localStorage.clear();
      localStorage.setItem('psychiatryx_token', token);
      localStorage.setItem('psychiatryx_clinic_id', 'clinic-a');
      if (window.indexedDB.databases) {
        const dbs = await window.indexedDB.databases();
        for (const db of dbs) { if (db.name) window.indexedDB.deleteDatabase(db.name); }
      }
    }, authTokenA);
    await pageA.reload();
    await pageA.waitForFunction(() => (window as any).rxdb && (window as any).rxdb.patients, { timeout: 15000 });
    await expect(pageA.locator('#sync-text')).toHaveText(/(Syncing data...|Connected & Synced)/, { timeout: 30000 });

    // Register a patient in Clinic A
    const patientNameA = 'Clinic A Patient ' + Math.random().toString(36).substring(7);
    await pageA.locator('button:has-text("New Patient")').first().click();
    await pageA.locator('#reg-name').fill(patientNameA);
    await pageA.locator('#reg-age').fill('45');
    await pageA.locator('#reg-gender').selectOption('Male');
    await pageA.locator('button:has-text("Register Patient")').click();
    
    // Verify patient appeared in Clinic A
    await expect(pageA.locator('.profile-header')).toContainText(patientNameA, { timeout: 15000 });

    // 3. Setup Clinic B (Fresh context, different storage)
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await pageB.goto('/');
    
    // Clear all local state and set Clinic B credentials
    await pageB.evaluate(async (token) => {
      localStorage.clear();
      localStorage.setItem('psychiatryx_token', token);
      localStorage.setItem('psychiatryx_clinic_id', 'clinic-b');
      if (window.indexedDB.databases) {
        const dbs = await window.indexedDB.databases();
        for (const db of dbs) { if (db.name) window.indexedDB.deleteDatabase(db.name); }
      }
    }, authTokenB);
    await pageB.reload();
    await pageB.waitForFunction(() => (window as any).rxdb && (window as any).rxdb.patients, { timeout: 15000 });
    await expect(pageB.locator('#sync-text')).toHaveText(/(Syncing data...|Connected & Synced)/, { timeout: 30000 });
    
    // In Page B, the patient from Clinic A should NOT exist.
    await pageB.locator('#sidebar >> text=Patient Database').click();
    await expect(pageB.locator('#patients-list')).not.toContainText(patientNameA);

    await contextA.close();
    await contextB.close();
  });
});
