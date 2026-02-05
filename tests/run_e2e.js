#!/usr/bin/env node
/**
 * E2E Test Runner for RetireFire
 * Runs comprehensive E2E tests against the running application
 */

const { execSync } = require('child_process');
const http = require('http');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
    console.log('\n' + '='.repeat(60));
    log(`  ${message}`, 'cyan');
    console.log('='.repeat(60) + '\n');
}

async function checkServerRunning(url = 'http://localhost:5173') {
    return new Promise((resolve) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: 'GET',
            timeout: 2000
        };

        const req = http.request(options, (res) => {
            resolve(res.statusCode === 200);
        });

        req.on('error', () => resolve(false));
        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });

        req.end();
    });
}

async function main() {
    header('🌐 RETIREFIRE E2E TEST SUITE');

    // Check if dev server is running
    log('Checking if dev server is running...', 'cyan');
    const serverRunning = await checkServerRunning();

    if (!serverRunning) {
        log('❌ Dev server is not running!', 'red');
        log('Please start the dev server first:', 'yellow');
        log('  npm run dev', 'yellow');
        log('\nThen run E2E tests again.', 'yellow');
        process.exit(1);
    }

    log('✓ Dev server is running\n', 'green');

    // Run E2E tests
    header('Running E2E Tests');

    try {
        execSync('npx vitest run tests/e2e/', {
            stdio: 'inherit',
            cwd: __dirname + '/..'
        });

        header('✅ E2E TESTS PASSED');
        process.exit(0);
    } catch (_error) {
        header('❌ E2E TESTS FAILED');
        log('\nSome E2E tests failed. This is expected if:', 'yellow');
        log('  • Features are not yet implemented', 'yellow');
        log('  • UI elements have changed', 'yellow');
        log('  • Tooltips/hover effects need fixes', 'yellow');
        log('\nReview the output above for details.', 'yellow');
        process.exit(1);
    }
}

main().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
});
