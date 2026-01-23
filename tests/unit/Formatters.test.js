import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercent } from '../../src/utils/Formatters.js';

describe('Formatters', () => {
    describe('formatCurrency', () => {
        it('should format zero', () => {
            expect(formatCurrency(0)).toBe('$0');
        });

        it('should format millions (short)', () => {
            expect(formatCurrency(1500000)).toBe('$1.5M');
        });

        it('should format thousands (short)', () => {
            expect(formatCurrency(1500)).toBe('$2K'); // toFixed(0) rounds up/down? 1.5 -> 2
        });

        it('should format full values when short=false', () => {
            expect(formatCurrency(1234, false)).toBe('$1,234');
        });
    });

    describe('formatPercent', () => {
        it('should format decimal to percent', () => {
            expect(formatPercent(0.05)).toBe('5.0%');
            expect(formatPercent(0.123)).toBe('12.3%');
        });
    });
});
