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
        title: 'Net Worth Projection',
        description: 'Track your total wealth over time across all scenarios. This chart shows how your assets minus liabilities grow from now through retirement and beyond. Compare optimistic, average, and pessimistic projections to understand your financial trajectory under different market conditions. The shaded areas represent the range of possible outcomes based on historical market volatility.'
    },
    'section-income': {
        title: 'Income Sources Over Time',
        description: 'Visualize where your money comes from each year throughout your lifetime. See the transition from work income to Social Security, Required Minimum Distributions (RMDs), and portfolio withdrawals. Understanding your income mix helps you plan for tax optimization and ensures sustainable cash flow throughout retirement. The stacked area chart shows how different income sources contribute to your total annual income.'
    },
    'section-expenses': {
        title: 'Expense Categories Breakdown',
        description: 'Monitor your spending across major categories including living expenses, healthcare, housing, taxes, and discretionary spending. This breakdown helps identify areas for optimization and ensures your retirement budget aligns with your lifestyle goals. Notice how expenses may change over time with the "Go-Go, Slow-Go, No-Go" phases of retirement.'
    },
    'section-taxes': {
        title: 'Tax Burden Analysis',
        description: 'Understand your tax liability over time, broken down by federal income tax, FICA (Social Security and Medicare), capital gains, and state taxes. Strategic tax planning can save hundreds of thousands over your lifetime. Use this analysis to optimize withdrawal strategies, Roth conversions, and timing of income recognition. The chart shows both your effective tax rate and total tax dollars paid each year.'
    },
    'section-withdrawals': {
        title: 'Withdrawal Strategy & Account Drawdown',
        description: 'See how you\'ll systematically draw down your retirement accounts over time. The order you withdraw from different account types (taxable, tax-deferred, tax-free) significantly impacts your tax bill and portfolio longevity. This chart shows which accounts are tapped each year and in what amounts. Common strategies include: tax-deferred first, taxable first, or proportional withdrawals.'
    },
    'section-roth': {
        title: 'Roth Conversion Strategy & Optimizer',
        description: 'Roth conversions can dramatically reduce lifetime taxes by moving money from tax-deferred accounts (like traditional 401k/IRA) to tax-free Roth accounts during low-income years. This analysis shows the optimal conversion amount, upfront tax cost, long-term tax savings, and break-even age for your specific situation. The interactive controls let you compare different conversion strategies and see the impact on your overall plan.'
    },
    'section-socialsecurity': {
        title: 'Social Security Claiming Strategy',
        description: 'When you claim Social Security dramatically affects your lifetime benefits. Claiming at 62 gives you money sooner but at a permanently reduced rate (about 70% of full benefit). Waiting until 70 maximizes monthly benefits (about 124% of full benefit). This comparison shows total lifetime value for each claiming age, accounting for longevity, taxes, and opportunity cost. The optimal age depends on your health, other income sources, and legacy goals.'
    },
    'section-montecarlo': {
        title: 'Monte Carlo Simulation & Success Probability',
        description: 'Run 1,000+ simulations with random market returns based on historical data to stress-test your plan. This shows the range of possible outcomes and your probability of success (not running out of money). The percentile bands (10th, 25th, 50th, 75th, 90th) illustrate best-case, worst-case, and most-likely scenarios. A success rate above 85% is generally considered robust. Use this to understand your plan\'s resilience to market volatility.'
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
        title: 'Financial Goals Tracking',
        description: 'Track progress toward your major financial milestones like retirement readiness, legacy targets, and specific savings goals. Each goal shows your current progress, target amount, and projected achievement date. Goals are color-coded: green (on track), yellow (needs attention), red (at risk). Use this to stay motivated and make course corrections as needed.'
    },
    'section-milestones': {
        title: 'Key Life & Financial Milestones',
        description: 'A timeline of important events in your financial journey including debt payoff, retirement date, Social Security claiming, RMD start, major purchases, and legacy planning. This helps you visualize the sequence of events and plan accordingly. Milestones are automatically calculated based on your current age, settings, and financial projections.'
    },
    'section-tables': {
        title: 'Detailed Data Tables',
        description: 'Comprehensive year-by-year breakdown of all financial data including account balances, income sources, expenses, taxes, and net worth. Use these tables to drill into specific years, export data for analysis, or verify calculations. Tables can be filtered by scenario and sorted by any column.'
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
        title: 'Market Risk Analysis & Stress Testing',
        description: 'Stress-test your portfolio against historical market conditions. See how your plan would have performed during major market events like the 2008 financial crisis, dot-com bubble, or 1970s stagflation. This helps ensure your plan can weather future storms and identifies vulnerabilities in your strategy.'
    }
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
    'chartSocialSecurity': 'currency',
    'chartMortgage': 'currency',
    'chartGoals': 'percentage',
    'chartRisk': 'percentage'
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
            console.warn(`Section not found: ${sectionId}`);
            return;
        }

        // Check if description already exists
        if (section.querySelector('.section-description')) {
            return; // Already has description
        }

        const descInfo = sectionDescriptions[sectionId];

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
        console.log(`✓ Added description to ${sectionId}`);
    });

    console.log(`📝 Added ${addedCount}/${Object.keys(sectionDescriptions).length} section descriptions`);
    return addedCount;
}

/**
 * Enable tooltips on all charts
 */
export function enableAllChartTooltips(charts) {
    let enabledCount = 0;

    Object.keys(chartTooltipMapping).forEach(chartId => {
        const chart = charts[chartId] || Chart.getChart(chartId);
        if (!chart) {
            console.warn(`Chart not found: ${chartId}`);
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
        chart.options.plugins.tooltip = tooltipConfig;
        chart.update('none'); // Update without animation

        enabledCount++;
        console.log(`✓ Enabled ${tooltipType} tooltip on ${chartId}`);
    });

    console.log(`🎯 Enabled tooltips on ${enabledCount}/${Object.keys(chartTooltipMapping).length} charts`);
    return enabledCount;
}

/**
 * Initialize everything
 */
export function initializeDescriptionsAndTooltips(charts) {
    console.log('🚀 Initializing comprehensive descriptions and tooltips...');

    const descriptionsAdded = initializeAllSectionDescriptions();
    const tooltipsEnabled = enableAllChartTooltips(charts);

    console.log(`✅ Complete: ${descriptionsAdded} descriptions, ${tooltipsEnabled} tooltips`);

    return {
        descriptionsAdded,
        tooltipsEnabled,
        success: descriptionsAdded > 0 && tooltipsEnabled > 0
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
