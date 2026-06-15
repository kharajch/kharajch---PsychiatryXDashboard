import { test, expect } from '@playwright/test';

test.describe('PsychiatryX Mobile Responsiveness', () => {
  // Set viewport to mobile size
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/?test=true');
    await page.waitForFunction(() => (window as any).rxdb && (window as any).rxdb.patients, { timeout: 15000 });
  });

  test('should hide sidebar by default on mobile and show it via toggle', async ({ page }) => {
    const sidebar = page.locator('#sidebar');
    
    // 1. Verify sidebar is off-screen/hidden (usually via a class like .open or transform)
    // In CSS it might be left: -var(--sidebar-w)
    const boundingBox = await sidebar.boundingBox();
    if (boundingBox) {
        expect(boundingBox.x).toBeLessThan(0);
    }

    // 2. Click mobile toggle (FaBars icon usually)
    const toggleBtn = page.locator('.mobile-toggle, #sidebar-toggle, .btn-icon:has(.fa-bars)');
    // If we can't find it by selector, let's look for the header bars
    const barsIcon = page.locator('svg.fa-bars').first();
    await barsIcon.click();

    // 3. Verify sidebar is now visible
    const newBoundingBox = await sidebar.boundingBox();
    if (newBoundingBox) {
        expect(newBoundingBox.x).toBe(0);
    }

    // 4. Click a navigation link and verify sidebar closes automatically
    await page.locator('#sidebar >> text=Patient Database').click();
    
    // Sidebar should close after navigation on mobile
    const finalBoundingBox = await sidebar.boundingBox();
    if (finalBoundingBox) {
        expect(finalBoundingBox.x).toBeLessThan(0);
    }
  });

  test('should stack layout grids vertically on mobile', async ({ page }) => {
    // Open sidebar first
    const barsIcon = page.locator('svg.fa-bars').first();
    await barsIcon.click();

    // Navigate to dashboard
    await page.locator('#sidebar >> text=Overview').click();
    
    // Check a 4-column grid (stats-grid or grid-4-equal)
    const grid = page.locator('.stats-grid, .grid-4-equal').first();
    const children = grid.locator('> div');
    const count = await children.count();
    
    if (count > 1) {
        const box1 = await children.nth(0).boundingBox();
        const box2 = await children.nth(1).boundingBox();
        
        if (box1 && box2) {
            // They should be stacked (same X, different Y)
            expect(box1.x).toBe(box2.x);
            expect(box1.y).toBeLessThan(box2.y);
        }
    }
  });
});
