/**
 * Test for Chart Logic and Data Utils
 */
import { expect, test, describe, beforeEach } from 'vitest';
import { getTotalIncome, getTotalExpenses } from '../src/state/DataUtils.js';
import { config } from '../src/data/Config.js';
import { rawData } from '../src/data/Store.js';

describe('Data Utility Tests', () => {
    test('getTotalIncome excludes drawdown when requested', () => {
        // Mock rawData
        rawData.average = {
            income: {
                Work: [1000, 1000],
                SocialSecurity: [500, 500],
                Drawdown: [200, 200]
            }
        };

        const totalWithDrawdown = getTotalIncome('average', 0, true);
        const totalWithoutDrawdown = getTotalIncome('average', 0, false);

        expect(totalWithDrawdown).toBe(1700);
        expect(totalWithoutDrawdown).toBe(1500);
    });

    test('getTotalExpenses sums all expense categories', () => {
        rawData.average = {
            expenses: {
                General: [500],
                Housing: [300],
                Medical: [100],
                LTC: [50],
                Taxes: [200]
            }
        };

        const totalExp = getTotalExpenses('average', 0);
        expect(totalExp).toBe(1150);
    });
});
