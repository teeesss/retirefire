import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Settings Modal
 * 
 * Covers:
 * - Opening/closing settings modal
 * - Modifying housing settings
 * - Applying settings and triggering recalculation
 * - Reset to defaults functionality
 * - Settings persistence
 */

test.describe('Settings Modal', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173');
        await page.waitForLoadState('networkidle');
        // Wait for app initialization
        await page.waitForTimeout(1000);
    });

    test('should open and close settings modal', async ({ page }) => {
        // Open settings
        const openButton = page.locator('#openSettings, [data-testid="open-settings"]').first();
        await openButton.click();

        // Verify modal is visible
        const modal = page.locator('.settings-modal, [data-testid="settings-modal"]').first();
        await expect(modal).toBeVisible();

        // Close modal
        const closeButton = page.locator('.settings-modal .close, [data-testid="close-settings"]').first();
        await closeButton.click();

        // Verify modal is hidden
        await expect(modal).not.toBeVisible();
    });

    test('should save and apply housing settings', async ({ page }) => {
        // Open settings
        await page.click('#openSettings, [data-testid="open-settings"]');
        await page.waitForTimeout(500);

        // Get initial Net Worth value for comparison
        const initialNW = await page.textContent('#metricCurrentNW, [data-testid="current-nw"]');

        // Modify housing settings
        const homeValueInput = page.locator('#homeValue, [name="homeValue"], [data-testid="home-value"]').first();
        await homeValueInput.fill('500000');

        const mortgageInput = page.locator('#mortgageBalance, [name="mortgageBalance"], [data-testid="mortgage-balance"]').first();
        await mortgageInput.fill('300000');

        // Apply settings
        const applyButton = page.locator('#applySettings, [data-testid="apply-settings"], button:has-text("Apply")').first();
        await applyButton.click();

        // Wait for recalculation
        await page.waitForTimeout(500);

        // Verify modal closed
        const modal = page.locator('.settings-modal').first();
        await expect(modal).not.toBeVisible();

        // Verify Net Worth updated (should have changed)
        const newNW = await page.textContent('#metricCurrentNW, [data-testid="current-nw"]');
        expect(newNW).not.toBe(initialNW);
    });

    test('should reset settings to defaults', async ({ page }) => {
        // Open settings
        await page.click('#openSettings, [data-testid="open-settings"]');
        await page.waitForTimeout(500);

        // Modify a value
        const homeValueInput = page.locator('#homeValue, [name="homeValue"]').first();
        await homeValueInput.fill('999999');

        // Verify value changed
        let homeValue = await homeValueInput.inputValue();
        expect(homeValue).toBe('999999');

        // Click reset button
        const resetButton = page.locator('#resetToDefaults, [data-testid="reset-settings"], button:has-text("Reset")').first();
        await resetButton.click();

        // Wait for reset
        await page.waitForTimeout(300);

        // Verify value was reset (should not be 999999 anymore)
        homeValue = await homeValueInput.inputValue();
        expect(homeValue).not.toBe('999999');
    });

    test('should persist settings across page reload', async ({ page }) => {
        // Open settings and modify
        await page.click('#openSettings, [data-testid="open-settings"]');
        await page.waitForTimeout(500);

        const retireAgeInput = page.locator('#retireAge, [name="retireAge"], [data-testid="retire-age"]').first();
        await retireAgeInput.fill('67');

        // Apply
        await page.click('#applySettings, [data-testid="apply-settings"], button:has-text("Apply")');
        await page.waitForTimeout(500);

        // Reload page
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Open settings again
        await page.click('#openSettings, [data-testid="open-settings"]');
        await page.waitForTimeout(500);

        // Verify setting persisted
        const retireAge = await retireAgeInput.inputValue();
        expect(retireAge).toBe('67');
    });

    test('should update Social Security settings', async ({ page }) => {
        // Open settings
        await page.click('#openSettings, [data-testid="open-settings"]');
        await page.waitForTimeout(500);

        // Modify SS claim age
        const claimAgeSelect = page.locator('#ssClaimAge, [name="ssClaimAge"], [data-testid="ss-claim-age"]').first();
        await claimAgeSelect.selectOption('70');

        // Modify SS benefit amount
        const ssBenefitInput = page.locator('#ssBenefit, [name="ss67"], [data-testid="ss-benefit"]').first();
        await ssBenefitInput.fill('3000');

        // Apply
        await page.click('#applySettings, [data-testid="apply-settings"], button:has-text("Apply")');
        await page.waitForTimeout(500);

        // Verify SS metric updated on dashboard
        const ssMetric = await page.textContent('#metricSS, [data-testid="ss-metric"]');
        expect(ssMetric).toContain('3000');
    });

    test('should update expense settings and trigger recalculation', async ({ page }) => {
        // Get initial metrics
        await page.waitForTimeout(500);
        const initialPeakNW = await page.textContent('#metricPeakNW, [data-testid="peak-nw"]');

        // Open settings
        await page.click('#openSettings, [data-testid="open-settings"]');
        await page.waitForTimeout(500);

        // Increase annual spending significantly
        const spendingInput = page.locator('#annualSpending, [name="annualSpending"], [data-testid="annual-spending"]').first();
        await spendingInput.fill('150000');

        // Apply
        await page.click('#applySettings, [data-testid="apply-settings"], button:has-text("Apply")');
        await page.waitForTimeout(1000); // Wait for recalculation

        // Verify Peak NW changed (should be lower with higher spending)
        const newPeakNW = await page.textContent('#metricPeakNW, [data-testid="peak-nw"]');
        expect(newPeakNW).not.toBe(initialPeakNW);
    });

    test('should cancel settings changes without applying', async ({ page }) => {
        // Open settings
        await page.click('#openSettings, [data-testid="open-settings"]');
        await page.waitForTimeout(500);

        // Get initial value
        const homeValueInput = page.locator('#homeValue, [name="homeValue"]').first();
        const initialValue = await homeValueInput.inputValue();

        // Modify value
        await homeValueInput.fill('999999');

        // Cancel/close without applying
        const cancelButton = page.locator('.settings-modal .close, [data-testid="close-settings"], button:has-text("Cancel")').first();
        await cancelButton.click();

        // Reopen settings
        await page.click('#openSettings, [data-testid="open-settings"]');
        await page.waitForTimeout(500);

        // Verify value was not saved
        const currentValue = await homeValueInput.inputValue();
        expect(currentValue).toBe(initialValue);
        expect(currentValue).not.toBe('999999');
    });

    test('should handle invalid input gracefully', async ({ page }) => {
        // Open settings
        await page.click('#openSettings, [data-testid="open-settings"]');
        await page.waitForTimeout(500);

        // Try to input invalid value (negative)
        const homeValueInput = page.locator('#homeValue, [name="homeValue"]').first();
        await homeValueInput.fill('-50000');

        // Try to apply
        await page.click('#applySettings, [data-testid="apply-settings"], button:has-text("Apply")');
        await page.waitForTimeout(500);

        // Settings modal should either:
        // 1. Show validation error and stay open, OR
        // 2. Sanitize input and close
        // We check that the app doesn't crash
        const appElement = page.locator('#app');
        await expect(appElement).toBeVisible();
    });

    test('should navigate between settings tabs', async ({ page }) => {
        // Open settings
        await page.click('#openSettings, [data-testid="open-settings"]');
        await page.waitForTimeout(500);

        // Check if tabs exist
        const housingTab = page.locator('[data-tab="housing"], .tab-housing, button:has-text("Housing")').first();
        const assetsTab = page.locator('[data-tab="assets"], .tab-assets, button:has-text("Assets")').first();

        if (await housingTab.isVisible()) {
            await housingTab.click();
            await page.waitForTimeout(200);

            // Verify housing content is visible
            const homeValueInput = page.locator('#homeValue, [name="homeValue"]').first();
            await expect(homeValueInput).toBeVisible();

            // Switch to assets tab
            if (await assetsTab.isVisible()) {
                await assetsTab.click();
                await page.waitForTimeout(200);

                // Verify assets content is visible
                const retirementInput = page.locator('#retirement, [name="retirement"], [data-testid="retirement-balance"]').first();
                await expect(retirementInput).toBeVisible();
            }
        }
    });
});
