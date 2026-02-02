import { describe, it, expect } from 'vitest';
import { InputValidator } from '../../src/utils/InputValidator.js';
import { safeDiv, safePercent, clamp, safeParseNumber } from '../../src/utils/SafeMath.js';
import { TaxCalculator } from '../../src/engine/TaxCalculator.js';

describe('Edge Case Testing', () => {
    describe('Input Validation - Extreme Values', () => {
        it('should reject negative salary', () => {
            const result = InputValidator.validate(-50000, 'salary');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('between');
        });

        it('should reject absurdly high salary', () => {
            const result = InputValidator.validate(999999999999, 'salary');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('10,000,000');
        });

        it('should reject age over 100', () => {
            const result = InputValidator.validate(120, 'age');
            expect(result.valid).toBe(false);
        });

        it('should reject age under 18', () => {
            const result = InputValidator.validate(15, 'age');
            expect(result.valid).toBe(false);
        });

        it('should reject retirement age before current age', () => {
            const settings = {
                personal: { age: 65, retireAge: 55 },
                income: { salary: 100000 }
            };
            const result = InputValidator.validateSettings(settings);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('greater than current age'))).toBe(true);
        });

        it('should accept valid settings', () => {
            const settings = {
                personal: { age: 45, retireAge: 65 },
                income: { salary: 100000 },
                rates: {
                    optimistic: 0.10,
                    average: 0.07,
                    pessimistic: 0.04,
                    inflation: 0.025
                }
            };
            const result = InputValidator.validateSettings(settings);
            expect(result.valid).toBe(true);
        });

        it('should reject extreme rate values', () => {
            const settings = {
                personal: { age: 45, retireAge: 65 },
                income: { salary: 100000 },
                rates: {
                    optimistic: 0.75, // 75% - unrealistic
                    average: 0.07,
                    pessimistic: 0.04,
                    inflation: 0.025
                }
            };
            const result = InputValidator.validateSettings(settings);
            expect(result.valid).toBe(false);
        });
    });

    describe('Monte Carlo Validation', () => {
        it('should reject 0 iterations', () => {
            const result = InputValidator.validateMonteCarloIterations(0);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('>= 1');
        });

        it('should reject negative iterations', () => {
            const result = InputValidator.validateMonteCarloIterations(-100);
            expect(result.valid).toBe(false);
        });

        it('should reject iterations over 100k', () => {
            const result = InputValidator.validateMonteCarloIterations(500000);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('100,000');
        });

        it('should accept valid iteration count', () => {
            const result = InputValidator.validateMonteCarloIterations(1000);
            expect(result.valid).toBe(true);
            expect(result.value).toBe(1000);
        });

        it('should reject non-numeric iterations', () => {
            const result = InputValidator.validateMonteCarloIterations('abc');
            expect(result.valid).toBe(false);
        });
    });

    describe('SafeMath Edge Cases', () => {
        it('should handle division by zero', () => {
            const result = safeDiv(100, 0, -1);
            expect(result).toBe(-1);
        });

        it('should handle NaN numerator', () => {
            const result = safeDiv(NaN, 5, 99);
            expect(result).toBe(99);
        });

        it('should handle NaN denominator', () => {
            const result = safeDiv(100, NaN, 42);
            expect(result).toBe(42);
        });

        it('should handle Infinity numerator', () => {
            const result = safeDiv(Infinity, 5, 0);
            expect(result).toBe(0);
        });

        it('should handle Infinity denominator', () => {
            const result = safeDiv(100, Infinity, 0);
            expect(result).toBe(0);
        });

        it('should handle string inputs', () => {
            const result = safeDiv('hello', 5, 42);
            expect(result).toBe(42);
        });

        it('should handle both NaN', () => {
            const result = safeDiv(NaN, NaN, 123);
            expect(result).toBe(123);
        });

        it('should handle normal division', () => {
            const result = safeDiv(100, 4, 0);
            expect(result).toBe(25);
        });

        it('should handle safePercent with zero denominator', () => {
            const result = safePercent(50, 0);
            expect(result).toBe(0);
        });

        it('should handle safePercent normally', () => {
            const result = safePercent(25, 100);
            expect(result).toBe(25);
        });

        it('should clamp values correctly', () => {
            expect(clamp(150, 0, 100)).toBe(100);
            expect(clamp(-10, 0, 100)).toBe(0);
            expect(clamp(50, 0, 100)).toBe(50);
            expect(clamp(NaN, 0, 100)).toBe(0);
        });

        it('should parse numbers safely', () => {
            expect(safeParseNumber('123', 0, 1000, 0)).toBe(123);
            expect(safeParseNumber('abc', 0, 1000, 0)).toBe(0);
            expect(safeParseNumber('5000', 0, 1000, 0)).toBe(1000); // clamped
            expect(safeParseNumber('-100', 0, 1000, 0)).toBe(0); // clamped
        });
    });

    describe('Tax Calculator Edge Cases', () => {
        it('should handle $0 income', () => {
            const tax = TaxCalculator.getTaxes(0, 'single', 'CA');
            expect(tax.total).toBe(0);
        });

        it('should handle negative income gracefully', () => {
            const tax = TaxCalculator.getTaxes(-50000, 'single', 'CA');
            expect(tax.total).toBe(0);
        });

        it('should handle very high income', () => {
            const tax = TaxCalculator.getTaxes(20000000, 'single', 'CA');
            expect(tax.total).toBeGreaterThan(7000000);
        });

        it('should handle unknown state code', () => {
            const tax = TaxCalculator.getTaxes(100000, 'single', 'XX');
            expect(tax.state).toBe(0);
        });

        it('should handle unknown filing status', () => {
            const tax = TaxCalculator.getTaxes(100000, 'unknown', 'CA');
            expect(tax.total).toBeGreaterThan(0); // Should default to single
        });

        it('should calculate progressive tax correctly', () => {
            const brackets = [
                { limit: 10000, rate: 0.10 },
                { limit: 50000, rate: 0.20 },
                { limit: Infinity, rate: 0.30 }
            ];

            // Income of $60,000:
            // First $10k at 10% = $1,000
            // Next $40k at 20% = $8,000
            // Last $10k at 30% = $3,000
            // Total = $12,000
            const tax = TaxCalculator.calculateProgressive(60000, brackets);
            expect(tax).toBe(12000);
        });

        it('should handle income exactly at bracket limit', () => {
            const brackets = [
                { limit: 10000, rate: 0.10 },
                { limit: 50000, rate: 0.20 }
            ];
            const tax = TaxCalculator.calculateProgressive(10000, brackets);
            expect(tax).toBe(1000);
        });
    });

    describe('String Sanitization', () => {
        it('should remove HTML tags', () => {
            const result = InputValidator.sanitizeString('<script>alert("XSS")</script>');
            expect(result).not.toContain('<');
            expect(result).not.toContain('>');
        });

        it('should remove javascript: protocol', () => {
            const result = InputValidator.sanitizeString('javascript:alert(1)');
            expect(result).not.toContain('javascript:');
        });

        it('should remove event handlers', () => {
            const result = InputValidator.sanitizeString('<img src=x onerror=alert(1)>');
            expect(result).not.toContain('onerror=');
        });

        it('should limit string length', () => {
            const longString = 'a'.repeat(1000);
            const result = InputValidator.sanitizeString(longString);
            expect(result.length).toBeLessThanOrEqual(500);
        });

        it('should handle non-string input', () => {
            expect(InputValidator.sanitizeString(123)).toBe('');
            expect(InputValidator.sanitizeString(null)).toBe('');
            expect(InputValidator.sanitizeString(undefined)).toBe('');
        });

        it('should trim whitespace', () => {
            const result = InputValidator.sanitizeString('  hello world  ');
            expect(result).toBe('hello world');
        });
    });

    describe('Boundary Value Testing', () => {
        it('should handle minimum age', () => {
            const result = InputValidator.validate(18, 'age');
            expect(result.valid).toBe(true);
            expect(result.value).toBe(18);
        });

        it('should handle maximum age', () => {
            const result = InputValidator.validate(100, 'age');
            expect(result.valid).toBe(true);
            expect(result.value).toBe(100);
        });

        it('should handle minimum retirement age', () => {
            const result = InputValidator.validate(50, 'retireAge');
            expect(result.valid).toBe(true);
        });

        it('should handle maximum retirement age', () => {
            const result = InputValidator.validate(100, 'retireAge');
            expect(result.valid).toBe(true);
        });

        it('should handle zero salary', () => {
            const result = InputValidator.validate(0, 'salary');
            expect(result.valid).toBe(true);
            expect(result.value).toBe(0);
        });

        it('should handle maximum salary', () => {
            const result = InputValidator.validate(10000000, 'salary');
            expect(result.valid).toBe(true);
        });
    });
});
