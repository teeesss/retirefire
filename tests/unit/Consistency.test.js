import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../../src/engine/SimulationEngine.js';
import { config } from '../../src/data/Config.js';

describe('Simulation Engine Consistency', () => {
    it('should produce identical results when volatility is 0 and inflation is matched', () => {
        const testConfig = JSON.parse(JSON.stringify(config));
        // Use average rates for both
        const marketReturn = testConfig.settings.rates.average;
        const inflationRate = testConfig.settings.inflation.average;

        const standardResult = SimulationEngine.project(testConfig, 'average');

        // projectPath returns just netWorth array
        const mcNetWorth = SimulationEngine.projectPath(testConfig, 0, 1.0, 'monte-carlo');

        expect(mcNetWorth.length).toBe(standardResult.netWorth.length);

        // Compare net worth arrays (allow small float differences)
        for (let i = 0; i < standardResult.netWorth.length; i++) {
            expect(mcNetWorth[i]).toBeCloseTo(standardResult.netWorth[i], -1); // Close to nearest 10
        }
    });

    it('should match baseline when Roth conversions disabled', () => {
        const testConfig = JSON.parse(JSON.stringify(config));
        testConfig.settings.taxes.rothConversionEnabled = false;

        const result = SimulationEngine.project(testConfig, 'average');

        // Should have no Roth conversions
        expect(result.rothConversions.amounts.every(a => a === 0)).toBe(true);
        expect(result.rothConversions.taxPaid.every(a => a === 0)).toBe(true);
    });
});
