import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    testMatch: /.*\.spec\.ts/,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:5173',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'Laptop (1366x768)',
            use: { viewport: { width: 1366, height: 768 } },
        },
        {
            name: 'Desktop HD (1920x1080)',
            use: { viewport: { width: 1920, height: 1080 } },
        },
        {
            name: 'Desktop 2K (2560x1440)',
            use: { viewport: { width: 2560, height: 1440 } },
        },
        {
            name: 'Ultrawide (3440x1440)',
            use: { viewport: { width: 3440, height: 1440 } },
        },
        // Mobile fallback for sanity checks (optional)
        {
            name: 'Mobile Chrome',
            use: { ...devices['Pixel 5'] },
        },
    ],
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
    },
});
