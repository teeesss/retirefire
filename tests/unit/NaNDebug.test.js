import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../../src/engine/SimulationEngine.js';
import { config } from '../../src/data/Config.js';

describe('NaN Regression Debug', () => {
    it('should identify where NaN is introduced in project()', () => {
        // Minimal config
        config.startYear = 2024;
        config.endYear = 2025; // Just 2 years
        config.startAge = 60;

        config.settings = {
            personal: { retireAge: 65 },
            assets: {
                retirement: 100000,
                investments: 0,
                roth: 0,
                cash: 0,
                hsa: 0,
                otherAssets: 0,
                debt: 0
            },
            housing: {
                homeValue: 0,
                mortgageBalance: 0,
                sellHome: 'no',
                buyNewHome: 'no',
                appreciation: 0
            },
            socialSecurity: {
                claimAge: 70,
                ss62: 0,
                ss67: 0,
                ss70: 0,
                cola: 0
            },
            income: {
                work: 0,
                growth: 0,
                contribution401k: 0,
                employerMatch: 0,
                rothContrib: 0,
                hsaContrib: 0
            },
            expenses: {
                annualSpending: 10000,
                phases: []
            },
            healthcare: {
                preMedicare: 0,
                medicare: 0,
                outOfPocket: 0,
                inflation: 0,
                ltcAge: 999,
                ltcCost: 0,
                ltcInflation: 0
            },
            taxes: {
                rothConversionEnabled: false,
                withdrawalStrategy: 'grow_tax_deferred'
            },
            taxSettings: {
                filingStatus: 'joint',
                state: 'none'
            },
            inflation: { average: 0, optimistic: 0, pessimistic: 0 },
            rates: { average: 0, optimistic: 0, pessimistic: 0 }
        };

        const result = SimulationEngine.run();

        if (!result.average) {
            console.error('ERROR: result.average is missing in NaNDebug.test.js!');
            console.log('Result keys:', Object.keys(result));
        } else {
            console.log('Average Net Worth:', result.average.netWorth);
            result.average.netWorth.forEach((nw, i) => {
                if (isNaN(nw)) {
                    console.error(`NaN found at index ${i} in NaNDebug.test.js`);
                }
            });
        }

        expect(result.average).toBeDefined();

        expect(result.average.netWorth[0]).not.toBeNaN();
        expect(result.average.netWorth[1]).not.toBeNaN();
    });
});
