/**
 * Roth Conversion Strategy Comparison Handler
 * Handles the comparison view in the Roth Deep Dive modal
 */

import RothOptimizer from './RothOptimizer.js';
import { formatCurrency } from '../utils/formatters.js';
import { getSafeCtx } from '../charts/ChartHelpers.js';
import Chart from 'chart.js/auto';

export class RothComparison {
    static comparisonData = null;
    static sortState = {
        column: 'score',
        direction: 'desc'
    };

    /**
     * Run strategy comparison and render results
     */
    static async runComparison(params) {
        console.log('🔬 Running strategy comparison...');

        // Show loading state
        const tableBody = document.getElementById('comparisonTableBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">🔄 Analyzing strategies...</td></tr>';
        }

        // Run comparison with $10k increments
        const comparison = RothOptimizer.compareStrategies(params, {
            increment: 10000
        });

        this.comparisonData = comparison;

        // Render results
        this.renderComparisonTable(comparison);
        this.renderComparisonChart(comparison);
        this.updateRecommendation(comparison);

        console.log(`✅ Comparison complete: ${comparison.strategies.length} strategies analyzed`);
    }

    /**
     * Render comparison table
     */
    static renderComparisonTable(comparison) {
        const tableBody = document.getElementById('comparisonTableBody');
        const countEl = document.getElementById('comparisonCount');

        if (!tableBody) return;

        if (countEl) {
            countEl.textContent = comparison.strategies.length;
        }

        tableBody.innerHTML = comparison.strategies.map((strategy, index) => {
            const indicators = strategy.indicators || {};
            const breakEvenDisplay = strategy.breakEvenAge && strategy.breakEvenAge < 999
                ? `Age ${strategy.breakEvenAge}`
                : 'Never';

            const breakEvenColor = indicators.breakEvenColor === 'green' ? 'var(--success)' :
                indicators.breakEvenColor === 'yellow' ? 'var(--warning)' :
                    'var(--danger)';

            const isOptimal = strategy.amount === comparison.optimal.amount;

            // NEW: Analyze limiting factors across all years
            const limitingFactors = this.analyzeLimitingFactors(strategy.results || []);
            const limitingBadge = this.getLimitingFactorBadge(limitingFactors);

            return `
                <tr style="${isOptimal ? 'background: rgba(34, 197, 94, 0.1); border-left: 3px solid var(--success);' : ''}"
                    onclick="window.selectStrategy(${index})">
                    <td style="font-weight: 700; color: var(--text-primary);">
                        ${formatCurrency(strategy.amount)}/year
                        ${isOptimal ? ' ⭐' : ''}
                        <div style="font-size: 0.65rem; margin-top: 3px;">${limitingBadge}</div>
                    </td>
                    <td style="color: ${indicators.isHighestNW ? 'var(--success)' : 'var(--text-primary)'}; font-weight: ${indicators.isHighestNW ? '700' : '400'};">
                        ${formatCurrency(strategy.finalNetWorth || 0)}
                        ${indicators.isHighestNW ? ' 🏆' : ''}
                    </td>
                    <td style="color: ${indicators.isLowestTax ? 'var(--success)' : 'var(--text-muted)'};">
                        ${formatCurrency(strategy.totalTaxPaid || 0)}
                    </td>
                    <td style="color: ${breakEvenColor}; font-weight: ${indicators.isFastestBreakEven ? '700' : '400'};">
                        ${breakEvenDisplay}
                        ${indicators.isFastestBreakEven ? ' ⚡' : ''}
                    </td>
                    <td style="color: var(--text-muted);">
                        ${formatCurrency(strategy.finalRothBalance || 0)}
                    </td>
                    <td style="font-weight: 700; color: ${strategy.score >= 80 ? 'var(--success)' : strategy.score >= 60 ? 'var(--warning)' : 'var(--text-muted)'};">
                        ${strategy.score}/100
                    </td>
                    <td>
                        <button class="btn-sm" onclick="window.viewStrategyDetails(${index}); event.stopPropagation();">
                            View Details
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Update table headers with sort indicators
        this.updateTableHeaders();
    }

    /**
     * Update table headers with sort indicators
     */
    static updateTableHeaders() {
        const headerMap = {
            'amount': 'Annual Amount',
            'netWorth': 'Final Net Worth',
            'tax': 'Total Tax',
            'breakEven': 'Break-Even Age',
            'rothBalance': 'Roth Balance',
            'score': 'Score'
        };

        // Find all table headers in the comparison table
        const table = document.querySelector('#comparisonTableBody')?.closest('table');
        if (!table) return;

        const headers = table.querySelectorAll('thead th[onclick*="sortComparisonTable"]');
        headers.forEach(th => {
            const onclick = th.getAttribute('onclick');
            const match = onclick?.match(/sortComparisonTable\('(\w+)'\)/);
            if (!match) return;

            const column = match[1];
            const indicator = this.getSortIndicator(column);
            const baseText = headerMap[column] || column;

            th.textContent = baseText + indicator;
        });
    }

    /**
     * Analyze which constraints were limiting across all years
     */
    static analyzeLimitingFactors(results) {
        const counts = { bracket: 0, maxAnnual: 0, balance: 0, none: 0 };

        results.forEach(year => {
            const factor = year.constraints?.limitingFactor || 'none';
            if (Object.prototype.hasOwnProperty.call(counts, factor)) {
                counts[factor]++;
            }
        });

        return counts;
    }

    /**
     * Get badge HTML for limiting factor
     */
    static getLimitingFactorBadge(counts) {
        const total = Object.values(counts).reduce((sum, c) => sum + c, 0);
        if (total === 0) return '';

        // Find most common limiting factor
        const dominant = Object.entries(counts)
            .filter(([key]) => key !== 'none')
            .reduce((max, [key, val]) => val > max[1] ? [key, val] : max, ['none', 0]);

        const [factor, count] = dominant;
        const percentage = Math.round((count / total) * 100);

        if (factor === 'none' || percentage < 10) return '';

        const badges = {
            bracket: `<span style="background: rgba(59, 130, 246, 0.15); color: #3b82f6; padding: 2px 6px; border-radius: 3px; font-size: 0.65rem;">📊 Bracket ${percentage}%</span>`,
            maxAnnual: `<span style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; padding: 2px 6px; border-radius: 3px; font-size: 0.65rem;">💰 Cap ${percentage}%</span>`,
            balance: `<span style="background: rgba(239, 68, 68, 0.15); color: #ef4444; padding: 2px 6px; border-radius: 3px; font-size: 0.65rem;">⚠️ Balance ${percentage}%</span>`
        };

        return badges[factor] || '';
    }

    /**
     * Render comparison chart
     */
    static renderComparisonChart(comparison) {
        const ctx = getSafeCtx('chartStrategyComparison');
        if (!ctx) return;

        // Destroy existing chart
        if (this.comparisonChart) {
            this.comparisonChart.destroy();
        }

        const amounts = comparison.strategies.map(s => s.amount / 1000); // Convert to thousands
        const netWorths = comparison.strategies.map(s => (s.finalNetWorth || 0) / 1000000); // Convert to millions
        const optimalIndex = comparison.strategies.findIndex(s => s.amount === comparison.optimal.amount);

        this.comparisonChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: amounts.map(amt => `$${amt}k`),
                datasets: [{
                    label: 'Final Net Worth',
                    data: netWorths,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: amounts.map((_, i) => i === optimalIndex ? 8 : 4),
                    pointBackgroundColor: amounts.map((_, i) => i === optimalIndex ? 'rgb(34, 197, 94)' : 'rgb(59, 130, 246)'),
                    pointBorderColor: amounts.map((_, i) => i === optimalIndex ? 'rgb(34, 197, 94)' : 'rgb(59, 130, 246)'),
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const strategy = comparison.strategies[context.dataIndex];
                                return [
                                    `Net Worth: $${context.parsed.y.toFixed(2)}M`,
                                    `Tax Paid: ${formatCurrency(strategy.totalTaxPaid)}`,
                                    `Score: ${strategy.score}/100`,
                                    context.dataIndex === optimalIndex ? '⭐ OPTIMAL' : ''
                                ].filter(Boolean);
                            }
                        }
                    },
                    annotation: optimalIndex >= 0 ? {
                        annotations: {
                            optimal: {
                                type: 'point',
                                xValue: optimalIndex,
                                yValue: netWorths[optimalIndex],
                                backgroundColor: 'rgba(34, 197, 94, 0.25)',
                                borderColor: 'rgb(34, 197, 94)',
                                borderWidth: 3,
                                radius: 12
                            }
                        }
                    } : undefined
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Annual Conversion Amount',
                            color: 'var(--text-muted)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: 'var(--text-muted)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Final Net Worth (Millions)',
                            color: 'var(--text-muted)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: 'var(--text-muted)',
                            callback: function (value) {
                                return '$' + value.toFixed(1) + 'M';
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Update recommendation text
     */
    static updateRecommendation(comparison) {
        const textEl = document.getElementById('recommendationText');
        const reasonEl = document.getElementById('recommendationReason');

        if (!textEl || !reasonEl) return;

        const optimal = comparison.optimal;
        textEl.textContent = `${formatCurrency(optimal.amount)}/year`;

        const reasons = [];
        if (optimal.indicators?.isHighestNW) {
            reasons.push('Maximizes final net worth');
        }
        if (optimal.indicators?.isFastestBreakEven) {
            reasons.push('Fastest break-even');
        }
        if (optimal.score >= 90) {
            reasons.push('Excellent overall score');
        }
        reasons.push(`Balances tax efficiency with wealth growth`);

        reasonEl.textContent = reasons.join(' • ');
    }
}

// Global functions for window
window.selectStrategy = (index) => {
    console.log(`Selected strategy ${index}`);
    // Highlight selected row
    const rows = document.querySelectorAll('#comparisonTableBody tr');
    rows.forEach((row, i) => {
        if (i === index) {
            row.style.background = 'rgba(59, 130, 246, 0.15)';
        } else if (!row.textContent.includes('⭐')) {
            row.style.background = '';
        }
    });
};

window.viewStrategyDetails = (index) => {
    if (!RothComparison.comparisonData) return;

    const strategy = RothComparison.comparisonData.strategies[index];
    console.log(`Viewing details for ${formatCurrency(strategy.amount)}/year strategy`);

    // Import RothDeepDive dynamically
    import('./RothDeepDive.js').then(module => {
        const { RothDeepDive } = module;

        // Store selected strategy for reference
        RothDeepDive.selectedStrategy = {
            amount: strategy.amount,
            results: strategy.results,
            score: strategy.score,
            finalNetWorth: strategy.finalNetWorth,
            totalTaxPaid: strategy.totalTaxPaid
        };

        // Switch to detailed view
        window.switchRothTab('detailed');

        // Render the strategy's year-by-year data
        if (strategy.results && strategy.results.length > 0) {
            RothDeepDive.renderTable(strategy.results);
            RothDeepDive.updateDetailHeader(strategy.amount, strategy.score);
        } else {
            console.warn('No year-by-year results available for this strategy');
        }
    }).catch(err => {
        console.error('Failed to load RothDeepDive:', err);
    });
};

window.sortComparisonTable = (column) => {
    if (!RothComparison.comparisonData) return;

    // Toggle direction if same column, otherwise default to desc
    if (RothComparison.sortState.column === column) {
        RothComparison.sortState.direction =
            RothComparison.sortState.direction === 'desc' ? 'asc' : 'desc';
    } else {
        RothComparison.sortState.column = column;
        RothComparison.sortState.direction = 'desc';
    }

    console.log(`Sorting by ${column} (${RothComparison.sortState.direction})`);

    // Sort strategies
    const sorted = RothComparison.sortStrategies(
        RothComparison.comparisonData.strategies,
        column,
        RothComparison.sortState.direction
    );

    // Update comparison data
    RothComparison.comparisonData.strategies = sorted;

    // Re-render table
    RothComparison.renderComparisonTable(RothComparison.comparisonData);
};

/**
 * Sort strategies by specified column
 */
RothComparison.sortStrategies = function (strategies, column, direction) {
    const multiplier = direction === 'asc' ? 1 : -1;

    return [...strategies].sort((a, b) => {
        let aVal, bVal;

        switch (column) {
            case 'amount':
                aVal = a.amount;
                bVal = b.amount;
                break;
            case 'netWorth':
                aVal = a.finalNetWorth || 0;
                bVal = b.finalNetWorth || 0;
                break;
            case 'tax':
                aVal = a.totalTaxPaid || 0;
                bVal = b.totalTaxPaid || 0;
                break;
            case 'breakEven':
                aVal = a.breakEvenAge === 999 ? Infinity : (a.breakEvenAge || Infinity);
                bVal = b.breakEvenAge === 999 ? Infinity : (b.breakEvenAge || Infinity);
                break;
            case 'rothBalance':
                aVal = a.finalRothBalance || 0;
                bVal = b.finalRothBalance || 0;
                break;
            case 'score':
            default:
                aVal = a.score;
                bVal = b.score;
                break;
        }

        return (aVal - bVal) * multiplier;
    });
};

/**
 * Get sort indicator for column header
 */
RothComparison.getSortIndicator = function (column) {
    if (RothComparison.sortState.column !== column) return '';
    return RothComparison.sortState.direction === 'desc' ? ' ▼' : ' ▲';
};

export default RothComparison;
