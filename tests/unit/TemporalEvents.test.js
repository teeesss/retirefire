import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../../src/engine/SimulationEngine.js';

describe('SimulationEngine Temporal Events', () => {
    const baseConfig = {
        startYear: 2026,
        endYear: 2050,
        startAge: 60,
        settings: {
            personal: { age: 60, retireAge: 65, lifeExpectancy: 85 },
            income: { work: 100000, growth: 0 },
            expenses: { annualSpending: 50000, inflation: 0 },
            rates: { investmentReturn: 5, inflation: 0 },
            housing: { homeValue: 0, mortgage: 0 },
            taxes: { filingStatus: 'single', state: 'none' },
            assets: {
                retirement: 500000,
                roth: 0,
                hsa: 0,
                investments: 500000,
                cash: 50000,
                otherAssets: 0,
                debt: 0
            }
        },
        events: []
    };

    it('should process a one-time expense event', () => {
        const config = JSON.parse(JSON.stringify(baseConfig));
        const currentYear = config.startYear;
        // Event in year 1 offset (age 61)
        config.events = [{
            type: 'expense',
            name: 'Big Trip',
            amount: 100000,
            year: currentYear + 1
        }];

        const results = SimulationEngine.project(config, 'average');

        // Run baseline for comparison
        const baselineConfig = JSON.parse(JSON.stringify(baseConfig));
        const baselineResults = SimulationEngine.project(baselineConfig, 'average');

        // Index 1 corresponds to year + 1
        const baselineNW = baselineResults.netWorth[1];
        const eventNW = results.netWorth[1];

        // NW shoud be lower by approx 100k (plus lost growth/taxes)
        expect(eventNW).toBeLessThan(baselineNW);
        expect(baselineNW - eventNW).toBeGreaterThan(90000); // Allowing for tax diffs
    });

    it('should process a one-time income event', () => {
        const config = JSON.parse(JSON.stringify(baseConfig));
        const currentYear = config.startYear;
        // Event in year 2 offset
        config.events = [{
            type: 'income',
            name: 'Inheritance',
            amount: 200000,
            year: currentYear + 2
        }];

        const results = SimulationEngine.project(config, 'average');
        const baselineResults = SimulationEngine.project(baseConfig, 'average');

        const eventNW = results.netWorth[2];
        const baselineNW = baselineResults.netWorth[2];

        // NW should be higher by approx 200k
        expect(eventNW).toBeGreaterThan(baselineNW);
        expect(eventNW - baselineNW).toBeGreaterThan(190000);
    });

    it('should handle multiple events in same year', () => {
        const config = JSON.parse(JSON.stringify(baseConfig));
        const currentYear = config.startYear;
        config.events = [
            { type: 'expense', amount: 50000, year: currentYear + 5 },
            { type: 'expense', amount: 50000, year: currentYear + 5 }
        ];

        const results = SimulationEngine.project(config, 'average');
        const baselineResults = SimulationEngine.project(baseConfig, 'average');

        const diff = baselineResults.netWorth[5] - results.netWorth[5];
        expect(diff).toBeGreaterThan(90000); // ~100k
    });
});
