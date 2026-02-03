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
        it('should maintain strict horizontal alignment for metrics', async () => {
            await page.setViewport({ width: 2560, height: 1440 });
            // Increase wait for simulation and rendering
            await page.evaluate(() => new Promise(r => setTimeout(r, 2000)));

            const res = await checkHorizontalScroll();
            expect(res.hasScroll).toBe(false);

            // Key Metrics: 7 columns
            const keyMetricsCols = await page.evaluate(() => {
                const el = document.querySelector('#key-metrics-row');
                if (!el) return 0;
                return window.getComputedStyle(el).gridTemplateColumns.split(' ').length;
            });
            expect(keyMetricsCols).toBe(7);

            // Comprehensive Metrics: 6 columns
            const compMetricsCols = await page.evaluate(() => {
                const el = document.querySelector('#comprehensiveMetrics');
                if (!el) return 0;
                return window.getComputedStyle(el).gridTemplateColumns.split(' ').length;
            });
            expect(compMetricsCols).toBe(6);

            // Coach Insights: 3 columns
            const coachCols = await page.evaluate(() => {
                const el = document.querySelector('#coachMessageList');
                if (!el) return 0;
                console.log('Coach Grid Layout:', window.getComputedStyle(el).gridTemplateColumns);
                return window.getComputedStyle(el).gridTemplateColumns.split(' ').length;
            });
            expect(coachCols).toBe(3);
        });
    });

    describe('Laptop Standard (1366x768)', () => {
        it('should maintain horizontal alignment on laptop screens', async () => {
            await page.setViewport({ width: 1366, height: 768 });
            await page.evaluate(() => new Promise(r => setTimeout(r, 1000)));

            // Key Metrics: 7 columns
            const keyMetricsCols = await page.evaluate(() => {
                const el = document.querySelector('#key-metrics-row');
                return window.getComputedStyle(el).gridTemplateColumns.split(' ').length;
            });
            expect(keyMetricsCols).toBe(7);

            // Comprehensive Metrics: 6 columns
            const compMetricsCols = await page.evaluate(() => {
                const el = document.querySelector('#comprehensiveMetrics');
                return window.getComputedStyle(el).gridTemplateColumns.split(' ').length;
            });
            expect(compMetricsCols).toBe(6);
        });
    });

    describe('Mobile (375x812)', () => {
        it('should stack grid components correctly on mobile', async () => {
            await page.setViewport({ width: 375, height: 812 });
            await page.waitForSelector('#coach-insights');

            // Key Metrics: 2 columns (md:grid-cols-4, default grid-cols-2)
            const keyMetricsCols = await page.evaluate(() => {
                const el = document.querySelector('#key-metrics-row');
                return window.getComputedStyle(el).gridTemplateColumns.split(' ').length;
            });
            expect(keyMetricsCols).toBe(2);

            // Comprehensive Metrics: 1 column
            const compMetricsCols = await page.evaluate(() => {
                const el = document.querySelector('#comprehensiveMetrics');
                return window.getComputedStyle(el).gridTemplateColumns.split(' ').length;
            });
            expect(compMetricsCols).toBe(1);
        });
    });
});
