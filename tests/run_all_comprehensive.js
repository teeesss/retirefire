#!/usr/bin/env node
/**
 * Comprehensive Test Runner for RetireFire
 * Runs all unit tests, E2E tests, and generates a report
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
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

function runCommand(command, description) {
    log(`\n▶ ${description}...`, 'blue');
    try {
        const _output = execSync(command, {
            stdio: 'inherit',
            cwd: __dirname + '/..'
        });
        log(`✓ ${description} completed`, 'green');
        return { success: true };
    } catch (error) {
        log(`✗ ${description} failed`, 'red');
        return { success: false, error };
    }
}

async function main() {
    header('🧪 RETIREFIRE COMPREHENSIVE TEST SUITE');

    const results = {
        unit: null,
        e2e: null,
        lint: null
    };

    // 1. Run unit tests
    header('1️⃣  UNIT TESTS (Vitest)');
    results.unit = runCommand('npm test', 'Running unit tests');

    // 2. Run E2E tests (if dev server is running)
    header('2️⃣  E2E BROWSER TESTS (Puppeteer)');
    log('Note: E2E tests require the app to be built first', 'yellow');

    // Check if index.html exists
    const indexPath = path.join(__dirname, '..', 'index.html');
    if (fs.existsSync(indexPath)) {
        results.e2e = runCommand('node tests/e2e_tests.js', 'Running E2E tests');
    } else {
        log('⚠ index.html not found - skipping E2E tests', 'yellow');
        log('  Run "npm run build" first to generate index.html', 'yellow');
        results.e2e = { success: false, skipped: true };
    }

    // 3. Run linting (if available)
    header('3️⃣  CODE QUALITY CHECKS');
    const packageJson = require('../package.json');
    if (packageJson.scripts && packageJson.scripts.lint) {
        results.lint = runCommand('npm run lint', 'Running linter');
    } else {
        log('⚠ No lint script found - skipping', 'yellow');
        results.lint = { success: true, skipped: true };
    }

    // Generate summary
    header('📊 TEST SUMMARY');

    const summary = {
        'Unit Tests': results.unit.success ? '✅ PASSED' : '❌ FAILED',
        'E2E Tests': results.e2e.skipped ? '⏭️  SKIPPED' : (results.e2e.success ? '✅ PASSED' : '❌ FAILED'),
        'Linting': results.lint.skipped ? '⏭️  SKIPPED' : (results.lint.success ? '✅ PASSED' : '❌ FAILED')
    };

    Object.entries(summary).forEach(([test, status]) => {
        const color = status.includes('✅') ? 'green' : status.includes('❌') ? 'red' : 'yellow';
        log(`  ${test.padEnd(20)} ${status}`, color);
    });

    // Overall result
    const allPassed = results.unit.success &&
        (results.e2e.success || results.e2e.skipped) &&
        (results.lint.success || results.lint.skipped);

    console.log('\n' + '='.repeat(60));
    if (allPassed) {
        log('  ✅ ALL TESTS PASSED', 'green');
    } else {
        log('  ❌ SOME TESTS FAILED', 'red');
    }
    console.log('='.repeat(60) + '\n');

    // Save results to JSON
    const reportPath = path.join(__dirname, 'last_test_results.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        results: summary,
        allPassed
    }, null, 2));

    log(`📝 Test report saved to: ${reportPath}`, 'cyan');

    process.exit(allPassed ? 0 : 1);
}

main().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
});
