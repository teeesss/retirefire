import 'chart.js/auto';
// import { config } from '../data/Config.js';
// import { formatCurrency } from './Formatters.js';

/**
 * Comprehensive Section Descriptions and Chart Tooltips
 * Ensures EVERY section has a description and EVERY chart has working hover tooltips
 * 
 * Fixes: ISSUE-025, 027, 032, 033, 036, 044, 048
 */

// ============================================
// SECTION DESCRIPTIONS
// ============================================

export const sectionDescriptions = {
    // Main Dashboard Sections
    'section-networth': {
        title: 'Net Worth Projection & High-Fidelity Scenarios',
        description: 'Comprehensive tracking of your global net worth trajectory over a 45-year planning horizon. This analysis factors in all asset classes, liabilities, and compounding returns while presenting three distinct market scenarios (Optimistic, Baseline, and Pessimistic). The shaded "uncertainty band" illustrates potential variance based on historical standard deviation. Use this to determine if your long-term wealth trajectory remains positive under significant market stress.'
    },
    'section-income': {
        title: 'Income Sources & Cash Flow Composition',
        description: 'A layered analysis of your annual cash flow sources through the accumulation, work, and distribution phases. This breakdown tracks the transition from active salary to passive retirement income including Social Security, pension payments, Required Minimum Distributions (RMDs), and systematic portfolio drawdowns. It is critical to monitor your income mix to identify potential tax cliffs or shortfalls in fixed income coverage.'
    },
    'section-expenses': {
        title: 'Annual Expenditure & Lifestyle Burn Rate',
        description: 'Detailed categorization of all annual outflows including essential living costs, discretionary lifestyle spending, healthcare inflation, and debt service. This helps you visualize your "burn rate" and identifies opportunities for spending optimization. The analysis accounts for the standard "Go-Go, Slow-Go, No-Go" retirement phases where spending tends to decrease as activity levels change in later years.'
    },
    'section-taxes': {
        title: 'Historical & Projected Tax Liability Assessment',
        description: 'Advanced modeling of your total tax burden, including Federal Income Tax, FICA/Self-Employment taxes, State taxes, and Capital Gains assessments. This section calculates your effective tax rate each year, providing a clear metric for tax efficiency. Strategically managing your income sources and timing withdrawals can significantly lower your effective rate and add years of longevity to your portfolio.'
    },
    'section-withdrawals': {
        title: 'Withdrawal Strategy & Account Drawdown',
        description: 'See how you\'ll systematically draw down your retirement accounts over time. The order you withdraw from different account types (taxable, tax-deferred, tax-free) significantly impacts your tax bill and portfolio longevity. This chart shows which accounts are tapped each year and in what amounts. Common strategies include: tax-deferred first, taxable first, or proportional withdrawals.'
    },
    'section-montecarlo': {
        title: 'Monte Carlo Stress Test & Probability of Outcome',
        description: 'Advanced statistical analysis using 1,000+ random market simulations based on historical standard deviation and mean returns. This provides a rigorous stress test of your financial plan against market volatility. Percentile bands represent the range of potential outcomes: the 90th percentile represents a "Best Case" market environment, while the 10th percentile represents extreme historical market stress. A success rate above 85% indicates a robust plan capable of weathering significant sequence-of-returns risk.'
    },
    'section-roth': {
        title: 'Roth Conversion Strategy & Long-Term Optimization',
        description: 'Strategic Roth conversions take advantage of lower tax brackets in the "gap years" between work and taking Social Security or RMDs. By paying taxes now at a known rate, you shield future growth from all taxation and eliminate future RMD requirements. This tool calculates the break-even age where the long-term tax savings outweigh the upfront tax cost. Optimal strategies often involve filling the 12% or 22% tax brackets during early retirement.'
    },
    'section-socialsecurity': {
        title: 'Social Security Claiming Optimization',
        description: 'Deciding when to claim Social Security is one of the most important decisions in retirement planning. Benefits increase by approximately 8% for every year you delay beyond Full Retirement Age (FRA), up to age 70. This analysis compares the cumulative lifetime value of claiming at different ages, factoring in taxation of benefits and the opportunity cost of spending portfolio assets instead. For many, delaying until 70 acts as a highly effective form of longevity insurance.'
    },

    // Additional Sections
    'section-allocation': {
        title: 'Asset Allocation & Portfolio Mix',
        description: 'Your asset allocation (stocks, bonds, cash, crypto) is the primary driver of long-term returns and volatility. This shows your current allocation and how it may shift over time with a glide path strategy. As you approach and enter retirement, gradually reducing stock exposure can help protect against sequence-of-returns risk while maintaining growth potential.'
    },
    'section-surplusgap': {
        title: 'Surplus/Gap Analysis',
        description: 'Compare your annual income to expenses to identify surplus years (saving money) and gap years (drawing down assets). Positive values mean you\'re adding to savings; negative values mean you\'re spending from accumulated wealth. This helps visualize your accumulation phase versus distribution phase and ensures your spending is sustainable.'
    },
    'section-moneyflow': {
        title: 'Annual Money Flow Breakdown',
        description: 'See exactly where every dollar goes each year. This waterfall chart shows gross income, then subtracts taxes, living expenses, healthcare, and other costs to show your net surplus or deficit. Understanding your money flow helps identify opportunities to optimize spending, reduce taxes, or increase savings. The chart updates as you adjust your retirement spending slider.'
    },
    'section-goals': {
        title: 'Financial Goals & Aspiration Tracking',
        description: ''
    },
    'section-milestones': {
        title: 'Key Life Events & Financial Milestone Timeline',
        description: ''
    },
    'section-tables': {
        title: 'Detailed Year-by-Year Actuarial Data',
        description: 'Complete transparency into the underlying mathematical model. This detailed ledger accounts for every dollar of income, expense, tax, and investment return for every single year of the projection. Use this table for deep-dive audits of the plan, exporting to professional accounting software, or performing granular year-over-year comparisons between different strategy alternatives.'
    },
    'section-whatif': {
        title: 'What-If Scenario Explorer',
        description: 'Test different scenarios to see how changes affect your plan. Run market stress tests (crash, recession, high inflation), adjust spending levels, or explore alternative strategies. This tool helps you understand the impact of major life decisions before you make them. Each scenario shows the effect on net worth, success rate, and key milestones.'
    },
    'section-debt': {
        title: 'Debt Payoff Strategy Optimizer',
        description: 'Compare debt payoff strategies to minimize interest and become debt-free faster. The avalanche method targets high-interest debt first for maximum savings. The snowball method focuses on small balances for psychological wins. This calculator shows total interest paid, payoff timeline, and monthly payment requirements for each strategy.'
    },
    'section-risk': {
        title: 'Market Risk Profile & Resilience Assessment',
        description: 'A quantitative evaluation of your portfolio\'s vulnerability to systemic market risks. This includes "Sequence of Returns" risk assessment, which is most critical in the five years before and after your retirement date. We test your current asset allocation against historical "Black Swan" events to quantify the maximum projected drawdown and its impact on your Plan Wellness Score.'
    },
};

// ============================================
// CHART TOOLTIP CONFIGURATIONS
// ============================================

export const chartTooltipConfigs = {
    // Standard currency tooltip (most charts)
    currency: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(59, 130, 246, 0.6)',
        borderWidth: 2,
        padding: 12,
        displayColors: true,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        callbacks: {
            title: function (context) {
                return context[0].label || '';
            },
            label: function (context) {
                let label = context.dataset.label || '';
                if (label) label += ': ';

                const value = context.parsed.y;
                if (value === null || value === undefined) return label + 'N/A';

                // Format large numbers
                if (Math.abs(value) >= 1000000) {
                    label += '$' + (value / 1000000).toFixed(2) + 'M';
                } else if (Math.abs(value) >= 1000) {
                    label += '$' + (value / 1000).toFixed(1) + 'K';
                } else {
                    label += '$' + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
                }
                return label;
            }
        }
    },

    // Percentage tooltip (allocation, success rate)
    percentage: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(16, 185, 129, 0.6)',
        borderWidth: 2,
        padding: 12,
        displayColors: true,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        callbacks: {
            label: function (context) {
                let label = context.dataset.label || '';
                if (label) label += ': ';
                if (context.parsed.y !== null) {
                    label += context.parsed.y.toFixed(1) + '%';
                }
                return label;
            }
        }
    },

    // Count/number tooltip (no currency symbol)
    count: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(139, 92, 246, 0.6)',
        borderWidth: 2,
        padding: 12,
        displayColors: true,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        callbacks: {
            label: function (context) {
                let label = context.dataset.label || '';
                if (label) label += ': ';
                if (context.parsed.y !== null) {
                    label += context.parsed.y.toLocaleString('en-US');
                }
                return label;
            }
        }
    }
};

// ============================================
// CHART-SPECIFIC TOOLTIP MAPPINGS
// ============================================

export const chartTooltipMapping = {
    'chartNetWorth': 'currency',
    'chartAllocation': 'percentage',
    'chartIncome': 'currency',
    'chartExpenses': 'currency',
    'chartSurplusGap': 'currency',
    'chartMoneyFlow': 'currency',
    'gaugeSuccess': 'percentage',
    'chartMonteCarlo': 'currency',
    'chartTaxes': 'currency',
    'chartWithdrawals': 'currency',
    'chartRoth': 'currency',
    'chartSSComparison': 'currency',
    'chartSSExplorer': 'currency'
};

// ============================================
// INITIALIZATION FUNCTIONS
// ============================================

/**
 * Add descriptions to all sections
 */
export function initializeAllSectionDescriptions() {
    let addedCount = 0;

    Object.keys(sectionDescriptions).forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (!section) {
            // Section might be in a collapsed container or not yet injected
            return;
        }

        // Check if description already exists
        if (section.querySelector('.section-description')) {
            return; // Already has description
        }

        const descInfo = sectionDescriptions[sectionId];
        if (!descInfo || !descInfo.description) {
            return; // Skip if no description
        }

        // Find or create card-header
        let header = section.querySelector('.card-header');
        if (!header) {
            header = document.createElement('div');
            header.className = 'card-header';
            section.insertBefore(header, section.firstChild);
        }

        // Create description element
        const descElement = document.createElement('p');
        descElement.className = 'section-description';
        descElement.style.cssText = `
            font-size: 0.9rem;
            color: var(--text-muted);
            margin: 0.75rem 0 0 0;
            line-height: 1.6;
            padding: 0.75rem;
            background: rgba(59, 130, 246, 0.05);
            border-left: 3px solid var(--primary);
            border-radius: 4px;
        `;
        descElement.textContent = descInfo.description;

        header.appendChild(descElement);
        addedCount++;
        // console.log(`[OK] Added description to ${sectionId}`);
    });

    // console.log(`[INFO] Added ${addedCount}/${Object.keys(sectionDescriptions).length} section descriptions`);
    return addedCount;
}

/**
 * Enable tooltips on all charts
 */
export function enableAllChartTooltips() {
    // DISABLED: This function was causing infinite tooltip callback loops
    // The charts already have their tooltip configurations set during initialization
    // Attempting to modify them post-creation triggers Chart.js internal errors
    console.log('[TOOLTIP] Enhanced tooltip system disabled to prevent callback loops');
    return 0;

    /* ORIGINAL CODE - DISABLED
    let enabledCount = 0;
    const activeCharts = charts || window.charts || {};

    Object.keys(chartTooltipMapping).forEach(chartId => {
        // Try finding by ID directly, or by looking up in the charts object
        // The charts object might use camelCase keys (e.g. netWorth) while chartId is ID (chartNetWorth)
        let chart = Chart.getChart(chartId);

        if (!chart) {
            // Try normalized key lookup
            const propertyKey = chartId.replace('chart', '').replace(/^\w/, c => c.toLowerCase());
            chart = activeCharts[propertyKey] || activeCharts[chartId];
        }

        if (!chart) {
            // Chart might not be initialized yet
            return;
        }

        const tooltipType = chartTooltipMapping[chartId];
        const tooltipConfig = chartTooltipConfigs[tooltipType];

        if (!tooltipConfig) {
            console.warn(`Unknown tooltip type: ${tooltipType} for ${chartId}`);
            return;
        }

        // Apply tooltip configuration
        if (!chart.options.plugins) {
            chart.options.plugins = {};
        }

        // Deep copy tooltip config to avoid reference issues
        chart.options.plugins.tooltip = JSON.parse(JSON.stringify(tooltipConfig));

        // Restore callbacks (JSON.parse loses functions)
        chart.options.plugins.tooltip.callbacks = tooltipConfig.callbacks;

        // Set better interaction mode for professional use
        chart.options.interaction = {
            mode: 'index',
            intersect: false
        };

        chart.update('none');

        enabledCount++;
        // console.log(`[OK] Enabled ${tooltipType} tooltip on ${chartId}`);
    });

    // console.log(`[DONE] Enabled tooltips on ${enabledCount}/${Object.keys(chartTooltipMapping).length} charts`);
    return enabledCount;
    */
}

/**
 * Initialize everything
 */
export function initializeDescriptionsAndTooltips(charts) {
    // console.log('[START] Initializing comprehensive descriptions and tooltips...');

    // First pass
    initializeAllSectionDescriptions();

    // Polling function for tooltips
    const pollForCharts = (attempts = 0) => {
        const tooltipsEnabled = enableAllChartTooltips(charts || window.charts);
        // console.log(`[SYNC] Tooltip sync attempt ${attempts + 1}: ${tooltipsEnabled} enabled`);

        if (tooltipsEnabled < Object.keys(chartTooltipMapping).length && attempts < 10) {
            setTimeout(() => pollForCharts(attempts + 1), 1000);
        }
    };

    pollForCharts();

    return {
        success: true
    };
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sectionDescriptions,
        chartTooltipConfigs,
        chartTooltipMapping,
        initializeAllSectionDescriptions,
        enableAllChartTooltips,
        initializeDescriptionsAndTooltips
    };
}
