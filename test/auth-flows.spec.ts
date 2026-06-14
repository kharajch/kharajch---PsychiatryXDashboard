import './setup-env';
import { test, expect } from '@playwright/test';
import { connectToDatabase } from '../lib/mongodb';
import { User } from '../lib/models/User';

test.describe('PsychiatryX Authentication & Authorization E2E', () => {
  const testUsername = 'testdoctor_' + Math.floor(Math.random() * 100000) + '@clinic.com';
  const testPassword = 'Password123!';
  const testName = 'Dr. Test Assistant';
  const testClinic = 'Automation Test Clinic';

  test.beforeAll(async () => {
    // Connect to database and clean up any potential leftover test user
    await connectToDatabase();
    await User.deleteMany({ username: { $regex: /^testdoctor_/ } });
  });

  test('POST /api/auth/register should create a new user account', async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: {
        name: testName,
        username: testUsername,
        password: testPassword,
        clinicName: testClinic
      }
    });

    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data.message).toBe('Account created successfully');
    expect(data.user).toBeDefined();
    expect(data.user.username).toBe(testUsername.toLowerCase());
    expect(data.user.clinicId).toBeDefined();
    expect(data.user.clinicId).toContain('clinic-');
  });

  test('POST /api/auth/register should reject duplicate username', async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: {
        name: testName,
        username: testUsername, // duplicate
        password: testPassword,
        clinicName: testClinic
      }
    });

    expect(res.status()).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Username already taken');
  });

  test('POST /api/auth/register should validate password length', async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: {
        name: testName,
        username: 'shortpass@clinic.com',
        password: '123',
        clinicName: testClinic
      }
    });

    expect(res.status()).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Password must be at least 6 characters long');
  });

  test('POST /api/auth/login should authenticate successfully', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: {
        username: testUsername,
        password: testPassword
      }
    });

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.token).toBeDefined();
    expect(data.user.name).toBe(testName);
  });

  test('POST /api/auth/login should reject invalid credentials', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: {
        username: testUsername,
        password: 'WrongPassword!'
      }
    });

    expect(res.status()).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Invalid credentials');
  });

  test('Frontend Auth Guard - should block access and show Sign In screen', async ({ page }) => {
    // Clear local storage and navigate with test=false to force showing login page
    await page.goto('/?test=false');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Verify auth container is visible and normal app dashboard is hidden
    const authOverlay = page.locator('.auth-overlay');
    await expect(authOverlay).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h2:has-text("Clinician Sign In")')).toBeVisible();

    const appContainer = page.locator('#app');
    await expect(appContainer).toHaveClass(/hidden/);
  });

  test('Frontend Auth Guard - should support registration and auto-login', async ({ page }) => {
    await page.goto('/?test=false');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Go to Create Account screen
    await page.locator('text=Create Account').click();
    await expect(page.locator('h2:has-text("Create Clinician Account")')).toBeVisible();

    // Fill in registration form
    const regUsername = 'flowdoc_' + Math.floor(Math.random() * 100000) + '@clinic.com';
    await page.locator('#reg-user-fullname').fill('Dr. Flow Test');
    await page.locator('#reg-user-username').fill(regUsername);
    await page.locator('#reg-user-clinicname').fill('Flow Test Clinic');
    await page.locator('#reg-user-password').fill('securepassword123');
    await page.locator('#reg-user-confirm-password').fill('securepassword123');

    // Submit form and verify redirection to dashboard
    await page.locator('button:has-text("Create Account")').click();
    
    // Auth card should disappear and app container should become visible
    await expect(page.locator('#app')).not.toHaveClass(/hidden/, { timeout: 15000 });
    await expect(page.locator('#sync-text')).toHaveText(/(Connected & Synced|Syncing data...)/, { timeout: 15000 });

    // Logout and verify we are blocked again
    await page.locator('text=Logout').click();
    await expect(page.locator('.auth-overlay')).toBeVisible();
  });
});
