/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as SummaryCharts from '../../src/charts/SummaryCharts.js';
import * as AccountCharts from '../../src/charts/AccountCharts.js';
import * as AnalysisCharts from '../../src/charts/AnalysisCharts.js';
import * as ExplorerCharts from '../../src/charts/ExplorerCharts.js';
import * as IncomeExpenseCharts from '../../src/charts/IncomeExpenseCharts.js';
import * as TaxCharts from '../../src/charts/TaxCharts.js';
import { charts } from '../../src/state/ChartStore.js';

// Mock chart.js to avoid canvas errors in JSDOM
vi.mock('chart.js/auto', () => {
    return {
        default: vi.fn().mockImplementation(function (ctx, config) {
            this.ctx = ctx;
            this.config = config;
            this.data = config.data || { datasets: [] };
            this.options = config.options || { plugins: { tooltip: {} } };
            // Ensure nested plugins exist for easier testing
            if (!this.options.plugins) this.options.plugins = {};
            if (!this.options.plugins.tooltip) this.options.plugins.tooltip = { enabled: true };

            this.update = vi.fn();
            this.destroy = vi.fn();
            return this;
        })
    };
});

// Mock ChartHelpers to provide valid contexts
vi.mock('../../src/charts/ChartHelpers.js', () => ({
    getSafeCtx: (id) => ({ id }),
    validateData: () => true
}));

// Mock Data
vi.mock('../../src/data/Store.js', () => {
    const years = [2026, 2027, 2028];
    const ages = [50, 51, 52];
    return {
        rawData: {
            years,
            ages,
            average: {
                years,
                ages,
                income: { Work: [100, 100, 100], SocialSecurity: [0, 0, 0], RMD: [0, 0, 0], Drawdown: [0, 0, 0] },
                taxes: { Federal: [10, 10, 10], CapGains: [0, 0, 0], FICA: [5, 5, 5], State: [2, 2, 2] },
                expenses: { Taxes: [17, 17, 17], General: [50, 50, 50], Housing: [20, 20, 20], Medical: [5, 5, 5], LTC: [0, 0, 0] },
                drawdown: { RetirementSavings: [0, 0, 0], Investments: [0, 0, 0], RothIRA: [0, 0, 0] },
                netWorth: [1000, 1100, 1200],
                accounts: {
                    RetirementSavings: [500, 550, 600],
                    Investments: [300, 310, 320],
                    RothIRA: [200, 210, 220],
                    Debt: [-200, -190, -180]
                }
            },
            optimistic: { years, netWorth: [1000, 1200, 1400], accounts: { Debt: [0, 0, 0] }, income: { Work: [] }, expenses: { Taxes: [] } },
            pessimistic: { years, netWorth: [1000, 1050, 1100], accounts: { Debt: [0, 0, 0] }, income: { Work: [] }, expenses: { Taxes: [] } },
            baseline: { years, netWorth: [1000, 1100, 1200], expenses: { Taxes: [17, 17, 17] } }
        },
        updateRawData: vi.fn()
    };
});

vi.mock('../../src/data/Config.js', () => ({
    config: {
        currentScenario: 'average',
        settings: {
            taxes: { rothConversionEnabled: false },
            glidePath: { stocks: 60, bonds: 30, cash: 10, crypto: 0 },
            taxSettings: { filingStatus: 'joint' },
            socialSecurity: { claimAge: 67 }
        },
        goals: []
    }
}));

describe('Chart Tooltip Configuration Validation', () => {
    beforeEach(() => {
        // Clear charts object
        Object.keys(charts).forEach(key => delete charts[key]);
    });

    it('should have tooltips configured for all Summary charts', () => {
        SummaryCharts.initNetWorthChart();
        SummaryCharts.initMoneyFlowChart();
        SummaryCharts.initRealNominalChart();
        SummaryCharts.initStackedPortfolioChart();

        const summaryCharts = ['netWorth', 'moneyFlow', 'realNominal', 'stackedPortfolio'];
        summaryCharts.forEach(id => {
            expect(charts[id]).toBeDefined();
            expect(charts[id].options.plugins.tooltip).toBeDefined();
            expect(charts[id].options.plugins.tooltip.enabled).toBe(true);
        });
    });

    it('should have tooltips configured for all Account charts', () => {
        AccountCharts.initAccountTrendsChart();
        AccountCharts.initMortgageChart();
        AccountCharts.initDebtPayoffChart();

        const accountCharts = ['accountTrends', 'mortgage', 'debtPayoff'];
        accountCharts.forEach(id => {
            expect(charts[id]).toBeDefined();
            expect(charts[id].options.plugins.tooltip).toBeDefined();
            expect(charts[id].options.plugins.tooltip.enabled).toBe(true);
        });
    });

    it('should have tooltips configured for all Analysis charts', () => {
        AnalysisCharts.initMonteCarloChart();
        AnalysisCharts.initLegacyChart();
        AnalysisCharts.initSequenceRiskChart();
        AnalysisCharts.initLifetimeCashFlowChart();
        AnalysisCharts.initScenarioComparisonChart();

        const analysisCharts = ['monteCarlo', 'legacy', 'sequenceRisk', 'lifetimeCashFlow', 'scenarioComparison'];
        analysisCharts.forEach(id => {
            expect(charts[id]).toBeDefined();
            expect(charts[id].options.plugins.tooltip).toBeDefined();
            expect(charts[id].options.plugins.tooltip.enabled).toBe(true);
        });
    });

    it('should have tooltips configured for all Explorer charts', () => {
        ExplorerCharts.initSSExplorerChart();
        ExplorerCharts.initRothExplorerChart();
        ExplorerCharts.initRothTaxImpactChart();
        ExplorerCharts.initWhatIfChart();
        ExplorerCharts.initMarketRiskChart();

        const explorerCharts = ['ssExplorer', 'rothExplorer', 'rothTaxImpact', 'whatIf', 'marketRisk'];
        explorerCharts.forEach(id => {
            expect(charts[id]).toBeDefined();
            expect(charts[id].options.plugins.tooltip).toBeDefined();
            expect(charts[id].options.plugins.tooltip.enabled).toBe(true);
        });
    });

    it('should have tooltips configured for all Income/Expense charts', () => {
        IncomeExpenseCharts.initIncomeChart();
        IncomeExpenseCharts.initExpensesChart();
        IncomeExpenseCharts.initHealthcareChart();
        IncomeExpenseCharts.initSSComparisonChart();
        IncomeExpenseCharts.initIncomeReplacementChart();
        IncomeExpenseCharts.initSurplusGapChart();

        const ieCharts = ['income', 'expenses', 'healthcare', 'ssComparison', 'incomeReplacement', 'surplusGap'];
        ieCharts.forEach(id => {
            expect(charts[id]).toBeDefined();
            expect(charts[id].options.plugins.tooltip).toBeDefined();
            expect(charts[id].options.plugins.tooltip.enabled).toBe(true);
        });
    });

    it('should have tooltips configured for all Tax charts', () => {
        TaxCharts.initTaxesChart();
        TaxCharts.initEffectiveTaxChart();
        TaxCharts.initRothConversionChart();
        TaxCharts.initCumulativeTaxChart();
        TaxCharts.initTaxBracketChart();
        TaxCharts.initWithdrawalChart();
        TaxCharts.initSWRChart();
        TaxCharts.initRMDChart();

        const taxCharts = ['taxes', 'effectiveTax', 'rothConversion', 'cumulativeTax', 'taxBracket', 'withdrawal', 'swr', 'rmd'];
        taxCharts.forEach(id => {
            expect(charts[id]).toBeDefined();
            expect(charts[id].options.plugins.tooltip).toBeDefined();
            expect(charts[id].options.plugins.tooltip.enabled).toBe(true);
        });
    });
});
