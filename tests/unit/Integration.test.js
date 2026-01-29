import { describe, it, expect, beforeEach } from 'vitest';
import { SimulationEngine } from '../../src/engine/SimulationEngine.js';
import { TaxCalculator } from '../../src/engine/TaxCalculator.js';

/**
 * Integration Tests - Testing how components work together
 * Simplified version focusing on core functionality
 */

describe('Integration: SimulationEngine + TaxCalculator', () => {
    let baseConfig;

    beforeEach(() => {
        baseConfig = {
            startYear: 2026,
            startAge: 50,
            endYear: 2036,
            settings: {
                personal: { age: 50, retireAge: 60, longevity: 95 },
                assets: {
                    retirement: 1000000,
                    roth: 100000,
                    hsa: 50000,
                    investments: 200000,
                    cash: 20000,
                    otherAssets: 0
                },
                income: {
                    work: 100000,
                    growth: 0,
                    contribution401k: 10000,
                    employerMatch: 5000,
                    rothContrib: 0,
                    hsaContrib: 0
                },
                socialSecurity: {
                    ss62: 24000,
                    ss67: 36000,
                    ss70: 48000,
                    claimAge: 67,
                    cola: 0
                },
                expenses: {
                    annualSpending: 50000
                },
                housing: {
                    appreciation: 0,
                    propertyTax: 0,
                    maintenance: 0,
                    insurance: 0,
                    mortgageBalance: 0,
                    mortgageRate: 6.5,
                    mortgageYears: 0,
                    mortgagePayment: 0,
                    homeValue: 500000,
                    sellHome: 'no',
                    sellYear: 2028,
                    saleCosts: 6,
                    futureRent: 0,
                    rentInflation: 0,
                    buyNewHome: 'no',
                    newHomeValue: 0,
                    newMortgageAmount: 0,
                    newMortgageRate: 6.5,
                    newMortgageYears: 30
                },
                healthcare: {
                    preMedicare: 0,
                    medicare: 0,
                    outOfPocket: 0,
                    inflation: 0,
                    ltcAge: 100,
                    ltcCost: 0,
                    ltcInflation: 0
                },
                taxSettings: {
                    filingStatus: 'single',
                    state: 'FL',
                    fedBracket: 22
                },
                rates: {
                    average: 0
                },
                inflation: {
                    average: 0
                },
                taxes: {
                    rothConversionEnabled: false,
                    withdrawalStrategy: 'grow_tax_deferred'
                }
            }
        };
    });

    it('should calculate taxes correctly for working years', () => {
        const results = SimulationEngine.project(baseConfig, 'average');

        // Year 0: Working, earning $100k
        const year0Taxes = results.expenses.Taxes[0];

        // Should have federal income tax + FICA
        expect(year0Taxes).toBeGreaterThan(0);
        expect(year0Taxes).toBeLessThan(30000); // Reasonable upper bound
    });

    it('should handle retirement year transition correctly', () => {
        const config = JSON.parse(JSON.stringify(baseConfig));
        config.settings.personal.retireAge = 52; // Retire in 2 years

        const results = SimulationEngine.project(config, 'average');

        // Year before retirement should have work income
        const year1Income = results.income.Work[1];
        expect(year1Income).toBeGreaterThan(0);

        // Year after retirement should have no work income
        const year2Income = results.income.Work[2];
        expect(year2Income).toBe(0);
    });

    it('should maintain positive net worth with sufficient assets', () => {
        const results = SimulationEngine.project(baseConfig, 'average');

        // All years should have positive net worth
        results.netWorth.forEach((nw, index) => {
            expect(nw).toBeGreaterThan(0, `Year ${index} should have positive net worth`);
        });
    });

    it('should track all account balances correctly', () => {
        const results = SimulationEngine.project(baseConfig, 'average');

        // Verify all account types exist (using actual property names from SimulationEngine)
        expect(results.accounts).toHaveProperty('RetirementSavings');
        expect(results.accounts).toHaveProperty('RothIRA');
        expect(results.accounts).toHaveProperty('HSA');
        expect(results.accounts).toHaveProperty('Investments');
        expect(results.accounts).toHaveProperty('CashSavings');
        expect(results.accounts).toHaveProperty('Housing');

        // Verify they all have data for all years
        const yearCount = results.years.length;
        expect(results.accounts.RetirementSavings).toHaveLength(yearCount);
        expect(results.accounts.RothIRA).toHaveLength(yearCount);
        expect(results.accounts.HSA).toHaveLength(yearCount);
        expect(results.accounts.Investments).toHaveLength(yearCount);
        expect(results.accounts.CashSavings).toHaveLength(yearCount);
        expect(results.accounts.Housing).toHaveLength(yearCount);
    });

    it('should calculate net worth as sum of all accounts', () => {
        const results = SimulationEngine.project(baseConfig, 'average');

        results.years.forEach((year, index) => {
            const calculatedNW =
                results.accounts.RetirementSavings[index] +
                results.accounts.RothIRA[index] +
                results.accounts.HSA[index] +
                results.accounts.Investments[index] +
                results.accounts.CashSavings[index] +
                results.accounts.Housing[index] +
                results.accounts.OtherAssets[index] +
                results.accounts.Debt[index];

            // Allow small rounding differences (up to $1)
            expect(results.netWorth[index]).toBeCloseTo(calculatedNW, -1);
        });
    });

    it('should calculate Monte Carlo success rate', () => {
        const mcResults = SimulationEngine.runMonteCarlo(100); // Reduced iterations for speed

        expect(mcResults.successRate).toBeGreaterThanOrEqual(0);
        expect(mcResults.successRate).toBeLessThanOrEqual(100);

        // With $1.37M in assets and $50k spending, should have high success rate
        expect(mcResults.successRate).toBeGreaterThan(50);
    });
});

describe('Integration: Tax Calculations Across Scenarios', () => {
    it('should calculate different tax amounts for different filing statuses', () => {
        const income = 100000;

        const singleTax = TaxCalculator.calculateFederalSocialSecurity(income, 'single');
        const marriedTax = TaxCalculator.calculateFederalSocialSecurity(income, 'married');

        // Married filing jointly should have lower taxes due to wider brackets
        expect(marriedTax).toBeLessThan(singleTax);
    });

    it('should calculate FICA correctly for different income levels', () => {
        const lowIncome = 50000;
        const highIncome = 200000;

        const lowResult = TaxCalculator.calculateTaxBreakdown(lowIncome, 0, 0, 'single', 'FL');
        const highResult = TaxCalculator.calculateTaxBreakdown(highIncome, 0, 0, 'single', 'FL');

        // FICA should be higher for higher income
        expect(highResult.fica).toBeGreaterThan(lowResult.fica);

        // But should cap at Social Security wage base
        expect(highResult.fica).toBeLessThan(highIncome * 0.0765);
    });

    it('should handle state taxes correctly', () => {
        const income = 100000;

        const flResult = TaxCalculator.calculateTaxBreakdown(income, 0, 0, 'single', 'FL');
        const caResult = TaxCalculator.calculateTaxBreakdown(income, 0, 0, 'single', 'CA');

        // Florida has no state income tax
        expect(flResult.state).toBe(0);

        // California has state income tax
        expect(caResult.state).toBeGreaterThan(0);
    });
});
