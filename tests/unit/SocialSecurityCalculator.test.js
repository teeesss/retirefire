import { describe, it, expect } from 'vitest';
import { SocialSecurityCalculator } from '../../src/utils/SocialSecurityCalculator.js';

describe('SocialSecurityCalculator', () => {
    describe('calculatePIA', () => {
        it('should calculate PIA correctly for a high earner', () => {
            const income = 120000;
            const pia = SocialSecurityCalculator.calculatePIA(income, 'high');

            // For $120k income, AIME is capped at Math.min(10000, 10500) = 10000
            // 2025 Bend Points: [1226, 7391]
            // Chunk 1: 1226 * 0.90 = 1103.4
            // Chunk 2: (7391 - 1226) * 0.32 = 6165 * 0.32 = 1972.8
            // Chunk 3: (10000 - 7391) * 0.15 = 2609 * 0.15 = 391.35
            // Total: 1103.4 + 1972.8 + 391.35 = 3467.55 -> 3467
            expect(pia).toBe(3467);
        });

        it('should calculate PIA correctly for a max earner', () => {
            const income = 300000;
            const pia = SocialSecurityCalculator.calculatePIA(income, 'max');

            // AIME is 14000
            // Chunk 1: 1103.4
            // Chunk 2: 1972.8
            // Chunk 3: (14000 - 7391) * 0.15 = 6609 * 0.15 = 991.35
            // Total: 1103.4 + 1972.8 + 991.35 = 4067.55 -> 4067
            expect(pia).toBe(4067);
        });
    });

    describe('calculateBenefitAtAge', () => {
        const pia = 3000;

        it('should return 100% of PIA at age 67 (FRA)', () => {
            expect(SocialSecurityCalculator.calculateBenefitAtAge(pia, 67)).toBe(3000);
        });

        it('should return reduced benefit at age 62', () => {
            // 60 months early.
            // First 36 months: 36 * (5/900) = 20%
            // Next 24 months: 24 * (5/1200) = 10%
            // Total reduction: 30% -> 70% of PIA
            expect(SocialSecurityCalculator.calculateBenefitAtAge(pia, 62)).toBe(2100);
        });

        it('should return increased benefit at age 70', () => {
            // 36 months late: 3 * 8% = 24% increase
            expect(SocialSecurityCalculator.calculateBenefitAtAge(pia, 70)).toBe(3720);
        });

        it('should handle ages between 62 and 67', () => {
            // Age 65: 24 months early. 24 * (5/900) = 13.33% reduction. 
            // 3000 * 0.8666... = 2600
            expect(SocialSecurityCalculator.calculateBenefitAtAge(pia, 65)).toBe(2600);
        });
    });

    describe('calculateBenefits', () => {
        it('should return benefit object for 62, 67, 70', () => {
            const pia = 3000;
            const res = SocialSecurityCalculator.calculateBenefits(pia);
            expect(res).toEqual({
                ss62: 2100,
                ss67: 3000,
                ss70: 3720
            });
        });
    });
});
