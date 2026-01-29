import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../../src/engine/SimulationEngine.js';

describe('Housing Downsize Logic', () => {
    it('should calculate correct net flow during downsizing (Story B)', () => {
        const config = {
            startYear: 2026,
            startAge: 60,
            endYear: 2035,
            settings: {
                personal: { age: 60, retireAge: 65, longevity: 95 },
                assets: { investments: 100000, cash: 0, retirement: 0, roth: 0, hsa: 0, otherAssets: 0, debt: 0 },
                income: { work: 0, growth: 0, contribution401k: 0, employerMatch: 0, rothContrib: 0, hsaContrib: 0 },
                socialSecurity: { claimAge: 67, ss62: 0, ss67: 0, ss70: 0, cola: 0 },
                expenses: { annualSpending: 0, general: 0, travel: 0, utilities: 0, misc: 0 },
                rates: { average: 0, bonds: 0, cash: 0, optimistic: 0, pessimistic: 0 },
                healthcare: { preMedicare: 0, medicare: 0, outOfPocket: 0, inflation: 0, ltcAge: 100, ltcCost: 0, ltcInflation: 0 },
                taxSettings: { state: 'FL', filingStatus: 'single', fedBracket: 22 },
                taxes: { withdrawalStrategy: 'grow_tax_deferred' },
                housing: {
                    homeValue: 1000000,
                    mortgageBalance: 200000,
                    appreciation: 0,
                    propertyTax: 0,
                    maintenance: 0,
                    insurance: 0,
                    sellHome: 'yes',
                    sellYear: 2030,
                    saleCosts: 6, // 6%
                    buyNewHome: 'yes',
                    buyYear: 2030,
                    newHomeValue: 400000,
                    newMortgageAmount: 0 // Cash purchase
                }
            }
        };

        const results = SimulationEngine.project(config, 'average');
        const inv2029 = results.accounts.Investments[3]; // 2029
        const inv2030 = results.accounts.Investments[4]; // 2030 (Sale year)

        // Expected Net Flow:
        // Sale: 1,000,000 * 0.94 = 940,000
        // Mortgage payoff: 940,000 - 200,000 = 740,000
        // Buy: 740,000 - 400,000 = 340,000
        // Total Investment Jump: +340,000

        expect(inv2030 - inv2029).toBeGreaterThan(330000); // Allow for small rounding/tax if any
        expect(results.accounts.Housing[4]).toBe(400000); // New home value
    });

    it('should handle downsizing with partial new mortgage', () => {
        const config = {
            startYear: 2026,
            startAge: 60,
            endYear: 2035,
            settings: {
                personal: { age: 60, retireAge: 65, longevity: 95 },
                assets: { investments: 0, cash: 0, retirement: 0, roth: 0, hsa: 0, otherAssets: 0, debt: 0 },
                income: { work: 0, growth: 0, contribution401k: 0, employerMatch: 0, rothContrib: 0, hsaContrib: 0 },
                socialSecurity: { claimAge: 67, ss62: 0, ss67: 0, ss70: 0, cola: 0 },
                expenses: { annualSpending: 0, general: 0, travel: 0, utilities: 0, misc: 0 },
                rates: { average: 0, bonds: 0, cash: 0, optimistic: 0, pessimistic: 0 },
                healthcare: { preMedicare: 0, medicare: 0, outOfPocket: 0, inflation: 0, ltcAge: 100, ltcCost: 0, ltcInflation: 0 },
                taxSettings: { state: 'FL', filingStatus: 'single', fedBracket: 22 },
                taxes: { withdrawalStrategy: 'grow_tax_deferred' },
                housing: {
                    homeValue: 1000000,
                    mortgageBalance: 0,
                    appreciation: 0,
                    propertyTax: 0,
                    maintenance: 0,
                    insurance: 0,
                    sellHome: 'yes',
                    sellYear: 2030,
                    saleCosts: 6,
                    buyNewHome: 'yes',
                    buyYear: 2030,
                    newHomeValue: 500000,
                    newMortgageAmount: 200000 // Buy with 200k mortgage
                }
            }
        };

        const results = SimulationEngine.project(config, 'average');
        const inv2030 = results.accounts.Investments[4];

        // Expected Net Flow:
        // Sale: 940,000
        // Cash used for buy: 500,000 - 200,000 = 300,000
        // Remaining: 940,000 - 300,000 = 640,000

        expect(inv2030).toBeGreaterThan(630000);
        expect(results.accounts.Housing[4]).toBe(300000); // 500k value - 200k mortgage
    });
});
