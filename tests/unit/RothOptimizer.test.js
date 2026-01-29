import { describe, it, expect } from 'vitest';
import RothOptimizer from '../../src/roth/RothOptimizer.js';

describe('RothOptimizer', () => {
    describe('Tax Calculations', () => {
        it('should calculate correct marginal tax rate for joint filers', () => {
            expect(RothOptimizer.getMarginalRate(50000, 'joint')).toBe(12);
            expect(RothOptimizer.getMarginalRate(150000, 'joint')).toBe(22);
            expect(RothOptimizer.getMarginalRate(300000, 'joint')).toBe(24);
        });

        it('should calculate correct marginal tax rate for single filers', () => {
            expect(RothOptimizer.getMarginalRate(25000, 'single')).toBe(12);
            expect(RothOptimizer.getMarginalRate(75000, 'single')).toBe(22);
            expect(RothOptimizer.getMarginalRate(150000, 'single')).toBe(24);
        });

        it('should calculate correct effective tax rate', () => {
            const effectiveRate = RothOptimizer.getEffectiveRate(100000, 'joint');
            expect(effectiveRate).toBeGreaterThan(0);
            expect(effectiveRate).toBeLessThan(22); // Should be less than marginal rate
        });

        it('should calculate total tax correctly', () => {
            const tax = RothOptimizer.calculateTotalTax(100000, 'joint');
            // For $100K joint: 10% on first $23,200 + 12% on next $71,100 + 22% on remaining
            const expected = (23200 * 0.10) + (71100 * 0.12) + (5700 * 0.22);
            expect(Math.round(tax)).toBe(Math.round(expected));
        });

        it('should calculate tax on conversion correctly', () => {
            const baseIncome = 80000;
            const conversion = 50000;
            const taxOnConversion = RothOptimizer.calculateTaxOnConversion(
                baseIncome,
                conversion,
                'joint'
            );

            // Tax should be positive and reasonable
            expect(taxOnConversion).toBeGreaterThan(0);
            expect(taxOnConversion).toBeLessThan(conversion * 0.37); // Max bracket
        });
    });

    describe('Bracket Optimization', () => {
        it('should find optimal conversion to fill 22% bracket', () => {
            const result = RothOptimizer.findOptimalConversion({
                year: 2026,
                income: 100000,
                balance: 500000,
                filingStatus: 'joint',
                targetBracket: 22,
                constraints: {}
            });

            // Should convert up to the 22% bracket limit (201,050)
            expect(result.conversionAmount).toBe(201050 - 100000);
            expect(result.marginalRate).toBe(22);
        });

        it('should respect balance constraints', () => {
            const result = RothOptimizer.findOptimalConversion({
                year: 2026,
                income: 50000,
                balance: 30000, // Less than room in bracket
                filingStatus: 'joint',
                targetBracket: 22,
                constraints: {}
            });

            // Should only convert available balance
            expect(result.conversionAmount).toBe(30000);
            expect(result.remainingBalance).toBe(0);
        });

        it('should respect max annual constraint', () => {
            const result = RothOptimizer.findOptimalConversion({
                year: 2026,
                income: 50000,
                balance: 500000,
                filingStatus: 'joint',
                targetBracket: 22,
                constraints: { maxAnnual: 50000 }
            });

            expect(result.conversionAmount).toBe(50000);
        });

        it('should not convert if below minimum constraint', () => {
            const result = RothOptimizer.findOptimalConversion({
                year: 2026,
                income: 200000, // Near bracket limit
                balance: 500000,
                filingStatus: 'joint',
                targetBracket: 22,
                constraints: { minAnnual: 10000 }
            });

            // Room in bracket is only ~1,050, below minimum
            expect(result.conversionAmount).toBe(0);
        });
    });

    describe('Multi-Year Optimization', () => {
        it('should optimize across multiple years', () => {
            const params = {
                years: [2026, 2027, 2028],
                ordinaryIncome: [80000, 85000, 90000],
                traditionalBalance: [500000, 450000, 400000],
                filingStatus: 'joint',
                targetBracket: 22,
                constraints: {}
            };

            const results = RothOptimizer.optimize(params);

            expect(results.results).toHaveLength(3);
            expect(results.summary.totalConverted).toBeGreaterThan(0);
            expect(results.summary.yearsWithConversions).toBe(3);
        });

        it('should calculate correct summary statistics', () => {
            const params = {
                years: [2026, 2027],
                ordinaryIncome: [100000, 100000],
                traditionalBalance: [200000, 100000],
                filingStatus: 'joint',
                targetBracket: 22,
                constraints: {}
            };

            const results = RothOptimizer.optimize(params);

            expect(results.summary.totalConverted).toBeGreaterThan(0);
            expect(results.summary.totalTaxPaid).toBeGreaterThan(0);
            expect(results.summary.effectiveTaxRate).toBeGreaterThan(0);
            expect(results.summary.effectiveTaxRate).toBeLessThan(25);
        });

        it('should handle years outside conversion window', () => {
            const params = {
                years: [2025, 2026, 2050], // 2025 and 2050 outside default window
                ordinaryIncome: [100000, 100000, 100000],
                traditionalBalance: [500000, 500000, 500000],
                filingStatus: 'joint',
                targetBracket: 22,
                constraints: {}
            };

            const results = RothOptimizer.optimize(params);

            // Only 2026 should have conversions
            const conversions = results.results.filter(r => r.conversionAmount > 0);
            expect(conversions.length).toBeLessThan(3);
        });
    });

    describe('Strategy Comparison', () => {
        it('should compare manual vs optimized strategies', () => {
            const manual = {
                summary: {
                    totalConverted: 200000,
                    totalTaxPaid: 44000,
                    yearsWithConversions: 4
                }
            };

            const optimized = {
                summary: {
                    totalConverted: 250000,
                    totalTaxPaid: 50000,
                    yearsWithConversions: 5
                }
            };

            const comparison = RothOptimizer.compareStrategies(manual, optimized);

            expect(comparison.conversionDifference).toBe(50000);
            expect(comparison.taxSavings).toBe(-6000); // Paying more tax but converting more
            expect(comparison.recommendation).toBe('optimized');
        });
    });

    describe('Future Value Calculations', () => {
        it('should calculate future value correctly', () => {
            const fv = RothOptimizer.calculateFutureValue(100000, 10, 0.06);
            const expected = 100000 * Math.pow(1.06, 10);
            expect(Math.round(fv)).toBe(Math.round(expected));
        });

        it('should calculate legacy benefit', () => {
            const currentYear = new Date().getFullYear();
            const optimizedResults = {
                results: [
                    { year: currentYear, conversionAmount: 50000 },
                    { year: currentYear + 1, conversionAmount: 50000 },
                    { year: currentYear + 2, conversionAmount: 0 }
                ]
            };

            const benefit = RothOptimizer.calculateLegacyBenefit(
                optimizedResults,
                60, // current age
                85, // life expectancy
                0.06
            );

            expect(benefit).toBeGreaterThan(0);
        });
    });

    describe('Report Generation', () => {
        it('should generate comprehensive optimization report', () => {
            const optimizedResults = {
                summary: {
                    totalConverted: 300000,
                    totalTaxPaid: 60000,
                    effectiveTaxRate: 20,
                    averageAnnualConversion: 60000,
                    yearsWithConversions: 5
                },
                results: [
                    { year: 2026, conversionAmount: 60000, taxOnConversion: 12000 },
                    { year: 2027, conversionAmount: 60000, taxOnConversion: 12000 }
                ]
            };

            const report = RothOptimizer.generateReport(optimizedResults);

            expect(report.headline).toContain('300K');
            expect(report.headline).toContain('5 years');
            expect(report.metrics.totalConverted).toBe(300000);
            expect(report.metrics.effectiveTaxRate).toBe('20.00');
            expect(report.yearByYear).toHaveLength(2);
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero income', () => {
            const result = RothOptimizer.findOptimalConversion({
                year: 2026,
                income: 0,
                balance: 100000,
                filingStatus: 'joint',
                targetBracket: 22,
                constraints: {}
            });

            // Should convert up to bracket limit
            expect(result.conversionAmount).toBeGreaterThan(0);
            expect(result.conversionAmount).toBeLessThanOrEqual(201050);
        });

        it('should handle zero balance', () => {
            const result = RothOptimizer.findOptimalConversion({
                year: 2026,
                income: 100000,
                balance: 0,
                filingStatus: 'joint',
                targetBracket: 22,
                constraints: {}
            });

            expect(result.conversionAmount).toBe(0);
        });

        it('should handle income above target bracket', () => {
            const result = RothOptimizer.findOptimalConversion({
                year: 2026,
                income: 250000, // Above 22% bracket
                balance: 500000,
                filingStatus: 'joint',
                targetBracket: 22,
                constraints: {}
            });

            // No room in 22% bracket
            expect(result.conversionAmount).toBe(0);
        });
    });
});
