import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer from 'puppeteer';

describe('E2E: Console Reliability', () => {
    let browser;
    let page;
    const APP_URL = 'http://localhost:5173';
    const consoleLogs = [];
    const consoleErrors = [];
    const consoleWarnings = [];

    let shouldSkip = false;

    beforeAll(async () => {
        try {
            browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            page = await browser.newPage();
        } catch (e) {
            console.log('Skipping E2E tests: Browser failed to launch (likely CI environment)');
            shouldSkip = true;
            return;
        }

        // Listen to console events
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();

            if (type === 'error') {
                consoleErrors.push({ text, location: msg.location() });
            } else if (type === 'warning') {
                consoleWarnings.push({ text, location: msg.location() });
            } else {
                consoleLogs.push({ text, type });
            }
        });

        // Listen for page errors (crashes, unhandled exceptions)
        page.on('pageerror', error => {
            consoleErrors.push({ text: `Page Error: ${error.message}`, stack: error.stack });
        });

        // Listen for failed requests
        page.on('requestfailed', request => {
            consoleErrors.push({ text: `Request Failed: ${request.url()} (${request.failure().errorText})` });
        });

        await page.setViewport({ width: 1920, height: 1080 });
        await page.goto(APP_URL, { waitUntil: 'networkidle2' });
        await page.waitForTimeout(5000); // Give it plenty of time to initialize
    }, 30000);

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });

    it('should have zero console errors', function () {
        if (shouldSkip) this.skip();
        if (consoleErrors.length > 0) {
            throw new Error(`Captured Console Errors:\n${JSON.stringify(consoleErrors, null, 2)}`);
        }
    });

    it('should have zero critical console warnings', function () {
        if (shouldSkip) this.skip();
        const criticalWarnings = consoleWarnings.filter(w =>
            w.text.includes('Failed to load') ||
            w.text.includes('not found') ||
            w.text.includes('Error')
        );
        if (criticalWarnings.length > 0) {
            throw new Error(`Captured Critical Warnings:\n${JSON.stringify(criticalWarnings, null, 2)}`);
        }
    });

    it('should not have "null textContent" or "cannot read properties of null" errors', function () {
        if (shouldSkip) this.skip();
        const nullErrors = consoleErrors.filter(e =>
            e.text.toLowerCase().includes('null') &&
            (e.text.toLowerCase().includes('property') || e.text.toLowerCase().includes('textcontent'))
        );
        if (nullErrors.length > 0) {
            throw new Error(`Captured Null Pointer Errors:\n${JSON.stringify(nullErrors, null, 2)}`);
        }
    });

    it('should have Chart.js global available', async function () {
        if (shouldSkip) this.skip();
        const hasChart = await page.evaluate(() => typeof Chart !== 'undefined');
        expect(hasChart).toBe(true);
    });

    it('should have all partials loaded (no 404s)', function () {
        if (shouldSkip) this.skip();
        const fallbackErrors = consoleErrors.filter(e => e.text.includes('404'));
        expect(fallbackErrors.length, 'Found 404 errors for assets or partials').toBe(0);
    });
});
