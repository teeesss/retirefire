import { describe, it, expect } from 'vitest';
import { TaxCalculator } from '../../src/engine/TaxCalculator.js';

describe('TaxCalculator', () => {
    it('should have tax brackets defined', () => {
        expect(TaxCalculator.brackets).toBeDefined();
        expect(TaxCalculator.brackets.single).toBeDefined();
    });

    it('should calculate federal tax for single filer (low income)', () => {
        // Standard deduction 2024: 14600
        // Income 20000 -> Taxable 5400. 10% bracket. Tax = 540.
        const tax = TaxCalculator.calculateFederalSocialSecurity(20000, 'single');
        expect(tax).toBeCloseTo(540, 0);
    });

    it('should calculate federal tax for married filer (high income)', () => {
        // 2024 Married Deduction: 29200
        // Income 100,000 -> Taxable 70,800
        // Brackets:
        // 10% up to 23200 -> 2320
        // 12% from 23200 to 94300. (70800 - 23200 = 47600) * 0.12 = 5712
        // Total = 2320 + 5712 = 8032
        const tax = TaxCalculator.calculateFederalSocialSecurity(100000, 'married');
        expect(tax).toBeCloseTo(8032, 0);
    });

    it('should calculate breakdown for HoH filing status', () => {
        // HoH, Income 80k, FL
        const breakdown = TaxCalculator.calculateTaxBreakdown(80000, 0, 'hoh', 'FL', true);

        // Deduction: 21900. Taxable: 58100.
        // 10% on 16550 -> 1655
        // 12% on (58100-16550=41550) -> 4986
        // Total: 6641
        expect(breakdown.federalOrd).toBeCloseTo(6641, 0);
        expect(breakdown.fica).toBeCloseTo(80000 * 0.0765, 0);
    });

    it('should calculate state tax for CA', () => {
        // Single, Income 100k, CA (9.3%)
        const breakdown = TaxCalculator.calculateTaxBreakdown(100000, 0, 'single', 'CA', true);

        // Deduction: 14600. Taxable: 85400.
        // CA Tax: 85400 * 0.093 = 7942.2
        expect(breakdown.state).toBeCloseTo(7942, 0);
    });

    it('should not charge FICA for non-earned income', () => {
        // Retirement drawdown/Pension (not earned)
        const breakdown = TaxCalculator.calculateTaxBreakdown(100000, 0, 'single', 'FL', false);
        expect(breakdown.fica).toBe(0);
        expect(breakdown.federalOrd).toBeGreaterThan(0);
    });

    it('should handle zero income correctly', () => {
        const breakdown = TaxCalculator.calculateTaxBreakdown(0, 0, 'single', 'FL', false);
        expect(breakdown.total).toBe(0);
        expect(breakdown.federalOrd).toBe(0);
    });
});
