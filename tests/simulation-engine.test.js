/**
 * Test for Simulation Engine Logic
 */
import { expect, test, describe, beforeEach } from 'vitest';
import { SimulationEngine } from '../src/engine/SimulationEngine.js';
import { config } from '../src/data/Config.js';

describe('Simulation Engine Tests', () => {
    test('SimulationEngine.run returns all scenario data', () => {
        const results = SimulationEngine.run();

        expect(results).toHaveProperty('optimistic');
        expect(results).toHaveProperty('average');
        expect(results).toHaveProperty('pessimistic');
        expect(results).toHaveProperty('years');
        expect(results).toHaveProperty('ages');

        expect(results.average.yearsCount).toBeGreaterThan(0);
        expect(results.average.income.Work.length).toBe(results.average.yearsCount);
    });

    test('SimulationEngine handles retirement age correctly', () => {
        const scenario = 'average';
        const results = SimulationEngine.project(config, scenario);
        const retireAge = config.settings.personal.retireAge;
        const startAge = config.startAge;
        const retireIdx = retireAge - startAge;

        if (retireIdx >= 0 && retireIdx < results.yearsCount) {
            // Work income should be 0 or small after retirement age (depending on growth/rounding)
            // Actually, in our engine, work income stops at retireAge
            expect(results.income.Work[retireIdx]).toBe(0);
        }
    });
});
