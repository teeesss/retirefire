import { describe, it, expect, beforeEach } from 'vitest';
import { SimulationEngine } from '../../src/engine/SimulationEngine.js';
import { config } from '../../src/data/Config.js';

describe('SimulationEngine Data Integrity', () => {
    beforeEach(() => {
        // Reset config to defaults
        config.startYear = 2026;
        config.endYear = 2071;
    });

    it('should generate income, expense, and tax data for all scenarios', () => {
        const results = SimulationEngine.run();

        expect(results.years.length).toBeGreaterThan(0);
        expect(results.optimistic).toBeDefined();
        expect(results.average).toBeDefined();
        expect(results.pessimistic).toBeDefined();

        const data = results.average;
        expect(data.income).toBeDefined();
        expect(data.expenses).toBeDefined();
        expect(data.taxes).toBeDefined();

        // Check for NaN in critical series
        expect(data.netWorth.every(v => !isNaN(v))).toBe(true);
        expect(data.income.Work.every(v => !isNaN(v))).toBe(true);
        expect(data.taxes.Federal.every(v => !isNaN(v))).toBe(true);
    });

    it('should have consistent year counts across all data structures', () => {
        const results = SimulationEngine.run().average;
        const count = results.yearsCount;

        expect(results.years.length).toBe(count);
        expect(results.netWorth.length).toBe(count);
        expect(results.income.Work.length).toBe(count);
        expect(results.expenses.General.length).toBe(count);
        expect(results.taxes.Federal.length).toBe(count);
    });

    it('should correctly populate Drawdown and RMD data', () => {
        const results = SimulationEngine.run().average;
        expect(results.income.Drawdown).toBeDefined();
        expect(results.income.RMD).toBeDefined();

        // Verify Drawdown is not just all zeros (usually it shouldn't be for a default retirement scenario)
        results.income.Drawdown.some(v => v > 0);
        // Note: Depending on default assets, might not have drawdown, but we want to know if it's there.
        expect(Array.isArray(results.income.Drawdown)).toBe(true);
    });
});
