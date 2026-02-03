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
        // Ensure clean state: Clear localStorage to prevent layout preferences from desktop tests polluting laptop/mobile tests
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
        it('should maintain layout integrity', async () => {
            await page.setViewport({ width: 2560, height: 1440 });
            await page.evaluate(() => new Promise(r => setTimeout(r, 500)));

            const res = await checkHorizontalScroll();
            expect(res.hasScroll).toBe(false);

            // Should have 4+ columns
            const gridCols = await page.evaluate(() => {
                const el = document.querySelector('.dashboard-grid');
                return window.getComputedStyle(el).gridTemplateColumns.split(' ').length;
            });
            expect(gridCols).toBeGreaterThanOrEqual(4);
        });
    });

    describe('Laptop Standard (1366x768)', () => {
        it('should proper grid layout', async () => {
            await page.setViewport({ width: 1366, height: 768 });
            await page.evaluate(() => new Promise(r => setTimeout(r, 1000)));

            // Check grid columns
            const gridCols = await page.evaluate(() => {
                const el = document.querySelector('.dashboard-grid');
                return window.getComputedStyle(el).gridTemplateColumns.split(' ').length;
            });
            // Should be <= 3 due to 1400px breakpoint
            expect(gridCols).toBeLessThanOrEqual(3);

            // Check scroll (should be false)
            const res = await checkHorizontalScroll();
            expect(res.hasScroll).toBe(false);
        });
    });

    describe('Mobile (375x812)', () => {
        it('should have hidden sidebar and stacked grid', async () => {
            await page.setViewport({ width: 375, height: 812 });
            await page.evaluate(() => new Promise(r => setTimeout(r, 500)));

            const sidebarState = await page.evaluate(() => {
                const el = document.querySelector('.main-sidebar');
                const style = window.getComputedStyle(el);
                return {
                    left: el.getBoundingClientRect().left,
                    cssLeft: parseInt(style.left)
                };
            });

            expect(sidebarState.cssLeft).toBeLessThan(0);

            // Grid should be 1 column
            const gridCols = await page.evaluate(() => {
                const el = document.querySelector('.dashboard-grid');
                return window.getComputedStyle(el).gridTemplateColumns.split(' ').length;
            });
            expect(gridCols).toBe(1);
        });
    });
});
