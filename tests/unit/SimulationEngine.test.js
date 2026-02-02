import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../../src/engine/SimulationEngine.js';

const mockConfig = {
    startYear: 2026,
    startAge: 50,
    endYear: 2036, // 10 years for testing
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
            mortgageYears: 0,
            mortgagePayment: 0,
            homeValue: 500000,
            sellHome: 'no',
            sellYear: 2028,
            saleCosts: 6,
            futureRent: 0,
            rentInflation: 0,
            buyNewHome: 'no'
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
            average: 0 // 0% growth for easy math verification
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

describe('SimulationEngine', () => {
    it('should project a basic net worth growth', () => {
        const results = SimulationEngine.project(mockConfig, 'average');

        // Year 0: 
        // Start: 1,000k + 100k + 50k + 200k + 20k + 500k = 1,870k
        // Income: 100k
        // Expenses: 50k
        // Contributions: 15k (10k+5k)
        // Tax: (100k - 14.6k deduction) = 85.4k taxable. 
        //      10% of 11.6k = 1160
        //      12% of (47.15k-11.6k) = 4266
        //      22% of (85.4k-47.15k) = 8415
        //      Total tax approx 13.8k
        // FICA: 100k * 0.0765 = 7.65k
        // Total Income: 100k - 50k (Exp) - 13.8k (Tax) - 7.65k (FICA) - 10k (Contrib) = 18.55k surplus
        // New Investments: 200k + 18.55k = 218.55k
        // New Retirement: 1,000k + 15k = 1,015k

        expect(results.years[0]).toBe(2026);
        expect(results.netWorth[0]).toBeGreaterThan(1870000);
    });

    it('should handle home sale proceeds', () => {
        const configWithSale = JSON.parse(JSON.stringify(mockConfig));
        configWithSale.settings.housing.sellHome = 'yes';
        configWithSale.settings.housing.sellYear = 2028;
        configWithSale.settings.housing.saleCosts = 0;
        configWithSale.settings.housing.homeValue = 500000;

        const results = SimulationEngine.project(configWithSale, 'average');

        // Year 2028 is index 2
        // Before sale, index 1 has some investment value. After sale, index 2 should jump by 500k.
        const invBefore = results.accounts.Investments[1];
        const invAfter = results.accounts.Investments[2];
        const homeAfter = results.accounts.Housing[2];

        expect(homeAfter).toBe(0);
        expect(invAfter - invBefore).toBeGreaterThan(500000); // 500k proceeds + normal surplus
    });

    it('should respect withdrawal strategies', () => {
        const configDeficit = JSON.parse(JSON.stringify(mockConfig));
        configDeficit.settings.personal.retireAge = 50; // Retire immediately
        configDeficit.settings.expenses.annualSpending = 200000; // Big spending to cause deficit
        configDeficit.settings.income.work = 0;

        // Strategy 1: grow_tax_deferred (Investments first)
        configDeficit.settings.taxes.withdrawalStrategy = 'grow_tax_deferred';
        const resultsA = SimulationEngine.project(configDeficit, 'average');

        // Strategy 2: minimize_rmds (Retirement first)
        configDeficit.settings.taxes.withdrawalStrategy = 'minimize_rmds';
        const resultsB = SimulationEngine.project(configDeficit, 'average');

        // In A, Investments should decrease faster than Retirement
        // In B, Retirement should decrease faster than Investments
        const invDropA = resultsA.accounts.Investments[0] - mockConfig.settings.assets.investments;
        const retDropA = resultsA.accounts.RetirementSavings[0] - mockConfig.settings.assets.retirement;

        const invDropB = resultsB.accounts.Investments[0] - mockConfig.settings.assets.investments;
        const retDropB = resultsB.accounts.RetirementSavings[0] - mockConfig.settings.assets.retirement;

        expect(Math.abs(invDropA)).toBeGreaterThan(Math.abs(retDropA));
        expect(Math.abs(retDropB)).toBeGreaterThan(Math.abs(invDropB));
    });

    it('should apply staged spending multipliers', () => {
        const configPhases = JSON.parse(JSON.stringify(mockConfig));
        configPhases.settings.expenses.annualSpending = 100000;
        configPhases.settings.expenses.phases = [
            { startAge: 51, endAge: 52, multiplier: 2.0, description: 'Double Spend Year' }
        ];

        const results = SimulationEngine.project(configPhases, 'average');

        // Year 0 (Age 50): Exp should be approx 100k
        // Year 1 (Age 51): Exp should be approx 200k (due to 2.0 multiplier)
        const expAge50 = results.expenses.General[0];
        const expAge51 = results.expenses.General[1];

        // Note: SimulationEngine project defines rates[average] = { return: 0.06, inflation: 0.03 }
        // Year 0: 100k * 1.0 * 1.03^0 = 100k
        // Year 1: 100k * 2.0 * 1.03^1 = 206k

        expect(expAge50).toBeCloseTo(100000, -2);
        // With inflation = 0 (per mockConfig), expectation should be 200,000
        // If the test intended to test 3% inflation, it should set it in the config or local setting
        // For now, we update the expectation to match the config provided (0% inflation)
        expect(expAge51).toBeCloseTo(200000, -2);
    });
    it('should track tax costs for drawdowns', () => {
        const configTax = JSON.parse(JSON.stringify(mockConfig));
        configTax.settings.personal.retireAge = 50;
        configTax.settings.expenses.annualSpending = 150000;
        configTax.settings.income.work = 0;
        configTax.settings.taxes.withdrawalStrategy = 'minimize_rmds'; // Retirement Savings (401k) first
        configTax.settings.taxSettings.filingStatus = 'single';
        configTax.settings.taxSettings.state = 'FL';

        const results = SimulationEngine.project(configTax, 'average');

        // Year 0 should have a deficit, covered by RetirementSavings
        // RetirementSavings withdrawals are ordinary income and should trigger tax
        expect(results.drawdown.RetirementSavings[0]).toBeGreaterThan(0);
        expect(results.drawdown.RetirementSavingsTax[0]).toBeGreaterThan(0);

        // Success check: Tax cost should be roughly 10-22% of the deduction
        const taxRate = results.drawdown.RetirementSavingsTax[0] / results.drawdown.RetirementSavings[0];
        expect(taxRate).toBeGreaterThan(0.05);
        expect(taxRate).toBeLessThan(0.38);
    });
});
