
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper to wait
const delay = (time) => new Promise(function (resolve) {
    setTimeout(resolve, time)
});

describe('Monte Carlo Parameters E2E', () => {
    let browser;
    let page;

    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        page = await browser.newPage();

        // Load the local app
        // Assuming the app is running or we load the file directly. 
        // Since we are in a test env, we might need to rely on the build or a dev server.
        // For simplicity in this env, we often rely on a file URL or localhost if running.
        // Let's assume we can load the build index.html or use a relative path if supported.
        // Better: Use the same pattern as other E2E tests.

        // Checking how other tests load the page.
        // They typically assume a server is running or load a file.
        // I'll assume we need to point to the distinct file if we don't have a server 
        // but robust tests usually spin one up. 
        // I'll check 'tests/e2e/comprehensive.test.js' pattern first.

        await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    });

    afterAll(async () => {
        await browser.close();
    });

    it('should display the new Monte Carlo controls', async () => {
        // Navigate to Monte Carlo section
        // It might be down the page.
        const mcSection = await page.$('#section-montecarlo');
        expect(mcSection).toBeTruthy();

        // Check for slider
        const slider = await page.$('#mcSpendScenario[type="range"]');
        expect(slider).toBeTruthy();

        // Check for dropdown options
        const scenarioSelect = await page.$('#mcScenario');
        const options = await page.evaluate(el => Array.from(el.options).map(o => o.value), scenarioSelect);
        expect(options).toContain('last-10');
        expect(options).toContain('last-20');
        expect(options).toContain('depression');
    });

    it('should update spending label when slider moves', async () => {
        // Change slider value
        await page.evaluate(() => {
            const slider = document.getElementById('mcSpendScenario');
            slider.value = 1.2;
            slider.dispatchEvent(new Event('input'));
        });

        const labelVal = await page.$eval('#mcSpendVal', el => el.textContent);
        expect(labelVal).toBe('120%');
    });

    it('should run simulation and produce higher median net worth for Last 10 Years scenario', async () => {
        const parseCurrency = (str) => parseFloat(str.replace(/[^0-9.-]+/g, ''));

        // 1. Run baseline (Monte Carlo)
        await page.evaluate(() => {
            document.getElementById('mcScenario').value = 'monte-carlo';
            document.getElementById('mcSpendScenario').value = 1.0; // Reset Spend
            runMonteCarloSimulation();
        });
        await delay(500);
        const medianBase = await page.$eval('#mc50', el => el.textContent);
        const baseVal = parseCurrency(medianBase);

        // 2. Run Last 10 Years (Bull Run)
        await page.evaluate(() => {
            document.getElementById('mcScenario').value = 'last-10';
            runMonteCarloSimulation();
        });
        await delay(500);
        const medianBull = await page.$eval('#mc50', el => el.textContent);
        const bullVal = parseCurrency(medianBull);

        console.log(`Base Median: ${medianBase} (${baseVal}), Last 10 Median: ${medianBull} (${bullVal})`);
        expect(bullVal).toBeGreaterThan(baseVal);
    });
});
