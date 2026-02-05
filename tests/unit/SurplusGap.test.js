import { describe, it, expect } from 'vitest';
import { getTotalIncome, getTotalExpenses } from '../../src/state/DataUtils.js';
import { rawData, updateRawData } from '../../src/data/Store.js';
import { config } from '../../src/data/Config.js';

describe('Surplus / Gap Logic', () => {
    it('should calculate valid surplus/gap values', () => {
        // Force specific config for predictable results
        config.currentScenario = 'average';
        // Run simulation to populate rawData
        updateRawData();

        const yearIndex = 0;
        const income = getTotalIncome('average', yearIndex, false);
        const expenses = getTotalExpenses('average', yearIndex);

        const gap = income - expenses;

        // The bug was that it might return only 1 or -1 or placeholders
        expect(typeof gap).toBe('number');
        expect(gap).not.toBe(1);
        expect(gap).not.toBe(-1);
        expect(Math.abs(gap)).toBeGreaterThan(100); // Should be a substantial number
    });

    it('should include drawdown in total income for funded status', () => {
        updateRawData();
        const fundedYear = rawData.average.years.length - 5; // Near end of plan
        const incomeWithDrawdown = getTotalIncome('average', fundedYear, true);
        const incomeWithoutDrawdown = getTotalIncome('average', fundedYear, false);

        // In retirement, drawdown should make a difference if assets exist
        expect(incomeWithDrawdown).toBeGreaterThanOrEqual(incomeWithoutDrawdown);
    });
});
