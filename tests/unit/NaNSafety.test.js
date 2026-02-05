import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../../src/engine/SimulationEngine.js';

describe('NaN Safety', () => {
    it('should handle minimal config without NaN', () => {
        const minimalConfig = {
            startYear: 2026,
            endYear: 2071,
            startAge: 50,
            settings: {
                assets: {},
                income: {},
                expenses: {},
                taxSettings: { filingStatus: 'joint', state: 'none' },
                rates: { average: 7.0 },
                inflation: { average: 2.5 },
                taxes: { rothConversionEnabled: false }
            }
        };

        const result = SimulationEngine.project(minimalConfig, 'average');

        result.netWorth.forEach((nw, _i) => {
            expect(isNaN(nw)).toBe(false);
            expect(isFinite(nw)).toBe(true);
        });
    });

    it('should handle missing nested properties gracefully', () => {
        const partialConfig = {
            startYear: 2026,
            endYear: 2030,
            startAge: 50,
            settings: {
                // Missing many nested properties
                taxSettings: { filingStatus: 'joint' }
            }
        };

        expect(() => {
            SimulationEngine.project(partialConfig, 'average');
        }).not.toThrow();
    });

    it('should not produce NaN with extreme inputs', () => {
        const extremeConfig = {
            startYear: 2026,
            endYear: 2030,
            startAge: 50,
            settings: {
                assets: { retirement: 1e12 }, // Trillion dollars
                income: { work: 1e9 },       // Billion dollar salary
                expenses: { annualSpending: 1e9 },
                rates: { average: 100 },      // 100% growth
                inflation: { average: 50 },    // 50% inflation
                taxSettings: { filingStatus: 'single' }
            }
        };

        const result = SimulationEngine.project(extremeConfig, 'average');
        result.netWorth.forEach(nw => expect(isNaN(nw)).toBe(false));
    });
});
