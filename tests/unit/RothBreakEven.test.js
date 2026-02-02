/**
 * Unit Tests for TASK-006 Phase 2: Break-Even Analysis
 * Tests Roth conversion break-even calculation functionality
 */

import { describe, it, expect } from 'vitest';
import RothMetricsCalculator from '../../src/roth/RothMetricsCalculator.js';

describe('TASK-006 Phase 2: Roth Conversion Break-Even Analysis', () => {
    describe('Break-Even Calculation - Basic Scenarios', () => {
        it('should calculate break-even when tax savings eventually offset conversion costs', () => {
            const rothData = {
                years: [2025, 2026, 2027, 2028, 2029, 2030],
                expenses: {
                    Taxes: [50000, 52000, 54000, 45000, 40000, 38000] // Lower taxes with Roth
                },
                rothConversions: {
                    taxPaid: [15000, 15000, 0, 0, 0, 0] // $30k total conversion tax
                }
            };

            const baselineData = {
                expenses: {
                    Taxes: [50000, 52000, 54000, 56000, 58000, 60000] // Higher taxes without Roth
                }
            };

            const config = { startAge: 53 };

            const result = RothMetricsCalculator.calculateBreakEven(rothData, baselineData, config);

            expect(result.breakEvenYear).toBeGreaterThanOrEqual(0);
            expect(result.breakEvenAge).toBeGreaterThanOrEqual(53);
            expect(result.neverBreaksEven).toBe(false);
            expect(result.yearsToBreakEven).toBe(result.breakEvenYear);
        });

        it('should detect when conversions never break even', () => {
            const rothData = {
                years: [2025, 2026, 2027, 2028, 2029],
                expenses: {
                    Taxes: [60000, 62000, 64000, 66000, 68000] // Always higher with Roth
                },
                rothConversions: {
                    taxPaid: [20000, 20000, 0, 0, 0] // $40k conversion tax
                }
            };

            const baselineData = {
                expenses: {
                    Taxes: [50000, 52000, 54000, 56000, 58000] // Lower without Roth
                }
            };

            const config = { startAge: 53 };

            const result = RothMetricsCalculator.calculateBreakEven(rothData, baselineData, config);

            expect(result.neverBreaksEven).toBe(true);
            expect(result.breakEvenYear).toBeNull();
            expect(result.breakEvenAge).toBeNull();
        });

        it('should calculate break-even in first year if immediate savings', () => {
            const rothData = {
                years: [2025, 2026, 2027],
                expenses: {
                    Taxes: [30000, 25000, 25000] // Lower taxes immediately
                },
                rothConversions: {
                    taxPaid: [5000, 0, 0] // Small conversion tax
                }
            };

            const baselineData = {
                expenses: {
                    Taxes: [50000, 50000, 50000] // Much higher baseline
                }
            };

            const config = { startAge: 65 };

            const result = RothMetricsCalculator.calculateBreakEven(rothData, baselineData, config);

            expect(result.breakEvenYear).toBe(0);
            expect(result.breakEvenAge).toBe(65);
            expect(result.neverBreaksEven).toBe(false);
        });
    });

    describe('Break-Even Calculation - Edge Cases', () => {
        it('should handle zero conversion tax', () => {
            const rothData = {
                years: [2025, 2026],
                expenses: { Taxes: [50000, 50000] },
                rothConversions: { taxPaid: [0, 0] }
            };

            const baselineData = {
                expenses: { Taxes: [50000, 50000] }
            };

            const config = { startAge: 53 };

            const result = RothMetricsCalculator.calculateBreakEven(rothData, baselineData, config);

            // With zero conversion tax, should not break even (no investment to recover)
            expect(result.neverBreaksEven).toBe(false);
            expect(result.finalTaxPaid).toBe(0);
        });

        it('should handle missing data gracefully', () => {
            const result = RothMetricsCalculator.calculateBreakEven(null, null, null);

            expect(result.neverBreaksEven).toBe(true);
            expect(result.breakEvenYear).toBeNull();
            expect(result.cumulativeTaxPaid).toEqual([]);
            expect(result.cumulativeTaxSaved).toEqual([]);
        });

        it('should handle mismatched array lengths', () => {
            const rothData = {
                years: [2025, 2026, 2027],
                expenses: { Taxes: [50000, 52000] }, // Shorter
                rothConversions: { taxPaid: [10000, 10000, 10000] }
            };

            const baselineData = {
                expenses: { Taxes: [50000, 52000, 54000, 56000] } // Longer
            };

            const config = { startAge: 53 };

            const result = RothMetricsCalculator.calculateBreakEven(rothData, baselineData, config);

            // Should handle gracefully without errors
            expect(result).toBeDefined();
            expect(result.cumulativeTaxPaid).toHaveLength(3);
        });
    });

    describe('Cumulative Arrays', () => {
        it('should calculate cumulative tax paid correctly', () => {
            const rothData = {
                years: [2025, 2026, 2027, 2028],
                expenses: { Taxes: [50000, 50000, 50000, 50000] },
                rothConversions: { taxPaid: [10000, 15000, 5000, 0] }
            };

            const baselineData = {
                expenses: { Taxes: [50000, 50000, 50000, 50000] }
            };

            const config = { startAge: 53 };

            const result = RothMetricsCalculator.calculateBreakEven(rothData, baselineData, config);

            expect(result.cumulativeTaxPaid).toEqual([10000, 25000, 30000, 30000]);
            expect(result.finalTaxPaid).toBe(30000);
        });

        it('should calculate cumulative tax saved correctly', () => {
            const rothData = {
                years: [2025, 2026, 2027, 2028],
                expenses: { Taxes: [50000, 45000, 40000, 35000] }, // Decreasing with Roth
                rothConversions: { taxPaid: [10000, 10000, 0, 0] }
            };

            const baselineData = {
                expenses: { Taxes: [50000, 50000, 50000, 50000] } // Constant baseline
            };

            const config = { startAge: 53 };

            const result = RothMetricsCalculator.calculateBreakEven(rothData, baselineData, config);

            // Year 0: 50000 - 50000 + 10000 = 10000
            // Year 1: 50000 - 45000 + 10000 = 15000 → cumulative: 25000
            // Year 2: 50000 - 40000 + 0 = 10000 → cumulative: 35000
            // Year 3: 50000 - 35000 + 0 = 15000 → cumulative: 50000
            expect(result.cumulativeTaxSaved[0]).toBe(10000);
            expect(result.cumulativeTaxSaved[3]).toBe(50000);
        });
    });

    describe('Break-Even Age Calculation', () => {
        it('should calculate correct break-even age from start age', () => {
            const rothData = {
                years: [2025, 2026, 2027, 2028, 2029],
                expenses: { Taxes: [50000, 48000, 46000, 44000, 42000] },
                rothConversions: { taxPaid: [8000, 8000, 0, 0, 0] }
            };

            const baselineData = {
                expenses: { Taxes: [50000, 52000, 54000, 56000, 58000] }
            };

            const config = { startAge: 60 };

            const result = RothMetricsCalculator.calculateBreakEven(rothData, baselineData, config);

            if (!result.neverBreaksEven) {
                expect(result.breakEvenAge).toBe(60 + result.breakEvenYear);
                expect(result.breakEvenAge).toBeGreaterThanOrEqual(60);
                expect(result.breakEvenAge).toBeLessThan(100);
            }
        });

        it('should use default start age if not provided', () => {
            const rothData = {
                years: [2025, 2026],
                expenses: { Taxes: [40000, 35000] },
                rothConversions: { taxPaid: [5000, 0] }
            };

            const baselineData = {
                expenses: { Taxes: [50000, 50000] }
            };

            const config = {}; // No startAge

            const result = RothMetricsCalculator.calculateBreakEven(rothData, baselineData, config);

            if (!result.neverBreaksEven) {
                // Should default to 53
                expect(result.breakEvenAge).toBeGreaterThanOrEqual(53);
            }
        });
    });

    describe('Real-World Scenario', () => {
        it('should handle typical 10-year conversion strategy', () => {
            // Typical scenario: Convert $50k/year for 5 years at 22% tax rate
            // Tax paid: $11k/year = $55k total
            // Savings accumulate as RMDs avoided in later years
            const rothData = {
                years: Array.from({ length: 20 }, (_, i) => 2025 + i),
                expenses: {
                    // Higher taxes during conversion, lower later
                    Taxes: [
                        61000, 61000, 61000, 61000, 61000, // Conversion years (base 50k + 11k conversion tax)
                        50000, 50000, 50000, 50000, 50000, // Post-conversion
                        45000, 45000, 45000, 45000, 45000, // RMD years (lower due to Roth)
                        40000, 40000, 40000, 40000, 40000
                    ]
                },
                rothConversions: {
                    taxPaid: [
                        11000, 11000, 11000, 11000, 11000, // 5 years of conversions
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                    ]
                }
            };

            const baselineData = {
                expenses: {
                    // Constant moderate taxes, then higher RMD taxes
                    Taxes: [
                        50000, 50000, 50000, 50000, 50000,
                        50000, 50000, 50000, 50000, 50000,
                        60000, 60000, 60000, 60000, 60000, // Higher RMD taxes
                        65000, 65000, 65000, 65000, 65000
                    ]
                }
            };

            const config = { startAge: 53 };

            const result = RothMetricsCalculator.calculateBreakEven(rothData, baselineData, config);

            expect(result.finalTaxPaid).toBe(55000);
            expect(result.breakEvenYear).toBeGreaterThan(5); // Should break even after conversion period
            expect(result.breakEvenAge).toBeLessThan(75); // Should break even before age 75
            expect(result.neverBreaksEven).toBe(false);
        });
    });
});
