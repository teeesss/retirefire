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
});
