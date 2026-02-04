import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOTS_DIR = path.resolve(__dirname, '../tests/screenshots');
const APP_URL = 'http://localhost:5173';

async function capture() {
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
        fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }

    console.log(`🚀 Launching browser to ${APP_URL}...`);
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 900 });

        console.log('🔗 Navigating to app...');
        await page.goto(APP_URL, { waitUntil: 'networkidle0' });

        // Wait for charts to hydrate and data to settle
        console.log('⏳ Waiting for charts to hydrate...');
        await new Promise(r => setTimeout(r, 5000));

        // Ensure we are in a state with data (e.g., scenarios calculated)
        await page.evaluate(() => {
            // Trigger a recalculation if needed or just ensure dashboard is active
            if (window.updateDashboard) window.updateDashboard();
        });

        const targets = [
            { id: 'chartNetWorth', name: 'dashboard-overview' },
            { id: 'chartMonteCarlo', name: 'monte-carlo-analysis' },
            { id: 'gaugeSuccess', name: 'success-probability' },
            { id: 'chartMoneyFlow', name: 'money-flow' }
        ];

        for (const target of targets) {
            console.log(`📸 Capturing ${target.name}...`);
            const element = await page.$(`#${target.id}`);
            if (element) {
                // Scroll into view to ensure it's rendered
                await element.scrollIntoView();
                await new Promise(r => setTimeout(r, 500));

                await element.screenshot({
                    path: path.join(SCREENSHOTS_DIR, `${target.name}.png`),
                    omitBackground: false
                });
                console.log(`✅ Saved ${target.name}.png`);
            } else {
                console.warn(`⚠️  Target #${target.id} not found on page.`);
            }
        }

    } catch (error) {
        console.error('❌ Capture failed:', error);
    } finally {
        await browser.close();
        console.log('👋 Browser closed.');
    }
}

capture();
