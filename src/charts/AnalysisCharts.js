import Chart from 'chart.js/auto';
import { config } from '../data/Config.js';
import { rawData } from '../data/Store.js';
import { charts, destroyChart } from '../state/ChartStore.js';
import { getSafeCtx } from './ChartHelpers.js';
import { formatCurrency } from '../utils/Formatters.js';
import { applyTooltipConfig } from '../utils/tooltipConfig.js';
import { scenarioColors } from '../data/Constants.js';
import { getNetWorthSeries, calculateNetWorth, getTotalIncome, getTotalExpenses } from '../state/DataUtils.js';

export function initMonteCarloChart() {
    destroyChart('monteCarlo');
    const ctx = getSafeCtx('chartMonteCarlo');
    if (!ctx) return;

    // Create gradient for confidence bands
    const createGradient = (ctx, color1, color2) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        return gradient;
    };

    charts.monteCarlo = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [
                {
                    label: '90th %ile',
                    data: [],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    fill: 1,
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 1.5,
                    order: 5
                },
                {
                    label: '75th %ile',
                    data: [],
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.08)',
                    fill: 2,
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 1,
                    borderDash: [3, 3],
                    order: 4
                },
                {
                    label: 'Median (50th)',
                    data: [],
                    borderColor: '#3b82f6',
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 3,
                    order: 1
                },
                {
                    label: '25th %ile',
                    data: [],
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                    fill: 4,
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 1,
                    borderDash: [3, 3],
                    order: 3
                },
                {
                    label: '10th %ile',
                    data: [],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 1.5,
                    order: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 11 }
                    }
                },
                tooltip: {
                    callbacks: {
                        title: (context) => {
                            const yearIndex = context[0].dataIndex;
                            const year = rawData.years[yearIndex];
                            const age = rawData.ages[yearIndex];
                            return `Year ${year} (Age ${age})`;
                        },
                        afterTitle: (context) => {
                            // Show success rate for final year
                            if (context[0].dataIndex === rawData.years.length - 1) {
                                const successRate = window.lastMonteCarloResults?.successRate || 0;
                                return `Success Rate: ${successRate.toFixed(1)}%`;
                            }
                            return '';
                        },
                        label: (context) => {
                            const label = context.dataset.label || '';
                            const value = formatCurrency(context.parsed.y);
                            return `${label}: ${value}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    ticks: { callback: v => formatCurrency(v) },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: { maxTicksLimit: 12 },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    applyTooltipConfig(charts.monteCarlo.options);
    charts.monteCarlo.update();
}

export function initLegacyChart() {
    destroyChart('legacy');
    const ctx = getSafeCtx('chartLegacy');
    if (!ctx) return;

    charts.legacy = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [
                { label: 'Optimistic', data: getNetWorthSeries('optimistic'), borderColor: scenarioColors.optimistic, tension: 0.4, pointRadius: 0 },
                { label: 'Average', data: getNetWorthSeries('average'), borderColor: scenarioColors.average, tension: 0.4, pointRadius: 0 },
                { label: 'Pessimistic', data: getNetWorthSeries('pessimistic'), borderColor: scenarioColors.pessimistic, tension: 0.4, pointRadius: 0 },
                { label: 'Legacy Goal', data: Array(rawData.years?.length || 46).fill(config.goals[2]?.target || 5000000), borderColor: '#8b5cf6', borderDash: [5, 5], pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { ticks: { callback: v => formatCurrency(v) } } }
        }
    });
    applyTooltipConfig(charts.legacy.options);
    charts.legacy.update();
}

export function initSequenceRiskChart() {
    destroyChart('sequenceRisk');
    const ctx = getSafeCtx('chartSequenceRisk');
    if (!ctx) return;

    const baseline = getNetWorthSeries('average');

    charts.sequenceRisk = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [
                {
                    label: 'Baseline',
                    data: baseline,
                    borderColor: '#6b7280',
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0
                },
                {
                    label: 'Stressed Path',
                    data: [...baseline],
                    borderColor: '#ef4444',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { ticks: { callback: v => formatCurrency(v) } },
                x: { ticks: { maxTicksLimit: 10 } }
            }
        }
    });
    applyTooltipConfig(charts.sequenceRisk.options);
    charts.sequenceRisk.update();
}

export function initLifetimeCashFlowChart() {
    destroyChart('lifetimeCashFlow');
    const ctx = getSafeCtx('chartLifetimeCashFlow');
    if (!ctx) return;

    let cumulative = 0;
    const data = rawData.years.map((_, i) => {
        const income = getTotalIncome(config.currentScenario, i);
        const expenses = getTotalExpenses(config.currentScenario, i);
        cumulative += (income - expenses);
        return cumulative;
    });

    charts.lifetimeCashFlow = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [{
                label: 'Cumulative Cash Flow',
                data: data,
                borderColor: '#10b981',
                backgroundColor: '#10b98120',
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { ticks: { callback: (v) => formatCurrency(v) } },
                x: { ticks: { maxTicksLimit: 10 } }
            }
        }
    });
    applyTooltipConfig(charts.lifetimeCashFlow.options);
    charts.lifetimeCashFlow.update();
}

export function initScenarioComparisonChart() {
    destroyChart('scenarioComparison');
    const ctx = getSafeCtx('chartScenarioComparison');
    if (!ctx) return;

    const keyAges = [50, 60, 70, 80, 90];
    const keyIndices = keyAges.map(a => Math.max(0, a - 50));

    charts.scenarioComparison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: keyAges.map(a => `Age ${a}`),
            datasets: [
                { label: 'Optimistic', data: keyIndices.map(i => calculateNetWorth('optimistic', i)), backgroundColor: scenarioColors.optimistic },
                { label: 'Average', data: keyIndices.map(i => calculateNetWorth('average', i)), backgroundColor: scenarioColors.average },
                { label: 'Pessimistic', data: keyIndices.map(i => calculateNetWorth('pessimistic', i)), backgroundColor: scenarioColors.pessimistic }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { boxWidth: 12, padding: 8 } } },
            scales: { y: { ticks: { callback: (v) => formatCurrency(v) } } }
        }
    });
    applyTooltipConfig(charts.scenarioComparison.options);
    charts.scenarioComparison.update();
}
