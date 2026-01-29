/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExplorerHandler } from '../../src/ui/ExplorerHandler.js';
import { config } from '../../src/data/Config.js';

// Mock dependencies
vi.mock('../../src/main.js', () => ({
    recalculate: vi.fn()
}));
vi.mock('../../src/engine/SimulationEngine.js', () => ({
    SimulationEngine: {
        project: () => ({ years: [], accounts: { Investments: [], RetirementSavings: [] }, yearsCount: 0 }),
        run: () => ({ optimistic: {}, average: {}, pessimistic: {}, years: [], ages: [] })
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
        config.settings = { expenses: { annualSpending: 90000 } };
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
});
