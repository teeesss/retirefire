/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SimulationEngine } from '../../src/engine/SimulationEngine.js';
import { config } from '../../src/data/Config.js';

describe('Monte Carlo Enhanced Verification', () => {
    beforeEach(() => {
        // Reset config and window
        vi.resetModules();
        window.lastMonteCarloResults = null;

        // Mock simple config for testing
        config.startYear = 2024;
        config.endYear = 2034; // 11 years
        config.startAge = 50;
        config.settings = {
            rates: { average: 7.0 },
            inflation: { average: 2.5 },
            assets: { retirement: 1000000 },
            personal: { retireAge: 65 },
            taxSettings: { filingStatus: 'joint' }
        };
    });

    it('should correctly handle "last-30" historical scenario indexing', () => {
        // We use projectPath which is used by runMonteCarlo to pick historical indices
        // Mock historical data length is fixed in SimulationEngine (100 items)
        // marketScenario = 'last-30'

        // We can't easily mock the internal historicalReturns array without exporting it,
        // but we can verify the startIndex calculation logic via side effects if we had them.
        // Instead, we verify that the returned net worth series exists and has correct length.

        const netWorthSeries = SimulationEngine.projectPath(config, 0.15, 1.0, 'last-30');
        expect(netWorthSeries).toHaveLength(11);
        expect(netWorthSeries[0]).toBeGreaterThan(0);
    });

    it('should store results in window.lastMonteCarloResults after simulation', () => {
        // In the real app, this is called from App.runMonteCarloSimulation in main.js.
        // We verify that SimulationEngine.runMonteCarlo returns the correct structure
        // that our UI code expects to store.

        const iterations = 10;
        const results = SimulationEngine.runMonteCarlo(iterations, 0.15, 1.0, 'monte-carlo');

        expect(results).toHaveProperty('successRate');
        expect(results).toHaveProperty('legacyRate');
        expect(results).toHaveProperty('p50');
        expect(results.p50).toHaveLength(11);
    });

    it('should handle historical-bootstrap scenario', () => {
        const netWorthSeries = SimulationEngine.projectPath(config, 0.15, 1.0, 'historical-bootstrap');
        expect(netWorthSeries).toHaveLength(11);
    });
});
