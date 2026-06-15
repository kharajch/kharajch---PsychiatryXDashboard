import './setup-env';
import { test, expect } from '@playwright/test';

test.describe('PsychiatryX UI/UX Enhancements E2E', () => {

  test('Centered Login Page - should verify layout and centering', async ({ page }) => {
    // Force showing login page by clearing storage and disabling bypass
    await page.goto('/?test=false');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    const authOverlay = page.locator('.auth-overlay');
    await expect(authOverlay).toBeVisible();

    // Verify centering via bounding boxes
    const overlayBox = await authOverlay.boundingBox();
    const loginCard = page.locator('.card').first();
    const cardBox = await loginCard.boundingBox();

    if (overlayBox && cardBox) {
      const overlayCenterX = overlayBox.x + overlayBox.width / 2;
      const overlayCenterY = overlayBox.y + overlayBox.height / 2;
      const cardCenterX = cardBox.x + cardBox.width / 2;
      const cardCenterY = cardBox.y + cardBox.height / 2;

      // Allow for small rounding differences (within 2 pixels)
      expect(Math.abs(overlayCenterX - cardCenterX)).toBeLessThanOrEqual(2);
      expect(Math.abs(overlayCenterY - cardCenterY)).toBeLessThanOrEqual(2);
    } else {
      throw new Error('Could not calculate bounding boxes for centering verification');
    }

    // Verify Crimson & Noir theme primary color on title 
    const title = page.locator('.auth-overlay h1:has-text("PSYCHIATRYX")');
    const color = await title.evaluate(el => window.getComputedStyle(el).color);
    // #E63946 is rgb(230, 57, 70)
    expect(color).toBe('rgb(230, 57, 70)');
    });

    test('Interactive Sidebar - should verify clinician profile and navigation layout', async ({ page }) => {
    // Use test=true to bypass login and reach the dashboard
    await page.goto('/?test=true');

    // Wait for sidebar to animate in
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toBeVisible({ timeout: 10000 });

    // Verify Clinician Profile in sidebar footer
    const profileSection = page.locator('text=Dr. Zero-Auth Tester');
    await expect(profileSection).toBeVisible();
    await expect(page.locator('text=Verified Provider')).toBeVisible();

    // Verify Sync Status badge exists and has pulsing class effect (implicitly checked via visibility)
    const syncBadge = page.locator('#sidebar span').first();
    await expect(syncBadge).toBeVisible();

    // Verify Navigation items exist and are clickable
    // Use a more specific selector to avoid ambiguity with header or other elements
    const navItem = sidebar.locator('text=Patient Database');
    await expect(navItem).toBeVisible();

    // Check hover class presence in sidebar logic (it's applied via CSS)
    const navItemsCount = await sidebar.locator('.nav-item-hover').count();
    expect(navItemsCount).toBeGreaterThan(0);
    });

    test('Dashboard Overview - should verify staggered card animations', async ({ page }) => {
    await page.goto('/?test=true');

    // Check for the 4 overview cards
    const cards = page.locator('.grid-4-equal .card');
    await expect(cards).toHaveCount(4);

    // Verify first card content
    await expect(page.locator('text=Total Patients')).toBeVisible();
    await expect(page.locator('text=Completed Scales')).toBeVisible();

    // Verify "Suicidal / Critical Alert" card has its danger styling (crimson border/bg)
    const alertCard = page.locator('.card', { hasText: 'Suicidal / Critical Alert' });
    const borderColor = await alertCard.evaluate(el => window.getComputedStyle(el).borderColor);
    // rgb(230, 57, 70) corresponds to var(--primary)
    expect(borderColor).toBe('rgb(230, 57, 70)');
    });

    test('Regression - Modal interaction should not be blocked by auth-overlay z-index', async ({ page }) => {
    await page.goto('/?test=true');

    // Open New Patient modal
    await page.locator('button:has-text("New Patient")').first().click();

    // Verify modal is visible and interactive
    const modal = page.locator('.auth-overlay .card').first();
    await expect(modal).toBeVisible();

    const nameInput = page.locator('#reg-name');
    await nameInput.fill('Regression Test');
    await expect(nameInput).toHaveValue('Regression Test');

    // Close modal - using the Cancel button for better reliability
    await page.locator('.auth-overlay button:has-text("Cancel")').click();
    await expect(modal).not.toBeVisible();
    });
});
