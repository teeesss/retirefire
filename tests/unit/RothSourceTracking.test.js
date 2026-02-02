/**
 * Unit Tests for TASK-006 Phase 1: Account Source Transparency
 * Tests Roth conversion account source tracking functionality
 */

import { describe, it, expect } from 'vitest';
import RothOptimizer from '../../src/roth/RothOptimizer.js';

describe('TASK-006 Phase 1: Roth Conversion Account Source Tracking', () => {
    describe('Source Tracking - Retirement Accounts Only', () => {
        it('should fund conversion entirely from retirement accounts when sufficient', () => {
            const params = {
                year: 2025,
                income: 80000,
                balance: 500000, // Total traditional balance
                retirementBalance: 500000,
                investmentsBalance: 200000,
                filingStatus: 'single',
                targetBracket: 24,
                constraints: {}
            };

            const result = RothOptimizer.findOptimalConversion(params);

            // Should have a conversion
            expect(result.conversionAmount).toBeGreaterThan(0);

            // Should come entirely from retirement
            expect(result.sources.retirement).toBe(result.conversionAmount);
            expect(result.sources.investments).toBe(0);
        });

        it('should calculate correct bracket room for single filer', () => {
            const params = {
                year: 2025,
                income: 150000, // In 24% bracket
                balance: 300000,
                retirementBalance: 300000,
                investmentsBalance: 100000,
                filingStatus: 'single',
                targetBracket: 24, // Upper limit: $197,300 (2025)
                constraints: {}
            };

            const result = RothOptimizer.findOptimalConversion(params);

            // Room in bracket: 197300 - 150000 = 47300
            expect(result.conversionAmount).toBeLessThanOrEqual(48000);
            expect(result.conversionAmount).toBeGreaterThan(46000);
            expect(result.sources.retirement).toBe(result.conversionAmount);
        });
    });

    describe('Source Tracking - Mixed Accounts', () => {
        it('should use retirement first, then taxable when retirement insufficient', () => {
            const params = {
                year: 2025,
                income: 50000,
                balance: 60000, // Increased to allow pulling from both accounts
                retirementBalance: 30000,
                investmentsBalance: 100000, // Plenty in taxable
                filingStatus: 'single',
                targetBracket: 22, // Upper limit: $100,525
                constraints: {}
            };

            const result = RothOptimizer.findOptimalConversion(params);

            // Should want to convert more than $30k (room is ~50k)
            expect(result.conversionAmount).toBeGreaterThan(30000);

            // Should use all retirement
            expect(result.sources.retirement).toBe(30000);

            // Should pull remainder from taxable
            expect(result.sources.investments).toBeGreaterThan(0);
            expect(result.sources.retirement + result.sources.investments).toBe(result.conversionAmount);
        });

        it('should limit conversion to available funds across both accounts', () => {
            const params = {
                year: 2025,
                income: 50000,
                balance: 20000,
                retirementBalance: 20000,
                investmentsBalance: 15000, // Limited taxable
                filingStatus: 'single',
                targetBracket: 22, // Room: ~50k
                constraints: {}
            };

            const result = RothOptimizer.findOptimalConversion(params);

            // Should be limited to total available: $35k
            expect(result.conversionAmount).toBeLessThanOrEqual(35000);
            expect(result.sources.retirement).toBe(20000);
            expect(result.sources.investments).toBeLessThanOrEqual(15000);
        });
    });

    describe('Source Tracking - Edge Cases', () => {
        it('should handle zero retirement balance', () => {
            const params = {
                year: 2025,
                income: 60000,
                balance: 0,
                retirementBalance: 0,
                investmentsBalance: 100000,
                filingStatus: 'single',
                targetBracket: 22,
                constraints: {}
            };

            const result = RothOptimizer.findOptimalConversion(params);

            // Should fund entirely from taxable
            expect(result.sources.retirement).toBe(0);
            expect(result.sources.investments).toBe(result.conversionAmount);
        });

        it('should handle zero taxable balance', () => {
            const params = {
                year: 2025,
                income: 60000,
                balance: 100000,
                retirementBalance: 100000,
                investmentsBalance: 0,
                filingStatus: 'single',
                targetBracket: 22,
                constraints: {}
            };

            const result = RothOptimizer.findOptimalConversion(params);

            // Should fund entirely from retirement
            expect(result.sources.retirement).toBe(result.conversionAmount);
            expect(result.sources.investments).toBe(0);
        });

        it('should handle max annual constraint', () => {
            const params = {
                year: 2025,
                income: 50000,
                balance: 500000,
                retirementBalance: 500000,
                investmentsBalance: 200000,
                filingStatus: 'single',
                targetBracket: 22,
                constraints: {
                    maxAnnual: 25000 // User wants max $25k/year
                }
            };

            const result = RothOptimizer.findOptimalConversion(params);

            // Should respect max annual
            expect(result.conversionAmount).toBeLessThanOrEqual(25000);
            expect(result.sources.retirement).toBe(result.conversionAmount);
            expect(result.sources.investments).toBe(0);
        });
    });

    describe('Source Tracking - Tax Calculations', () => {
        it('should calculate tax correctly regardless of source', () => {
            const params = {
                year: 2025,
                income: 80000,
                balance: 20000,
                retirementBalance: 20000,
                investmentsBalance: 30000,
                filingStatus: 'single',
                targetBracket: 24,
                constraints: {}
            };

            const result = RothOptimizer.findOptimalConversion(params);

            // Tax should be based on total conversion, not source
            expect(result.taxOnConversion).toBeGreaterThan(0);

            // Marginal rate should be 22% (income + conversion still in 22% bracket)
            expect(result.marginalRate).toBe(22);
        });
    });

    describe('Backward Compatibility', () => {
        it('should work when retirementBalance/investmentsBalance not provided', () => {
            const params = {
                year: 2025,
                income: 80000,
                balance: 300000, // Legacy: only balance provided
                filingStatus: 'single',
                targetBracket: 24,
                constraints: {}
            };

            const result = RothOptimizer.findOptimalConversion(params);

            // Should default to using balance as retirement
            expect(result.conversionAmount).toBeGreaterThan(0);
            expect(result.sources.retirement).toBe(result.conversionAmount);
            expect(result.sources.investments).toBe(0);
        });
    });
});
