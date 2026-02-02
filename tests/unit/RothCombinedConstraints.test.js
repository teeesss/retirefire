import { describe, it, expect } from 'vitest';
import { RothOptimizer } from '../../src/roth/RothOptimizer.js';

describe('Roth Combined Constraints (TASK-006 Phase 4)', () => {
    const baseParams = {
        year: 2025,
        income: 80000,
        balance: 500000,
        filingStatus: 'joint',
        targetBracket: 24
    };

    it('should respect bracket limit when no max annual set', () => {
        const result = RothOptimizer.findOptimalConversion({
            ...baseParams,
            constraints: {}
        });

        // Joint 24% bracket limit is $394,600
        // Room = $394,600 - $80,000 = $314,600
        expect(result.conversionAmount).toBeLessThanOrEqual(314600);
        expect(result.constraints.limitingFactor).toBe('bracket');
        expect(result.constraints.maxAnnualCap).toBeNull();
        expect(result.constraints.bracketRoom).toBeGreaterThan(0);
    });

    it('should respect max annual when less than bracket room', () => {
        const result = RothOptimizer.findOptimalConversion({
            ...baseParams,
            constraints: { maxAnnual: 50000 }
        });

        expect(result.conversionAmount).toBe(50000);
        expect(result.constraints.limitingFactor).toBe('maxAnnual');
        expect(result.constraints.maxAnnualCap).toBe(50000);
        expect(result.constraints.effectiveLimit).toBe(50000);
    });

    it('should use bracket room when max annual is higher', () => {
        const result = RothOptimizer.findOptimalConversion({
            ...baseParams,
            constraints: { maxAnnual: 400000 } // Higher than bracket room
        });

        // Should use bracket room (~$303,900) not max annual
        expect(result.conversionAmount).toBeLessThan(400000);
        expect(result.constraints.limitingFactor).toBe('bracket');
        expect(result.constraints.maxAnnualCap).toBe(400000);
    });

    it('should respect balance limit when insufficient funds', () => {
        const result = RothOptimizer.findOptimalConversion({
            ...baseParams,
            balance: 25000, // Less than both bracket room and max annual
            constraints: { maxAnnual: 50000 }
        });

        expect(result.conversionAmount).toBe(25000);
        expect(result.constraints.limitingFactor).toBe('balance');
        expect(result.remainingBalance).toBe(0);
    });

    it('should apply minimum annual threshold', () => {
        const result = RothOptimizer.findOptimalConversion({
            ...baseParams,
            income: 390000, // Close to bracket limit
            constraints: {
                maxAnnual: 50000,
                minAnnual: 10000
            }
        });

        // Room in bracket is small (394,600 - 390,000 = 4,600)
        // Below minimum of 10,000, so should convert $0
        expect(result.conversionAmount).toBe(0);
        expect(result.constraints.limitingFactor).toBe('none');
    });

    it('should track all constraint values', () => {
        const result = RothOptimizer.findOptimalConversion({
            ...baseParams,
            constraints: { maxAnnual: 75000 }
        });

        expect(result.constraints).toHaveProperty('bracketRoom');
        expect(result.constraints).toHaveProperty('maxAnnualCap');
        expect(result.constraints).toHaveProperty('effectiveLimit');
        expect(result.constraints).toHaveProperty('limitingFactor');
        expect(result.constraints.bracketRoom).toBeGreaterThan(0);
        expect(result.constraints.maxAnnualCap).toBe(75000);
    });

    it('should handle edge case: exact bracket limit with max annual', () => {
        const result = RothOptimizer.findOptimalConversion({
            ...baseParams,
            income: 333900, // Leaves exactly $50k room in 24% bracket
            constraints: { maxAnnual: 50000 }
        });

        // Both constraints are equal, should use either
        expect(result.conversionAmount).toBe(50000);
        expect(['bracket', 'maxAnnual']).toContain(result.constraints.limitingFactor);
    });

    it('should work with different filing statuses', () => {
        const singleResult = RothOptimizer.findOptimalConversion({
            ...baseParams,
            filingStatus: 'single',
            income: 150000,
            constraints: { maxAnnual: 40000 }
        });

        // Single 24% bracket limit is $191,950
        // Room = $191,950 - $150,000 = $41,950
        // Max annual = $40,000 (wins)
        expect(singleResult.conversionAmount).toBe(40000);
        expect(singleResult.constraints.limitingFactor).toBe('maxAnnual');
    });

    it('should handle zero income scenario', () => {
        const result = RothOptimizer.findOptimalConversion({
            ...baseParams,
            income: 0,
            constraints: { maxAnnual: 100000 }
        });

        // With zero income, bracket room is full
        // Max annual should limit
        expect(result.conversionAmount).toBe(100000);
        expect(result.constraints.limitingFactor).toBe('maxAnnual');
        expect(result.constraints.bracketRoom).toBeGreaterThan(100000);
    });

    it('should calculate bracket utilization correctly', () => {
        const result = RothOptimizer.findOptimalConversion({
            ...baseParams,
            income: 280000, // Leaves ~$103,900 room
            constraints: { maxAnnual: 50000 }
        });

        // Converting $50k out of ~$103,900 room = ~48% utilization
        expect(result.bracketUtilization).toBeGreaterThan(40);
        expect(result.bracketUtilization).toBeLessThan(55);
    });
});
