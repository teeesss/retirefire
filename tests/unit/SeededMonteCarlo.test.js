import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../../src/engine/SimulationEngine.js';
import { config } from '../../src/data/Config.js';

describe('Seeded Monte Carlo Reproducibility', () => {
    it('should produce identical results with the same seed', () => {
        const seed = 12345;
        const iterations = 100;
        const volatility = 0.15;

        // Run Monte Carlo twice with same seed
        const result1 = SimulationEngine.runMonteCarlo(iterations, volatility, 1.0, 'monte-carlo', seed);
        const result2 = SimulationEngine.runMonteCarlo(iterations, volatility, 1.0, 'monte-carlo', seed);

        // Results should be identical
        expect(result1.p10.length).toBe(result2.p10.length);
        expect(result1.p50.length).toBe(result2.p50.length);
        expect(result1.p90.length).toBe(result2.p90.length);

        // Check a few specific values
        expect(result1.p10[0]).toBe(result2.p10[0]);
        expect(result1.p50[0]).toBe(result2.p50[0]);
        expect(result1.p90[0]).toBe(result2.p90[0]);

        expect(result1.successRate).toBe(result2.successRate);
        expect(result1.legacyRate).toBe(result2.legacyRate);

        // Check final year values
        const lastIdx = result1.p50.length - 1;
        expect(result1.p10[lastIdx]).toBe(result2.p10[lastIdx]);
        expect(result1.p50[lastIdx]).toBe(result2.p50[lastIdx]);
        expect(result1.p90[lastIdx]).toBe(result2.p90[lastIdx]);
    });

    it('should produce different results with different seeds', () => {
        const seed1 = 12345;
        const seed2 = 67890;
        const iterations = 100;
        const volatility = 0.15;

        const result1 = SimulationEngine.runMonteCarlo(iterations, volatility, 1.0, 'monte-carlo', seed1);
        const result2 = SimulationEngine.runMonteCarlo(iterations, volatility, 1.0, 'monte-carlo', seed2);

        // Results should be different
        const lastIdx = result1.p50.length - 1;

        // At least one percentile should differ
        const hasDifference =
            result1.p10[lastIdx] !== result2.p10[lastIdx] ||
            result1.p50[lastIdx] !== result2.p50[lastIdx] ||
            result1.p90[lastIdx] !== result2.p90[lastIdx];

        expect(hasDifference).toBe(true);
    });

    it('should produce random results when no seed is provided', () => {
        const iterations = 100;
        const volatility = 0.15;

        // Run twice without seed
        const result1 = SimulationEngine.runMonteCarlo(iterations, volatility, 1.0, 'monte-carlo');
        const result2 = SimulationEngine.runMonteCarlo(iterations, volatility, 1.0, 'monte-carlo');

        // Results should be different (extremely unlikely to be identical)
        const lastIdx = result1.p50.length - 1;

        const hasDifference =
            result1.p10[lastIdx] !== result2.p10[lastIdx] ||
            result1.p50[lastIdx] !== result2.p50[lastIdx] ||
            result1.p90[lastIdx] !== result2.p90[lastIdx];

        expect(hasDifference).toBe(true);
    });

    it('should maintain statistical properties with seeded RNG', () => {
        const seed = 99999;
        const iterations = 500;
        const volatility = 0.15;

        const result = SimulationEngine.runMonteCarlo(iterations, volatility, 1.0, 'monte-carlo', seed);

        // Check that percentiles are ordered correctly
        const lastIdx = result.p10.length - 1;
        expect(result.p10[lastIdx]).toBeLessThanOrEqual(result.p25[lastIdx]);
        expect(result.p25[lastIdx]).toBeLessThanOrEqual(result.p50[lastIdx]);
        expect(result.p50[lastIdx]).toBeLessThanOrEqual(result.p75[lastIdx]);
        expect(result.p75[lastIdx]).toBeLessThanOrEqual(result.p90[lastIdx]);

        // Success rate should be reasonable (0-100%)
        expect(result.successRate).toBeGreaterThanOrEqual(0);
        expect(result.successRate).toBeLessThanOrEqual(100);

        // Legacy rate should be reasonable (0-100%)
        expect(result.legacyRate).toBeGreaterThanOrEqual(0);
        expect(result.legacyRate).toBeLessThanOrEqual(100);
    });
});
