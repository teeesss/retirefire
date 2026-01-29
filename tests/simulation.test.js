import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../src/engine/SimulationEngine.js';
import { TaxCalculator } from '../src/engine/TaxCalculator.js';
import { config } from '../src/data/Config.js';

describe('TaxCalculator', () => {
    it('should calculate federal taxes for a single person', () => {
        // Standard deduction for 2024 is ~14,600
        // $20k taxable income should result in ~$2,168 tax
        const taxVal = TaxCalculator.calculateFederalSocialSecurity(20000 + 14600, 'single');
        expect(taxVal).toBeGreaterThan(0);
        expect(taxVal).toBeCloseTo(2168, -1); // Tolerate slight bracket differences
    });

    it('should calculate combined tax for married filing jointly', () => {
        const combinedTax = TaxCalculator.calculateCombined(100000, 50000, 'married');
        expect(combinedTax).toBeGreaterThan(0);
    });
});

describe('SimulationEngine', () => {
    it('should run a projection for 46 years by default', () => {
        const results = SimulationEngine.project(config, 'average');
        expect(results.years.length).toBe(46);
        expect(results.accounts.RetirementSavings.length).toBe(46);
    });

    it('should result in non-NaN net worth projections', () => {
        const results = SimulationEngine.project(config, 'average');
        results.years.forEach((year, i) => {
            let total = 0;
            for (const key in results.accounts) {
                total += results.accounts[key][i];
            }
            expect(total).not.toBeNaN();
        });
    });

    it('should show impact of spending on net worth', () => {
        const lowSpendingConfig = JSON.parse(JSON.stringify(config));
        lowSpendingConfig.settings.expenses.annualSpending = 50000;

        const highSpendingConfig = JSON.parse(JSON.stringify(config));
        highSpendingConfig.settings.expenses.annualSpending = 200000;

        const lowRes = SimulationEngine.project(lowSpendingConfig, 'average');
        const highRes = SimulationEngine.project(highSpendingConfig, 'average');

        const lowFinalNW = Object.values(lowRes.accounts).reduce((sum, arr) => sum + arr[45], 0);
        const highFinalNW = Object.values(highRes.accounts).reduce((sum, arr) => sum + arr[45], 0);

        expect(lowFinalNW).toBeGreaterThan(highFinalNW);
    });

    it('should model downsizing (Equity Swap) correctly (Story B)', () => {
        const downsizeConfig = JSON.parse(JSON.stringify(config));
        downsizeConfig.settings.housing = {
            homeValue: 1000000,
            mortgageBalance: 0,
            appreciation: 0,
            sellHome: 'yes',
            sellYear: 2030,
            saleCosts: 0,
            buyNewHome: 'yes',
            buyYear: 2030,
            newHomeValue: 400000,
            newMortgageAmount: 0
        };
        // Initial investments = 67000. 
        // In 2030 (year 4), sell for 1M, buy for 400k. Net gain 600k.
        // Expect investments to jump by ~600k.

        const results = SimulationEngine.project(downsizeConfig, 'average');
        const inv2029 = results.accounts.Investments[3]; // Year 2029
        const inv2030 = results.accounts.Investments[4]; // Year 2030

        console.log('Downsize Debug:', { inv2029, inv2030, diff: inv2030 - inv2029 });
        expect(inv2030 - inv2029).toBeGreaterThan(400000);
        expect(results.accounts.Housing[4]).toBe(400000); // New home value
    });

    it('should calculate detailed tax breakdowns (Story A)', () => {
        const results = SimulationEngine.project(config, 'average');

        // Check first year taxes
        expect(results.taxes.Federal[0]).toBeGreaterThan(0);
        expect(results.taxes.FICA[0]).toBeGreaterThan(0);
        expect(results.taxes.State[0]).toBeGreaterThanOrEqual(0);
        expect(results.taxes.CapGains[0]).toBeDefined();

        // Check if sum of buckets equals expenses.Taxes
        const sumBuckets = results.taxes.Federal[0] + results.taxes.FICA[0] + results.taxes.CapGains[0] + results.taxes.State[0];
        expect(results.expenses.Taxes[0]).toBe(sumBuckets);
    });
});
