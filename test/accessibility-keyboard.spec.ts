import { test, expect } from '@playwright/test';

test.describe('PsychiatryX Accessibility - Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?test=true');
    await page.waitForFunction(() => (window as any).rxdb && (window as any).rxdb.patients, { timeout: 15000 });
  });

  test('should support numerical key mapping to assessment options', async ({ page }) => {
    // 1. Register a test patient
    await page.locator('button:has-text("New Patient")').first().click();
    await page.locator('#reg-name').fill('Keyboard Test Patient');
    await page.locator('#reg-age').fill('28');
    await page.locator('#reg-gender').selectOption('Non-Binary');
    await page.locator('button:has-text("Register Patient")').click();

    // 2. Start Depression assessment
    await page.locator('#nav-assess').click();
    await page.locator('text=Depression (CDA-17)').click();

    // 3. Press '1' to select the first option (score 0 usually, but let's check)
    // Actually, usually '1' -> first option, '2' -> second option, etc.
    // Or '0', '1', '2', '3' mapping to scores.
    // The mandate says "mapping numerical keys to assessment options".
    
    await page.keyboard.press('0');
    // Verify first option is selected
    await expect(page.locator('.q-option').nth(0)).toHaveClass(/selected/);

    await page.keyboard.press('1');
    // Verify second option is selected
    await expect(page.locator('.q-option').nth(1)).toHaveClass(/selected/);

    await page.keyboard.press('2');
    // Verify third option is selected
    await expect(page.locator('.q-option').nth(2)).toHaveClass(/selected/);

    // 4. Press 'Enter' or 'Space' or 'ArrowRight' to go to next question?
    // Mandate doesn't specify, but "keyboard-first" implies it.
    await page.keyboard.press('ArrowRight');
    // Verify we are on question 2
    await expect(page.locator('text=Question 2 of 17')).toBeVisible();

    await page.keyboard.press('0');
    await expect(page.locator('.q-option').nth(0)).toHaveClass(/selected/);
  });
});
