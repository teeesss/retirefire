import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../../src/engine/SimulationEngine.js';

const mockConfig = {
    startYear: 2026,
    startAge: 60,
    endYear: 2026, // Just 1 year
    settings: {
        personal: { age: 60, retireAge: 60, longevity: 95 },
        assets: {
            retirement: 1000000,
            roth: 0,
            hsa: 0,
            investments: 0,
            cash: 0,
            otherAssets: 0
        },
        income: {
            work: 0,
            growth: 0,
            contribution401k: 0,
            employerMatch: 0,
            rothContrib: 0,
            hsaContrib: 0
        },
        socialSecurity: { ss67: 30000, claimAge: 67 },
        expenses: { annualSpending: 50000 },
        taxSettings: { filingStatus: 'single', state: 'FL' },
        rates: { average: 0 },
        inflation: { average: 0 },
        taxes: { withdrawalStrategy: 'grow_tax_deferred' }
    }
};

describe('Tax Aggregation Verification', () => {
    it('should include drawdown taxes in the total tax expense', () => {
        const results = SimulationEngine.project(mockConfig, 'average');

        // Income is $0 work, SS hasn't started. (Age 60 < 67)
        // Benefit@67 is $30k, so at 60 it is 0.
        // Deficit = $50k spending + base taxes.
        // Base taxes should be 0 (no income).
        // Drawdown will be ~$50k from RetirementSavings (401k).
        // $50k 401k withdrawal should trigger ordinary income tax.

        const totalTaxExpense = results.expenses.Taxes[0];
        const detailedFedTax = results.taxes.Federal[0];
        const drawdownTax = results.drawdown.RetirementSavingsTax[0];

        console.log(`[DEBUG] Total Tax Expense: ${totalTaxExpense}`);
        console.log(`[DEBUG] Detailed Fed Tax: ${detailedFedTax}`);
        console.log(`[DEBUG] Drawdown Tax: ${drawdownTax}`);

        // If current logic is flawed, detailedFedTax will be 0 while drawdownTax is > 0.
        // We want totalTaxExpense to equal detailedFedTax + CapGains + FICA + State
        // and detailedFedTax should include the tax from drawing down RetirementSavings.

        expect(drawdownTax).toBeGreaterThan(0);
        expect(detailedFedTax).toBeGreaterThan(0);
        expect(totalTaxExpense).toBe(detailedFedTax); // (FICA/State/CG are 0 in this mock)
    });
});
