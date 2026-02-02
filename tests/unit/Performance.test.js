import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../../src/engine/SimulationEngine.js';
import { config } from '../../src/data/Config.js';

describe('Performance Benchmarks', () => {
    it('should complete 1000 Monte Carlo iterations in under 3 seconds', () => {
        const start = performance.now();
        const iterations = 1000;
        SimulationEngine.runMonteCarlo(iterations, 0.15, 1.0, 'monte-carlo', 12345);
        const duration = performance.now() - start;

        console.log(`Monte Carlo (${iterations} iterations): ${duration.toFixed(0)}ms`);
        expect(duration).toBeLessThan(3000);
    });

    it('should complete single projection in under 50ms', () => {
        const start = performance.now();
        SimulationEngine.project(config, 'average');
        const duration = performance.now() - start;

        console.log(`Single projection: ${duration.toFixed(2)}ms`);
        expect(duration).toBeLessThan(50);
    });
});
