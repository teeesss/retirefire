/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExplorerHandler } from '../../src/ui/ExplorerHandler.js';
import { config } from '../../src/data/Config.js';
import { SimulationEngine } from '../../src/engine/SimulationEngine.js';

// Mock dependencies
vi.mock('../../src/main.js', () => ({
    recalculate: vi.fn()
}));
vi.mock('../../src/engine/SimulationEngine.js', () => ({
    SimulationEngine: {
        project: vi.fn(() => ({ years: [], accounts: { Investments: [] }, yearsCount: 0 })),
        _projectWithVariableReturns: vi.fn(() => ({ years: [], accounts: { Investments: [] }, yearsCount: 0 })),
        run: vi.fn()
    }
}));

// Mock rawData or DataUtils if needed
vi.mock('../../src/data/Store.js', () => ({
    rawData: {
        years: [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032],
        ages: [60, 61, 62, 63, 64, 65, 66, 67],
        average: { netWorth: [100, 200, 300, 400, 500, 600, 700, 800] }
    }
}));

describe('ExplorerHandler', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="spendingValue"></div>
            <div id="spendingMonthly"></div>
            <div id="spending25x"></div>
            <div id="spendingImpact"></div>
        `;
        config.settings = {
            expenses: { annualSpending: 90000 },
            personal: { age: 60, retireAge: 65 }
        };
        window.recalculate = vi.fn();
    });

    it('should update spending and calculate impact string (positive)', () => {
        ExplorerHandler.updateSpending(100000);
        expect(config.settings.expenses.annualSpending).toBe(100000);
        expect(document.getElementById('spendingImpact').textContent).toContain('+');
        expect(window.recalculate).toHaveBeenCalled();
    });

    it('should update spending and calculate impact string (negative)', () => {
        ExplorerHandler.updateSpending(80000);
        expect(config.settings.expenses.annualSpending).toBe(80000);
        expect(document.getElementById('spendingImpact').textContent).not.toContain('+');
        expect(window.recalculate).toHaveBeenCalled();
    });

    it('should handle crash55 scenario via SimulationEngine', () => {
        const btn = document.createElement('button');
        // Setup rawData mock in test if strictly needed, or rely on global mock.
        // We need to ensure _projectWithVariableReturns is called.

        ExplorerHandler._runWhatIfInternal('crash55', btn);

        // Should call _projectWithVariableReturns because age 60 < 55 is false... wait.
        // Test config set age to 60. Crash at 55 is in the past.
        // If in past, it calls project(). 
        // Let's set age to 50 so 55 is in future.
        config.settings.personal.age = 50;

        // Re-call
        ExplorerHandler._runWhatIfInternal('crash55', btn);

        // Since we are mocking SimulationEngine, we check calls
        expect(SimulationEngine._projectWithVariableReturns).toHaveBeenCalled();
        expect(btn.classList.contains('highlight')).toBe(true);
    });

    it('should handle healthcare scenario by adding separate event', () => {
        const btn = document.createElement('button');
        config.settings.personal.age = 50;

        ExplorerHandler._runWhatIfInternal('healthcare', btn);

        // This calls SimulationEngine.project but with modified config.
        expect(SimulationEngine.project).toHaveBeenCalled();

        // Verify the config passed has event
        // const callArgs = SimulationEngine.project.mock.calls[0][0]; // 1st arg of 1st call
        // Actually earlier calls might exist. Let's get the last call.
        const lastCallArgs = SimulationEngine.project.mock.lastCall[0];

        expect(lastCallArgs.events).toBeDefined();
        if (lastCallArgs.events) {
            expect(lastCallArgs.events[0].type).toBe('expense');
            expect(lastCallArgs.events[0].amount).toBe(250000);
        }
    });
});
