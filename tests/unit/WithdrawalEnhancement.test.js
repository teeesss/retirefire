import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../../src/engine/SimulationEngine.js';

const mockConfig = {
    startYear: 2026,
    startAge: 60,
    endYear: 2030,
    settings: {
        personal: { age: 60, retireAge: 60, longevity: 95 },
        assets: {
            retirement: 1000000,
            roth: 0,
            hsa: 0,
            investments: 0,
            cash: 0
        },
        income: { work: 0 },
        expenses: { annualSpending: 100000 },
        taxSettings: { filingStatus: 'single', state: 'FL' },
        rates: { average: 0 },
        inflation: { average: 0 },
        taxes: { withdrawalStrategy: 'grow_tax_deferred' }
    }
};

describe('Withdrawal Enhancement Verification', () => {
    it('should show granular account drawdowns in the income results', () => {
        const results = SimulationEngine.project(mockConfig, 'average');

        // Year 0 should have retirement withdrawal to cover 100k
        expect(results.income.RetirementSavingsDrawdown[0]).toBeGreaterThanOrEqual(100000);
        expect(results.income.Drawdown[0]).toBe(results.income.RetirementSavingsDrawdown[0]);

        // Verify other keys exist and are 0 in this specific case
        expect(results.income.InvestmentsDrawdown[0]).toBe(0);
        expect(results.income.RothIRADrawdown[0]).toBe(0);
        expect(results.income.HSADrawdown[0]).toBe(0);
        expect(results.income.CashSavingsDrawdown[0]).toBe(0);
    });

    it('should track associated tax leakage correctly', () => {
        const results = SimulationEngine.project(mockConfig, 'average');

        // RetirementSavingsDrawdown triggers tax
        const drawdownAmt = results.income.RetirementSavingsDrawdown[0];
        const taxAmt = results.drawdown.RetirementSavingsTax[0];

        expect(drawdownAmt).toBeGreaterThan(0);
        expect(taxAmt).toBeGreaterThan(0);

        // Effective rate check
        const effectiveRate = taxAmt / drawdownAmt;
        expect(effectiveRate).toBeGreaterThan(0.05);
        expect(effectiveRate).toBeLessThan(0.30);
    });
});
