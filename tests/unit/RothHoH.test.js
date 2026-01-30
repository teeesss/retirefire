import { describe, it, expect } from 'vitest';
import RothOptimizer from '../../src/roth/RothOptimizer.js';

describe('RothOptimizer Head of Household Support', () => {
    const years = [2026, 2027, 2028, 2029, 2030];
    const ordinaryIncome = [100000, 100000, 100000, 100000, 100000];
    const traditionalBalance = [2000000, 2000000, 2000000, 2000000, 2000000];

    const params = {
        years,
        ordinaryIncome,
        traditionalBalance,
        filingStatus: 'hoh',
        targetBracket: 22,
        constraints: {}
    };

    it('should calculate non-zero conversions for Head of Household filing status', () => {
        const result = RothOptimizer.optimize({ ...params, filingStatus: 'hoh', targetBracket: 22 });

        // HoH 22% bracket starts at ~$63k and goes to ~$100k (2025/2026 approx)
        // With $100k income, it might already be at 22%, but 24% and higher should definitely work.
        // Let's test 24% for HoH.
        const result24 = RothOptimizer.optimize({ ...params, filingStatus: 'hoh', targetBracket: 24 });

        console.log('HoH 24% total converted:', result24.summary.totalConverted);
        expect(result24.summary.totalConverted).toBeGreaterThan(0);
    });

    it('should calculate different amounts for HoH vs Single vs Joint', () => {
        const resultHoH = RothOptimizer.optimize({ ...params, filingStatus: 'hoh', targetBracket: 12 });
        const resultSingle = RothOptimizer.optimize({ ...params, filingStatus: 'single', targetBracket: 12 });
        const resultJoint = RothOptimizer.optimize({ ...params, filingStatus: 'joint', targetBracket: 12 });

        console.log('12% Bracket Limits:');
        console.log('HoH:', resultHoH.summary.totalConverted);
        console.log('Single:', resultSingle.summary.totalConverted);
        console.log('Joint:', resultJoint.summary.totalConverted);

        // At 12% bracket, limits are: single 47150, joint 94300, hoh 63100
        // With $100k income, all should be 0 because income > limit.
        // Let's use 22% bracket where they are ALSO different (100525 vs 100500 vs 201050)
        // Actually, at 22%, Single and HoH are almost same. 
        // Let's use lower income to test 12%.
        const lowIncomeParams = { ...params, ordinaryIncome: [30000, 30000, 30000, 30000, 30000] };
        const resHoH = RothOptimizer.optimize({ ...lowIncomeParams, filingStatus: 'hoh', targetBracket: 12 });
        const resSingle = RothOptimizer.optimize({ ...lowIncomeParams, filingStatus: 'single', targetBracket: 12 });

        expect(resHoH.summary.totalConverted).not.toBe(resSingle.summary.totalConverted);
    });
});
