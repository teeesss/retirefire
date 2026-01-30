/**
 * Unit Tests for Roth Conversion Module
 */

import { describe, it, expect, beforeEach } from 'vitest';
import RothConfig, { calculateBracketAmount, validateConversionAmount, getStrategyDescription } from '../../src/roth/RothConfig.js';
import RothCalculator from '../../src/roth/RothCalculator.js';

describe('RothConfig', () => {
    beforeEach(() => {
        // Reset to defaults
        RothConfig.enabled = true;
        RothConfig.mode = 'manual';
        RothConfig.manualAmount = 50000;
        RothConfig.targetBracket = 22;
        RothConfig.maxAnnualCap = null;
        RothConfig.startYear = 2026;
        RothConfig.endYear = 2047;
    });

    describe('calculateBracketAmount', () => {
        it('should calculate available room in 12% bracket for joint filers', () => {
            const result = calculateBracketAmount(12, 'joint', 50000);
            expect(result).toBe(44300); // 94300 - 50000
        });

        it('should calculate available room in 22% bracket for single filers', () => {
            const result = calculateBracketAmount(22, 'single', 60000);
            expect(result).toBe(40525); // 100525 - 60000
        });

        it('should return 0 if income exceeds bracket limit', () => {
            const result = calculateBracketAmount(12, 'joint', 100000);
            expect(result).toBe(0);
        });

        it('should apply cap when maxAnnualCap is set', () => {
            RothConfig.maxAnnualCap = 30000;
            const result = calculateBracketAmount(22, 'joint', 80000);
            expect(result).toBe(30000); // Min of (121050, 30000)
        });

        it('should handle invalid bracket gracefully', () => {
            const result = calculateBracketAmount(99, 'joint', 50000);
            expect(result).toBe(0);
        });
    });

    describe('validateConversionAmount', () => {
        it('should return amount if valid', () => {
            expect(validateConversionAmount(50000, 500000)).toBe(50000);
        });

        it('should return 0 for negative amounts', () => {
            expect(validateConversionAmount(-1000, 500000)).toBe(0);
        });

        it('should cap at retirement balance', () => {
            expect(validateConversionAmount(600000, 500000)).toBe(500000);
        });

        it('should handle zero balance', () => {
            expect(validateConversionAmount(50000, 0)).toBe(0);
        });
    });

    describe('getStrategyDescription', () => {
        it('should describe manual strategy', () => {
            RothConfig.mode = 'manual';
            RothConfig.manualAmount = 50000;
            expect(getStrategyDescription()).toContain('$50,000');
        });

        it('should describe bracket strategy', () => {
            RothConfig.mode = 'bracket';
            RothConfig.targetBracket = 22;
            expect(getStrategyDescription()).toContain('22%');
        });

        it('should describe hybrid strategy', () => {
            RothConfig.mode = 'hybrid';
            RothConfig.targetBracket = 24;
            RothConfig.maxAnnualCap = 100000;
            expect(getStrategyDescription()).toContain('24%');
            expect(getStrategyDescription()).toContain('$100,000');
        });
    });
});

describe('RothCalculator', () => {
    beforeEach(() => {
        RothConfig.enabled = true;
        RothConfig.mode = 'manual';
        RothConfig.manualAmount = 50000;
        RothConfig.startYear = 2026;
        RothConfig.endYear = 2047;
    });

    describe('calculateYearlyConversion', () => {
        it('should return 0 if conversions disabled', () => {
            RothConfig.enabled = false;
            const result = RothCalculator.calculateYearlyConversion(2030, 500000, 80000, 'joint');
            expect(result).toBe(0);
        });

        it('should return 0 if year is before start year', () => {
            const result = RothCalculator.calculateYearlyConversion(2025, 500000, 80000, 'joint');
            expect(result).toBe(0);
        });

        it('should return 0 if year is after end year', () => {
            const result = RothCalculator.calculateYearlyConversion(2050, 500000, 80000, 'joint');
            expect(result).toBe(0);
        });

        it('should return 0 if retirement balance is 0', () => {
            const result = RothCalculator.calculateYearlyConversion(2030, 0, 80000, 'joint');
            expect(result).toBe(0);
        });

        it('should return manual amount in manual mode', () => {
            RothConfig.mode = 'manual';
            RothConfig.manualAmount = 50000;
            const result = RothCalculator.calculateYearlyConversion(2030, 500000, 80000, 'joint');
            expect(result).toBe(50000);
        });

        it('should calculate bracket amount in bracket mode', () => {
            RothConfig.mode = 'bracket';
            RothConfig.targetBracket = 22;
            RothConfig.maxAnnualCap = null; // Ensure no cap
            const result = RothCalculator.calculateYearlyConversion(2030, 500000, 80000, 'joint');
            expect(result).toBe(121050); // 201050 - 80000
        });

        it('should cap at retirement balance', () => {
            RothConfig.mode = 'manual';
            RothConfig.manualAmount = 600000;
            const result = RothCalculator.calculateYearlyConversion(2030, 100000, 80000, 'joint');
            expect(result).toBe(100000);
        });

        it('should apply hybrid cap correctly', () => {
            RothConfig.mode = 'hybrid';
            RothConfig.targetBracket = 22;
            RothConfig.maxAnnualCap = 50000;
            const result = RothCalculator.calculateYearlyConversion(2030, 500000, 80000, 'joint');
            expect(result).toBe(50000); // Min of bracket room and cap
        });
    });

    describe('calculateLifetimeConversions', () => {
        it('should calculate total and years correctly', () => {
            const yearlyAmounts = [50000, 50000, 0, 50000, 50000];
            const result = RothCalculator.calculateLifetimeConversions(2026, 2030, yearlyAmounts);
            expect(result.total).toBe(200000);
            expect(result.years).toBe(4);
        });

        it('should handle all zeros', () => {
            const yearlyAmounts = [0, 0, 0];
            const result = RothCalculator.calculateLifetimeConversions(2026, 2028, yearlyAmounts);
            expect(result.total).toBe(0);
            expect(result.years).toBe(0);
        });
    });

    describe('calculateTaxImpact', () => {
        it('should calculate tax for joint filers in 12% bracket', () => {
            const tax = RothCalculator.calculateTaxImpact(20000, 50000, 'joint');
            expect(tax).toBeGreaterThan(0);
            expect(tax).toBeLessThan(20000); // Sanity check
        });

        it('should calculate higher tax for higher income', () => {
            const lowTax = RothCalculator.calculateTaxImpact(50000, 50000, 'joint');
            const highTax = RothCalculator.calculateTaxImpact(50000, 150000, 'joint');
            expect(highTax).toBeGreaterThan(lowTax);
        });

        it('should calculate different tax for single vs joint', () => {
            const singleTax = RothCalculator.calculateTaxImpact(50000, 80000, 'single');
            const jointTax = RothCalculator.calculateTaxImpact(50000, 80000, 'joint');
            expect(singleTax).toBeGreaterThan(jointTax);
        });

        it('should return 0 for zero income', () => {
            const tax = RothCalculator.calculateTaxImpact(0, 0, 'joint');
            expect(tax).toBe(0);
        });
    });

    describe('calculateEffectiveRate', () => {
        it('should calculate effective rate correctly', () => {
            const rate = RothCalculator.calculateEffectiveRate(15000, 100000);
            expect(rate).toBe(15);
        });

        it('should return 0 for zero income', () => {
            const rate = RothCalculator.calculateEffectiveRate(0, 0);
            expect(rate).toBe(0);
        });

        it('should handle high tax scenarios', () => {
            const rate = RothCalculator.calculateEffectiveRate(37000, 100000);
            expect(rate).toBe(37);
        });
    });

    describe('calculateLegacyImpact', () => {
        it('should calculate growth correctly', () => {
            const result = RothCalculator.calculateLegacyImpact(100000, 10, 0.06);
            expect(result).toBeCloseTo(179084.77, 0); // 100000 * 1.06^10
        });

        it('should return original amount for 0 years', () => {
            const result = RothCalculator.calculateLegacyImpact(100000, 0, 0.06);
            expect(result).toBe(100000);
        });

        it('should handle different return rates', () => {
            const low = RothCalculator.calculateLegacyImpact(100000, 10, 0.04);
            const high = RothCalculator.calculateLegacyImpact(100000, 10, 0.08);
            expect(high).toBeGreaterThan(low);
        });
    });

    describe('optimizeStrategy', () => {
        it('should return optimized amounts for each year', () => {
            const years = [2026, 2027, 2028];
            const incomes = [80000, 85000, 90000];
            const balances = [500000, 480000, 460000];

            const result = RothCalculator.optimizeStrategy(years, incomes, balances, 15);

            expect(result).toHaveLength(3);
            expect(result[0]).toHaveProperty('year', 2026);
            expect(result[0]).toHaveProperty('amount');
            expect(result[0].amount).toBeGreaterThanOrEqual(0);
        });

        it('should respect balance constraints', () => {
            const years = [2026];
            const incomes = [80000];
            const balances = [50000];

            const result = RothCalculator.optimizeStrategy(years, incomes, balances, 15);

            expect(result[0].amount).toBeLessThanOrEqual(50000);
        });
    });
});

describe('Integration: Roth Module', () => {
    it('should work end-to-end for manual strategy', () => {
        RothConfig.enabled = true;
        RothConfig.mode = 'manual';
        RothConfig.manualAmount = 50000;
        RothConfig.startYear = 2026;
        RothConfig.endYear = 2030;

        const yearlyAmounts = [];
        for (let year = 2026; year <= 2030; year++) {
            const amount = RothCalculator.calculateYearlyConversion(year, 500000, 80000, 'joint');
            yearlyAmounts.push(amount);
        }

        const lifetime = RothCalculator.calculateLifetimeConversions(2026, 2030, yearlyAmounts);

        expect(lifetime.total).toBe(250000); // 50k * 5 years
        expect(lifetime.years).toBe(5);
    });

    it('should work end-to-end for bracket strategy', () => {
        RothConfig.enabled = true;
        RothConfig.mode = 'bracket';
        RothConfig.targetBracket = 22;
        RothConfig.startYear = 2026;
        RothConfig.endYear = 2028;

        const yearlyAmounts = [];
        for (let year = 2026; year <= 2028; year++) {
            const amount = RothCalculator.calculateYearlyConversion(year, 500000, 80000, 'joint');
            yearlyAmounts.push(amount);
        }

        const lifetime = RothCalculator.calculateLifetimeConversions(2026, 2028, yearlyAmounts);

        expect(lifetime.total).toBeGreaterThan(0);
        expect(lifetime.years).toBe(3);
    });

    it('should handle disabled conversions', () => {
        RothConfig.enabled = false;

        const amount = RothCalculator.calculateYearlyConversion(2030, 500000, 80000, 'joint');
        expect(amount).toBe(0);
    });
});
