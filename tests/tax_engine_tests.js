#!/usr/bin/env node
/**
 * Tax Engine and Simulation Accuracy Tests
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ANSI colors
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

class TaxEngineTestRunner {
    constructor() {
        this.results = { passed: 0, failed: 0 };
        this.errors = [];
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

    extractJS() {
        const htmlPath = path.resolve(__dirname, '..', 'index.html');
        const content = fs.readFileSync(htmlPath, 'utf8');
        // Find the large inline script block (the one containing "config" or "TaxCalculator")
        const scriptPattern = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
        let match;
        let longestJS = "";
        while ((match = scriptPattern.exec(content)) !== null) {
            const js = match[1];
            if (js.length > longestJS.length) {
                longestJS = js;
            }
        }

        if (!longestJS) throw new Error('No inline script content found');
        console.log("Longest JS Snippet (first 100):", longestJS.substring(0, 100));
        console.log("Longest JS Snippet (last 100):", longestJS.substring(longestJS.length - 100));
        return longestJS;
    }

    setupContext(jsContent) {
        const context = {
            console: {
                log: () => { }, // Quiet down simulation logs
                error: console.error,
                warn: () => { }
            },
            Math: Math,
            JSON: JSON,
            parseFloat: parseFloat,
            parseInt: parseInt,
            Number: Number,
            Array: Array,
            Object: Object,
            setTimeout: () => { },
            setInterval: () => { }
        };
        vm.createContext(context);

        // We need to mock some things because index.html might have browser-specific stuff
        vm.runInContext("window = { addEventListener: () => {} }; document = { getElementById: () => ({ value: '', textContent: '', getContext: () => ({}), addEventListener: () => {} }), addEventListener: () => {} };", context);
        vm.runInContext("Chart = class { constructor() {} static register() {} };", context);

        // Run the extracted JS
        try {
            vm.runInContext(jsContent, context);
        } catch (e) {
            console.log("VM Error: " + e.message);
        }

        return context;
    }

    runAll() {
        this.log('\n═══════════════════════════════════════════════════════', 'cyan');
        this.log('  🏛️ TAX ENGINE & SIMULATION TESTS', 'cyan');
        this.log('═══════════════════════════════════════════════════════\n', 'cyan');

        try {
            const jsContent = this.extractJS();
            const context = this.setupContext(jsContent);

            this.testTaxCalculator(context);
            this.testSimulationEngine(context);

            this.printSummary();
        } catch (e) {
            this.log(`\n❌ Fatal Error: ${e.message}`, 'red');
            console.error(e);
        }

        return this.results.failed === 0 ? 0 : 1;
    }

    testTaxCalculator(context) {
        this.log('🧮 TAX CALCULATOR VALIDATION', 'blue');
        this.log('─────────────────────────────────────', 'blue');

        const TaxCalculator = context.TaxCalculator;
        if (!TaxCalculator) {
            this.fail('TaxCalculator defined', 'Not found in context');
            return;
        }
        this.pass('TaxCalculator exists');

        // Test single filing status 2024 brackets (standard deduction ~14,600)
        // 10% up to $11,600
        // Total tax for $20,000 taxable income (after deduction)
        // 11,600 * 0.10 = 1,160
        // (20,000 - 11,600) * 0.12 = 8,400 * 0.12 = 1,008
        // Total = 2,168
        const taxVal = TaxCalculator.calculateFederalSocialSecurity(20000 + 14600, 'single');
        if (Math.abs(taxVal - 2168) < 10) {
            this.pass('Federal tax calculation (single) matches 2024 brackets');
        } else {
            this.fail('Federal tax calculation (single)', `Expected ~2168, got ${taxVal}`);
        }

        // Test combined tax with spouse
        const combinedTax = TaxCalculator.calculateCombined(100000, 50000, 'married');
        if (combinedTax > 0) {
            this.pass('Combined tax calculation (married) returns non-zero value');
        } else {
            this.fail('Combined tax calculation (married)', 'Returned 0');
        }
    }

    testSimulationEngine(context) {
        this.log('\n🚀 SIMULATION ENGINE VALIDATION', 'blue');
        this.log('─────────────────────────────────────', 'blue');

        const SimulationEngine = context.SimulationEngine;
        const config = context.config;

        if (!SimulationEngine || !config) {
            this.fail('SimulationEngine and config exist', 'Missing');
            return;
        }
        this.pass('SimulationEngine exists');

        const results = SimulationEngine.project(config, 'average');

        if (results && results.years && results.years.length === 46) {
            this.pass('Simulation projects 46 years correctly');
        } else {
            this.fail('Simulation length', `Expected 46, got ${results?.years?.length}`);
        }

        if (results.accounts && results.accounts.RetirementSavings) {
            this.pass('Accounts projection exists');
            const initial = results.accounts.RetirementSavings[0];
            const final = results.accounts.RetirementSavings[results.accounts.RetirementSavings.length - 1];
            this.log(`  Initial Retirement: ${initial}, Final: ${final}`);
        }

        // Check if taxes are non-zero
        const totalTax = results.expenses.Taxes.reduce((a, b) => a + b, 0);
        if (totalTax > 0) {
            this.pass('Projected lifetime taxes are non-zero');
        } else {
            this.fail('Projected lifetime taxes', 'Returned 0 - tax engine might not be integrated');
        }
    }

    printSummary() {
        this.log('\n═══════════════════════════════════════════════════════', 'cyan');
        this.log('  📋 TEST SUMMARY', 'cyan');
        this.log('═══════════════════════════════════════════════════════', 'cyan');

        console.log(`\n  ${colors.green}✓ Passed:${colors.reset}  ${this.results.passed}`);
        console.log(`  ${colors.red}✗ Failed:${colors.reset}  ${this.results.failed}\n`);

        if (this.results.failed > 0) {
            this.log('  ❌ TESTS FAILED\n', 'red');
        } else {
            this.log('  ✅ ALL TESTS PASSED\n', 'green');
        }
    }
}

const runner = new TaxEngineTestRunner();
process.exit(runner.runAll());
