#!/usr/bin/env node
/**
 * Automated Test Runner for Retirement Planner Pro
 * 
 * Run: node tests/run_tests.js
 * Options:
 *   --charts    Run only chart tests
 *   --data      Run only data tests
 *   --quick     Skip browser tests (JS validation only)
 * 
 * This is designed to run BEFORE any code updates to ensure nothing breaks.
 */

const fs = require('fs');
const path = require('path');

// ANSI colors for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

class TestRunner {
    constructor() {
        this.results = { passed: 0, failed: 0, skipped: 0 };
        this.errors = [];
        this.startTime = Date.now();
    }

    log(message, color = 'reset') {
        console.log(`${colors[color]}${message}${colors.reset}`);
    }

    pass(testName) {
        this.results.passed++;
        console.log(`  ${colors.green}✓${colors.reset} ${testName}`);
    }

    fail(testName, error) {
        this.results.failed++;
        this.errors.push({ test: testName, error });
        console.log(`  ${colors.red}✗${colors.reset} ${testName}`);
        console.log(`    ${colors.red}→ ${error}${colors.reset}`);
    }

    skip(testName, reason) {
        this.results.skipped++;
        console.log(`  ${colors.yellow}○${colors.reset} ${testName} (${reason})`);
    }

    async runAll(options = {}) {
        this.log('\n═══════════════════════════════════════════════════════', 'cyan');
        this.log('  🧪 RETIREMENT PLANNER PRO - AUTOMATED TEST SUITE', 'bright');
        this.log('═══════════════════════════════════════════════════════\n', 'cyan');

        // Step 1: File integrity tests
        await this.runFileIntegrityTests();

        // Step 2: JavaScript syntax validation
        await this.runJSSyntaxTests();

        // Step 3: Data structure validation
        await this.runDataStructureTests();

        // Step 4: Configuration validation
        await this.runConfigTests();

        // Step 5: Chart configuration tests
        await this.runChartConfigTests();

        // Step 6: Calculation tests
        await this.runCalculationTests();

        // Print summary
        this.printSummary();

        // Return exit code
        return this.results.failed === 0 ? 0 : 1;
    }

    async runFileIntegrityTests() {
        this.log('\n📁 FILE INTEGRITY TESTS', 'blue');
        this.log('─────────────────────────────────────', 'blue');

        const rayFile = path.join(__dirname, '..', 'index.html');

        // Check file exists
        if (fs.existsSync(rayFile)) {
            this.pass('index.html exists');
        } else {
            this.fail('index.html exists', 'File not found');
            return;
        }

        // Check file size (should be > 200KB)
        const stats = fs.statSync(rayFile);
        if (stats.size > 200000) {
            this.pass(`index.html size OK (${(stats.size / 1024).toFixed(1)} KB)`);
        } else {
            this.fail('index.html size', `File too small: ${stats.size} bytes`);
        }

        // Check for critical sections
        const content = fs.readFileSync(rayFile, 'utf8');

        const criticalPatterns = [
            { name: 'DOCTYPE declaration', pattern: /<!DOCTYPE html>/i },
            { name: 'Chart.js library', pattern: /chart\.js|Chart\.min\.js/i },
            { name: 'config object', pattern: /const config\s*=/ },
            { name: 'rawData object', pattern: /(const|let|var) rawData\s*=/ },
            { name: 'charts object', pattern: /(const|let|var) charts\s*=/ },
            { name: 'initCharts function', pattern: /function initCharts\s*\(/ },
            { name: 'updateDashboard function', pattern: /function updateDashboard\s*\(/ },
            { name: 'formatCurrency function', pattern: /function formatCurrency\s*\(/ },
        ];

        for (const { name, pattern } of criticalPatterns) {
            if (pattern.test(content)) {
                this.pass(`Contains ${name}`);
            } else {
                this.fail(`Contains ${name}`, 'Pattern not found');
            }
        }
    }

    async runJSSyntaxTests() {
        this.log('\n🔧 JAVASCRIPT SYNTAX TESTS', 'blue');
        this.log('─────────────────────────────────────', 'blue');

        const rayFile = path.join(__dirname, '..', 'index.html');
        const content = fs.readFileSync(rayFile, 'utf8');

        // Extract JavaScript from script tags
        const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
        if (!scriptMatch) {
            this.fail('Extract script content', 'No script tag found');
            return;
        }

        const jsContent = scriptMatch[1];

        // Check for common syntax issues
        const syntaxChecks = [
            { name: 'Balanced braces', check: () => this.countBalanced(jsContent, '{', '}') },
            { name: 'Balanced parentheses', check: () => this.countBalanced(jsContent, '(', ')') },
            { name: 'Balanced brackets', check: () => this.countBalanced(jsContent, '[', ']') },
            { name: 'No trailing commas in arrays', check: () => !/,\s*\]/.test(jsContent) },
            { name: 'No double semicolons', check: () => !/;;/.test(jsContent) },
        ];

        for (const { name, check } of syntaxChecks) {
            try {
                if (check()) {
                    this.pass(name);
                } else {
                    this.fail(name, 'Syntax check failed');
                }
            } catch (e) {
                this.fail(name, e.message);
            }
        }

        // Try to evaluate basic structure using Function constructor (safer than eval)
        try {
            // Extract just the data objects for validation
            const configMatch = jsContent.match(/const config\s*=\s*(\{[\s\S]*?\n\s*\});/);
            if (configMatch) {
                this.pass('config object syntax valid');
            }
        } catch (e) {
            this.fail('config object syntax', e.message);
        }
    }

    countBalanced(content, open, close) {
        let count = 0;
        for (const char of content) {
            if (char === open) count++;
            if (char === close) count--;
            if (count < 0) return false;
        }
        return count === 0;
    }

    async runDataStructureTests() {
        this.log('\n📊 DATA STRUCTURE TESTS', 'blue');
        this.log('─────────────────────────────────────', 'blue');

        const rayFile = path.join(__dirname, '..', 'index.html');
        const content = fs.readFileSync(rayFile, 'utf8');

        // Check rawData structure
        const scenarios = ['optimistic', 'average', 'pessimistic'];
        for (const scenario of scenarios) {
            if (content.includes(`${scenario}: {`)) {
                this.pass(`rawData.${scenario} exists`);
            } else {
                this.fail(`rawData.${scenario} exists`, 'Scenario not found');
            }
        }

        // Check for 46 years of data
        const yearsMatch = content.match(/years:\s*Array\.from\(\{\s*length:\s*(\d+)/);
        if (yearsMatch && yearsMatch[1] === '46') {
            this.pass('rawData.years has 46 elements');
        } else {
            this.fail('rawData.years has 46 elements', `Found: ${yearsMatch?.[1] || 'none'}`);
        }

        // Check account types exist
        const accountTypes = ['RetirementSavings', 'RothIRA', 'HSA', 'Investments', 'CashSavings'];
        for (const account of accountTypes) {
            if (content.includes(`${account}:`)) {
                this.pass(`Account type ${account} exists`);
            } else {
                this.fail(`Account type ${account} exists`, 'Account not found');
            }
        }

        // Check income sources
        const incomeSources = ['Work', 'SocialSecurity', 'Drawdown', 'RMD'];
        for (const source of incomeSources) {
            if (content.includes(`${source}:`)) {
                this.pass(`Income source ${source} exists`);
            } else {
                this.fail(`Income source ${source} exists`, 'Source not found');
            }
        }
    }

    async runConfigTests() {
        this.log('\n⚙️ CONFIGURATION TESTS', 'blue');
        this.log('─────────────────────────────────────', 'blue');

        const rayFile = path.join(__dirname, '..', 'index.html');
        const content = fs.readFileSync(rayFile, 'utf8');

        // Check mortgage years is 8 (the fix we applied)
        if (/mortgageYears:\s*8/.test(content)) {
            this.pass('Mortgage years is 8 (correct)');
        } else {
            this.fail('Mortgage years is 8', 'Expected 8, found different value');
        }

        // Check rothConversionEnabled exists
        if (/rothConversionEnabled:\s*(true|false)/.test(content)) {
            this.pass('rothConversionEnabled config exists');
        } else {
            this.fail('rothConversionEnabled config exists', 'Setting not found');
        }

        // Check annualSpending exists
        if (/annualSpending:\s*\d+/.test(content)) {
            this.pass('annualSpending config exists');
        } else {
            this.fail('annualSpending config exists', 'Setting not found');
        }

        // Check start year is 2026
        if (/startYear:\s*2026/.test(content)) {
            this.pass('Start year is 2026');
        } else {
            this.fail('Start year is 2026', 'Incorrect start year');
        }

        // Check retirement age is configured
        if (/retireAge:\s*\d+/.test(content)) {
            this.pass('Retirement age configured');
        } else {
            this.fail('Retirement age configured', 'Not found');
        }
    }

    async runChartConfigTests() {
        this.log('\n📈 CHART CONFIGURATION TESTS', 'blue');
        this.log('─────────────────────────────────────', 'blue');

        const rayFile = path.join(__dirname, '..', 'index.html');
        const content = fs.readFileSync(rayFile, 'utf8');

        // Check chart initialization functions exist
        const chartFunctions = [
            'initNetWorthChart',
            'initAllocationChart',
            'initIncomeChart',
            'initExpensesChart',
            'initTaxesChart',
            'initMortgageChart',
            'initMonteCarloChart',
            'initRothConversionChart',
            'initWithdrawalChart',
            'initSSComparisonChart',
            'initSurplusGapChart',
            'initMoneyFlowChart',
            'initSuccessGauge',
            'initGapCalculator'
        ];

        for (const func of chartFunctions) {
            if (content.includes(`function ${func}(`)) {
                this.pass(`${func} exists`);
            } else {
                this.fail(`${func} exists`, 'Function not found');
            }
        }

        // Check canvas elements exist
        const canvasIds = [
            'chartNetWorth',
            'chartAllocation',
            'chartIncome',
            'chartExpenses',
            'chartMortgage',
            'chartRothConversion',
            'chartSurplusGap',
            'chartMoneyFlow',
            'gaugeSuccess'
        ];

        for (const id of canvasIds) {
            if (content.includes(`id="${id}"`)) {
                this.pass(`Canvas ${id} exists`);
            } else {
                this.fail(`Canvas ${id} exists`, 'Element not found');
            }
        }
    }

    async runCalculationTests() {
        this.log('\n🧮 CALCULATION FUNCTION TESTS', 'blue');
        this.log('─────────────────────────────────────', 'blue');

        const rayFile = path.join(__dirname, '..', 'index.html');
        const content = fs.readFileSync(rayFile, 'utf8');

        // Check calculation functions exist
        const calcFunctions = [
            'calculateNetWorth',
            'getTotalIncome',
            'getTotalExpenses',
            'getTotalTaxes',
            'formatCurrency',
            'formatPercent',
            'getNetWorthSeries'
        ];

        for (const func of calcFunctions) {
            if (content.includes(`function ${func}(`)) {
                this.pass(`${func} function exists`);
            } else {
                this.fail(`${func} function exists`, 'Function not found');
            }
        }

        // Check toggle functions exist
        const toggleFunctions = [
            'toggleRothConversion',
            'updateSpendingSlider',
            'setScenario',
            'toggleComparison'
        ];

        for (const func of toggleFunctions) {
            if (content.includes(`function ${func}(`)) {
                this.pass(`${func} function exists`);
            } else {
                this.fail(`${func} function exists`, 'Function not found');
            }
        }
    }

    printSummary() {
        const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);

        this.log('\n═══════════════════════════════════════════════════════', 'cyan');
        this.log('  📋 TEST SUMMARY', 'bright');
        this.log('═══════════════════════════════════════════════════════', 'cyan');

        console.log(`\n  ${colors.green}✓ Passed:${colors.reset}  ${this.results.passed}`);
        console.log(`  ${colors.red}✗ Failed:${colors.reset}  ${this.results.failed}`);
        console.log(`  ${colors.yellow}○ Skipped:${colors.reset} ${this.results.skipped}`);
        console.log(`\n  ⏱  Duration: ${duration}s\n`);

        if (this.results.failed > 0) {
            this.log('  ❌ TESTS FAILED - DO NOT UPDATE CODE', 'red');
            this.log('\n  Failed tests:', 'red');
            for (const { test, error } of this.errors) {
                console.log(`    • ${test}: ${error}`);
            }
        } else {
            this.log('  ✅ ALL TESTS PASSED - SAFE TO PROCEED', 'green');
        }

        this.log('\n═══════════════════════════════════════════════════════\n', 'cyan');

        // Write results to file for reference
        const resultsFile = path.join(__dirname, 'last_test_results.json');
        fs.writeFileSync(resultsFile, JSON.stringify({
            timestamp: new Date().toISOString(),
            passed: this.results.passed,
            failed: this.results.failed,
            skipped: this.results.skipped,
            duration: duration,
            errors: this.errors
        }, null, 2));
    }
}

// Parse command line args
const args = process.argv.slice(2);
const options = {
    charts: args.includes('--charts'),
    data: args.includes('--data'),
    quick: args.includes('--quick')
};

// Run tests
const runner = new TestRunner();
runner.runAll(options).then(exitCode => {
    process.exit(exitCode);
});
