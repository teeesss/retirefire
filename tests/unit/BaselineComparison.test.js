import { describe, it, expect, beforeEach } from 'vitest';
import { SimulationEngine } from '../../src/engine/SimulationEngine.js';
import { config } from '../../src/data/Config.js';

describe('SimulationEngine Baseline Comparison', () => {
    beforeEach(() => {
        // Reset config to defaults
        config.currentScenario = 'average';
        config.settings.taxes.rothConversionEnabled = false;
        config.settings.taxes.rothConversion = 0;
    });

    it('should return a valid baseline (same as average) when Roth is disabled', () => {
        const results = SimulationEngine.run();
        expect(results.baseline).not.toBeNull();
        // When Roth is disabled and scenario is 'average', baseline and average scenario should be mathematically identical
        expect(results.baseline.netWorth).toEqual(results.average.netWorth);
    });

    it('should return a valid baseline projection when Roth is enabled', () => {
        config.settings.taxes.rothConversionEnabled = true;
        config.settings.taxes.rothConversion = 50000;
        config.settings.taxes.rothConvStart = 2025;
        config.settings.taxes.rothConvEnd = 2030;

        const results = SimulationEngine.run();
        expect(results.baseline).not.toBeNull();
        expect(results.baseline.years).toEqual(results.average.years);

        // Baseline should have different tax values if Roth is working
        // (This is a coarse check, but verifies the logic branched)
        expect(results.baseline.expenses.Taxes).not.toEqual(results.average.expenses.Taxes);
    });

    it('should ensure baseline ignores Roth settings even if enabled in main config', () => {
        config.settings.taxes.rothConversionEnabled = true;
        config.settings.taxes.rothConversion = 100000;

        const results = SimulationEngine.run();

        // The baseline should NOT have used the 100k conversion
        // We can check if any Roth accounts in baseline increased beyond growth
        // but easier to just check that it's different from the average which DOES have it.
        expect(results.baseline.accounts.RothIRA[5]).not.toEqual(results.average.accounts.RothIRA[5]);
    });
});
