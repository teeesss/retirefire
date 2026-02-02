import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../../src/engine/SimulationEngine.js';

describe('Gap Year & Early Withdrawal Logic', () => {

    const baseConfig = {
        startYear: 2025,
        startAge: 45, // Gap year age
        endYear: 2026,
        settings: {
            personal: { retireAge: 65 },
            income: { work: 0, growth: 0 }, // No income = Gap Year
            expenses: { annualSpending: 50000, phases: [] },
            assets: {
                retirement: 0,
                roth: 0,
                investments: 0,
                cash: 0,
                hsa: 0
            },
            taxSettings: { filingStatus: 'single', state: 'TX' }, // TX = No state tax
            taxes: { withdrawalStrategy: 'proportional' } // Should be overridden by gap year logic
        }
    };

    it('should prioritize Cash and Taxable over Retirement accounts when under 59.5', () => {
        const config = JSON.parse(JSON.stringify(baseConfig));
        config.settings.assets.cash = 20000;
        config.settings.assets.investments = 30000;
        config.settings.assets.retirement = 500000; // Plenty here

        // Spending needs: $50k
        // Expect: $20k Cash + $30k Investments = $50k. Retirement untouched.

        // Mock project (using 1 year)
        const result = SimulationEngine.project(config, 'average');

        // Results are column-based arrays
        // Check Year 0 (Index 0)

        expect(result.drawdown.CashSavings[0]).toBe(20000);
        expect(result.drawdown.Investments[0]).toBe(30000);
        expect(result.drawdown.RetirementSavings[0]).toBe(0); // Should trigger 0 penalty
        expect(result.taxes.Penalty[0]).toBe(0);
    });

    it('should prioritize Roth over Traditional when under 59.5 to avoid penalty', () => {
        const config = JSON.parse(JSON.stringify(baseConfig));
        config.settings.assets.cash = 0;
        config.settings.assets.investments = 0;
        config.settings.assets.roth = 50000;
        config.settings.assets.retirement = 500000;

        // Spending needs: 50k
        // Expect: Roth drained. Traditional untouched (if possible).

        const result = SimulationEngine.project(config, 'average');

        expect(result.drawdown.RothIRA[0]).toBe(50000); // Prioritized
        expect(result.drawdown.RetirementSavings[0]).toBe(0);
        expect(result.taxes.Penalty[0]).toBe(0);
    });

    it('should fall back to Traditional and apply 10% penalty if liquid funds exhausted', () => {
        const config = JSON.parse(JSON.stringify(baseConfig));
        config.settings.assets.cash = 10000;
        config.settings.assets.retirement = 100000;

        // Spending: 50k. 
        // Available Cash: 10k. 
        // Need 40k from Retirement.
        // Penalty: 40k * 10% = $4000.
        // Tax: Ordinary Inc on 40k.

        const result = SimulationEngine.project(config, 'average');

        expect(result.drawdown.CashSavings[0]).toBe(10000);
        expect(result.drawdown.RetirementSavings[0]).toBeGreaterThan(0);

        // Check penalty
        const w = result.drawdown.RetirementSavings[0];
        const p = result.taxes.Penalty[0];

        // Expect penalty to be 10% of withdrawal
        // Use closeTo for float math safety usually, but these are Math.round integers
        expect(p).toBe(Math.round(w * 0.10));
        expect(w).toBeGreaterThan(39000);
    });
});
