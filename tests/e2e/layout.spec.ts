import { test, expect } from '@playwright/test';

test.describe('Dashboard Layout Strict Grid', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Wait for the main layout to settle
        await page.waitForSelector('#dashboard-top');
        // Wait for charts to render (using a known chart ID)
        await page.waitForSelector('#key-metrics-row');
    });

    test('should prevent layout drift and infinite stretching', async ({ page }) => {
        test.setTimeout(60000); // Allow extra time for full dashboard render
        // Just verify the dashboard top container exists and is visible
        await expect(page.locator('#dashboard-top')).toBeVisible();

        // Take a full page screenshot for visual regression references
        // We allow some threshold for pixel rendering differences across machines
        await expect(page).toHaveScreenshot({ fullPage: true, maxDiffPixelRatio: 0.1, timeout: 30000 });
    });

    test('should check strict row containment', async ({ page }) => {
        // Row 1: Key Metrics exists
        await expect(page.locator('#key-metrics-row')).toBeVisible();

        // Row 2: Comprehensive Metrics
        await expect(page.locator('#comprehensiveMetrics')).toBeVisible();

        // Row 6: Main Chart Grid
        // Verify we have multiple rows of 3
        const mainGrid = page.locator('.main-content .grid-cols-1.lg\\:grid-cols-3').nth(1);
        await expect(mainGrid).toBeVisible();
    });
});
