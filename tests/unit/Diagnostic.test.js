import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../../src/engine/SimulationEngine.js';
import { config } from '../../src/data/Config.js';

describe('Application Logic Diagnostics', () => {
    it('should have a working SimulationEngine', () => {
        const results = SimulationEngine.run();
        expect(results).toBeDefined();
        expect(results.years.length).toBeGreaterThan(0);
        expect(results.average.netWorth[0]).toBeGreaterThan(0);

        console.log(`DIAG: Final NW (Avg): $${(results.average.netWorth[results.average.netWorth.length - 1] / 1e6).toFixed(2)}M`);
    });

    it('should have working Monte Carlo logic', () => {
        const mc = SimulationEngine.runMonteCarlo(50, 0.15, 1.0);
        expect(mc.successRate).toBeGreaterThanOrEqual(0);
        expect(mc.p50[mc.p50.length - 1]).toBeGreaterThan(0);

        console.log(`DIAG: MC Success Rate: ${mc.successRate.toFixed(1)}%`);
    });

    it('should have a valid config structure', () => {
        expect(config.settings).toBeDefined();
        expect(config.settings.personal).toBeDefined();
        expect(config.settings.assets).toBeDefined();
    });
});
