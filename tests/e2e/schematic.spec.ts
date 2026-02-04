import { test, expect } from '@playwright/test';

test.describe('Dashboard Schematic Verification', () => {
    const resolutions = [
        { name: 'Desktop', width: 1920, height: 1080, expectedCols: 3 },
        { name: 'Tablet', width: 768, height: 1024, expectedCols: 2 },
        { name: 'Mobile', width: 375, height: 667, expectedCols: 1 }
    ];

    for (const res of resolutions) {
        test(`Verify schematic at ${res.name} (${res.width}x${res.height})`, async ({ page }) => {
            await page.setViewportSize({ width: res.width, height: res.height });
            await page.goto('/');
            await page.waitForSelector('.dashboard-grid');

            const grid = page.locator('.dashboard-grid');
            // Robust check using poll to allow for layout shifts/resize delays
            await expect.poll(async () => {
                const gridTemplate = await grid.evaluate((el) => window.getComputedStyle(el).gridTemplateColumns);
                return gridTemplate.split(/\s+/).filter(s => s.trim().length > 0).length;
            }, { timeout: 10000 }).toBe(res.expectedCols);

            if (res.name === 'Desktop') {
                const cardOrder = [
                    'section-yearexplorer', 'section-tables', 'section-gapcalc',
                    'section-networth', 'section-allocation', 'section-legacy',
                    'section-income', 'section-surplusgap', 'section-moneyflow',
                    'section-expenses', 'section-expense-pie', 'section-healthcare',
                    'section-taxes', 'section-socialsecurity', 'section-sscomparison',
                    'section-roth', 'section-planimprovement', 'section-taxdelta',
                    'section-whatif', 'section-stresstest', 'section-sequencerisk',
                    'section-withdrawals', 'section-safe-withdrawal',
                    'section-montecarlo'
                ];

                for (const id of cardOrder) {
                    const card = page.locator(`#${id}`);
                    // Increase timeout for dynamic charts
                    await expect(card).toBeVisible({ timeout: 15000 });
                }
            }
        });
    }
});
