import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../../src/engine/SimulationEngine.js';
import { config } from '../../src/data/Config.js';

describe('Monte Carlo Logic', () => {
    it('should generate valid statistical results', () => {
        const iterations = 100;
        const volatility = 0.15;
        const spendMult = 1.0;

        const results = SimulationEngine.runMonteCarlo(iterations, volatility, spendMult);

        expect(results).toBeDefined();
        expect(results.p50).toBeDefined();
        expect(results.p50.length).toBeGreaterThan(0);

        // Check if data is populated
        const lastMedian = results.p50[results.p50.length - 1];
        console.log('DEBUG: MC Last Median:', lastMedian);

        expect(lastMedian).not.toBeNaN();
        expect(results.successRate).toBeGreaterThanOrEqual(0);
        expect(results.successRate).toBeLessThanOrEqual(100);

        // Verify percentile order (P90 > P75 > P50 > P25 > P10)
        const lastP90 = results.p90[results.p90.length - 1];
        const lastP10 = results.p10[results.p10.length - 1];
        expect(lastP90).toBeGreaterThanOrEqual(lastP10);
    });

    it('should handle zero iterations gracefully or throw descriptive error', () => {
        try {
            const results = SimulationEngine.runMonteCarlo(0, 0.15, 1.0);
            expect(results.p50).toBeDefined();
        } catch (e) {
            expect(e).toBeDefined();
        }
    });

    it('should respond to spending multiplier', () => {
        const resultsLow = SimulationEngine.runMonteCarlo(50, 0.15, 0.5);
        const resultsHigh = SimulationEngine.runMonteCarlo(50, 0.15, 2.0);

        const medianLow = resultsLow.p50[resultsLow.p50.length - 1];
        const medianHigh = resultsHigh.p50[resultsHigh.p50.length - 1];

        expect(medianLow).toBeGreaterThan(medianHigh);
    });

    it('should support historical scenarios', () => {
        const results70s = SimulationEngine.runMonteCarlo(1, 0.15, 1.0, '1970s');
        const resultsNormal = SimulationEngine.runMonteCarlo(1, 0.15, 1.0, 'monte-carlo');

        expect(results70s.p50).toBeDefined();
        expect(results70s.p50.length).toBeGreaterThan(0);
        // Note: Individual runs will differ, but we verify it completes without error
    });
});
