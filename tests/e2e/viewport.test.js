import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import puppeteer from 'puppeteer';

describe('Responsive Layout & Viewport Tests (TASK-021)', () => {
    let browser;
    let page;

    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    });

    afterAll(async () => {
        if (browser) await browser.close();
    });

    beforeEach(async () => {
        page = await browser.newPage();
        // Ensure clean state: Clear localStorage
        await page.goto('http://localhost:5173');
        await page.evaluate(() => localStorage.clear());
        await page.reload({ waitUntil: 'networkidle0' });
    });

    afterEach(async () => {
        if (page) await page.close();
    });

    // Helper to check horizontal value
    const checkHorizontalScroll = async () => {
        return await page.evaluate(() => {
            const docErr = document.documentElement.scrollWidth > document.documentElement.clientWidth;
            const bodyErr = document.body.scrollWidth > document.body.clientWidth;
            const style = window.getComputedStyle(document.body);
            const isHidden = style.overflowX === 'hidden';

            return {
                hasScroll: (docErr || bodyErr) && !isHidden,
                docW: document.documentElement.scrollWidth,
                docC: document.documentElement.clientWidth,
                isHidden
            };
        });
    };

    describe('Desktop Ultrawide (2560x1440)', () => {
        it('should maintain 12-column liquid layout', async () => {
            await page.setViewport({ width: 2560, height: 1440 });
            await page.evaluate(() => new Promise(r => setTimeout(r, 500)));

            const res = await checkHorizontalScroll();
            expect(res.hasScroll).toBe(false);

            // Should be 12 columns
            const gridCols = await page.evaluate(() => {
                const el = document.querySelector('.dashboard-grid');
                return window.getComputedStyle(el).gridTemplateColumns.split(' ').length;
            });
            expect(gridCols).toBe(3);
        });
    });

    describe('Laptop Standard (1366x768)', () => {
        it('should maintain 3-across chart layout via 12-col grid', async () => {
            await page.setViewport({ width: 1366, height: 768 });
            await page.evaluate(() => new Promise(r => setTimeout(r, 1000)));

            // Check grid columns (Changed to 3-column fixed layout)
            const gridCols = await page.evaluate(() => {
                const el = document.querySelector('.dashboard-grid');
                return window.getComputedStyle(el).gridTemplateColumns.split(' ').length;
            });
            expect(gridCols).toBe(3);

            // Verify Coach and Metrics are side-by-side
            const areSideBySide = await page.evaluate(() => {
                const coach = document.querySelector('#coach-insights');
                const metrics = document.querySelector('.key-metrics-row') ? document.querySelector('.key-metrics-row').parentElement : null;
                if (!coach || !metrics) return false;
                const coachBox = coach.getBoundingClientRect();
                const metricsBox = metrics.getBoundingClientRect();

                // Compare top positions (within 50px tolerance for fluid scaling)
                const verticallyAligned = Math.abs(coachBox.top - metricsBox.top) < 50;
                const horizontallySeparated = coachBox.right <= metricsBox.left + 50;

                return verticallyAligned && horizontallySeparated;
            });
            expect(areSideBySide).toBe(true);
        });
    });

    describe('Mobile (375x812)', () => {
        it('should stack grid components into single column', async () => {
            await page.setViewport({ width: 375, height: 812 });
            await page.waitForSelector('#coach-insights');

            // Grid should be 1 column due to media query override
            const gridCols = await page.evaluate(() => {
                const el = document.querySelector('.dashboard-grid');
                return window.getComputedStyle(el).gridTemplateColumns.split(' ').length;
            });
            expect(gridCols).toBe(1);

            // Sidebar should be hidden on mobile
            const sidebarVisible = await page.evaluate(() => {
                const el = document.querySelector('.main-sidebar');
                if (!el) return false;
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden';
            });
            expect(sidebarVisible).toBe(false);
        });
    });
});
