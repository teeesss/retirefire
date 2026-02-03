import { describe, it, expect, beforeEach } from 'vitest';
import RothOptimizer from '../../src/roth/RothOptimizer.js';
import RothConfig from '../../src/roth/RothConfig.js';

describe('RothOptimizer', () => {
    // Mock data
    const years = [2026, 2027, 2028, 2029, 2030];
    const ordinaryIncome = [100000, 103000, 106090, 109272, 112550]; // 3% growth

    beforeEach(() => {
        // Initialize RothConfig to ensure year range covers our test data
        RothConfig.startYear = 2026;
        RothConfig.endYear = 2030;
        RothConfig.mode = 'bracket';
        RothConfig.manualOverrides = {};
    });

    const params = {
        years,
        ordinaryIncome,
        traditionalBalance: [2000000, 2000000, 2000000, 2000000, 2000000], // High balance
        filingStatus: 'joint',
        targetBracket: 22,
        constraints: {}
    };

    it('should optimize correctly for a valid tax bracket (22%)', () => {
        const result = RothOptimizer.optimize({ ...params, targetBracket: 22 });
        expect(result.summary.totalConverted).toBeGreaterThan(0);

        // With $100k income, filling 22% bracket (limit ~$201k) leaves ~$100k room
        // 5 years * ~100k = ~500k total
        expect(result.summary.totalConverted).toBeGreaterThan(400000);
    });

    it('should optimize correctly for a higher tax bracket (24%)', () => {
        const result22 = RothOptimizer.optimize({ ...params, targetBracket: 22 });
        const result24 = RothOptimizer.optimize({ ...params, targetBracket: 24 });

        // 24% bracket has higher limit, so should convert more (or same if balance limited)
        expect(result24.summary.totalConverted).toBeGreaterThanOrEqual(result22.summary.totalConverted);

        // Specifically, 24% limit is ~$383k vs 22% ~$201k
        // So it should be significantly more if balance allows
        // But our mock balance is 500k vs 600k income room. 
        // Let's check distinctness
        expect(result24.summary.totalConverted).not.toBe(result22.summary.totalConverted);
    });

    it('should snap invalid legacy brackets (e.g., 25%) to nearest valid bracket (24%)', () => {
        // 25% doesn't exist. Nearest valid is 24%.
        const result25 = RothOptimizer.optimize({ ...params, targetBracket: 25 });
        const result24 = RothOptimizer.optimize({ ...params, targetBracket: 24 });

        // If validation works, 25 should behave exactly like 24
        expect(result25.summary.totalConverted).toBe(result24.summary.totalConverted);
        expect(result25.summary.totalConverted).toBeGreaterThan(0);
    });

    it('should handle small brackets input as percentages (e.g. 0.22 vs 22)', () => {
        // Some internal logic might pass 0.22
        const resultDecimal = RothOptimizer.optimize({ ...params, targetBracket: 0.22 });
        const resultInteger = RothOptimizer.optimize({ ...params, targetBracket: 22 });

        // Should normalize to 22
        expect(resultDecimal.summary.totalConverted).toBe(resultInteger.summary.totalConverted);
    });
});
