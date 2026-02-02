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

            return `
                <tr style="${isOptimal ? 'background: rgba(34, 197, 94, 0.1); border-left: 3px solid var(--success);' : ''}"
                    onclick="window.selectStrategy(${index})">
                    <td style="font-weight: 700; color: var(--text-primary);">
                        ${formatCurrency(strategy.amount)}/year
                        ${isOptimal ? ' ⭐' : ''}
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

    // Switch to detailed view and load this strategy's data
    window.switchRothTab('detailed');

    // TODO: Load the specific strategy's year-by-year data into the detailed view
    // This would require passing the strategy.results to renderTable()
};

window.sortComparisonTable = (column) => {
    console.log(`Sorting by ${column}`);
    // TODO: Implement table sorting
};

export default RothComparison;
