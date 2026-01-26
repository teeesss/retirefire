import Chart from 'chart.js/auto';
import { config } from '../data/Config.js';
import { rawData } from '../data/Store.js';
import { charts } from '../state/ChartStore.js';
import { getSafeCtx } from './ChartHelpers.js';
import { formatCurrency } from '../utils/Formatters.js';
import { scenarioColors } from '../data/Constants.js';
import { getNetWorthSeries, calculateNetWorth, getTotalIncome, getTotalExpenses } from '../state/DataUtils.js';

export function initMonteCarloChart() {
    const ctx = getSafeCtx('chartMonteCarlo');
    if (!ctx) return;

    charts.monteCarlo = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [
                { label: '90th %ile', data: [], borderColor: '#10b981', fill: '+1', tension: 0.4, pointRadius: 0 },
                { label: '75th %ile', data: [], borderColor: '#22c55e', fill: '+1', tension: 0.4, pointRadius: 0 },
                { label: 'Median', data: [], borderColor: '#3b82f6', tension: 0.4, pointRadius: 0, borderWidth: 3 },
                { label: '25th %ile', data: [], borderColor: '#f59e0b', fill: '+1', tension: 0.4, pointRadius: 0 },
                { label: '10th %ile', data: [], borderColor: '#ef4444', tension: 0.4, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: { y: { ticks: { callback: v => formatCurrency(v) } } }
        }
    });
}

export function initLegacyChart() {
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
                { label: 'Legacy Goal', data: Array(46).fill(config.goals[2]?.target || 5000000), borderColor: '#8b5cf6', borderDash: [5, 5], pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { ticks: { callback: v => formatCurrency(v) } } }
        }
    });
}

export function initSequenceRiskChart() {
    const ctx = getSafeCtx('chartSequenceRisk');
    if (!ctx) return;

    const riskData = rawData.ages.map(age => {
        if (age < 53) return 20;
        if (age < 58) return 90;
        if (age < 65) return 70;
        if (age < 75) return 40;
        return 20;
    });

    charts.sequenceRisk = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: rawData.years,
            datasets: [{
                label: 'Risk Level',
                data: riskData,
                backgroundColor: riskData.map(r => r > 70 ? '#ef4444' : r > 40 ? '#f59e0b' : '#10b981')
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { max: 100, ticks: { callback: v => v + '%' } } }
        }
    });
}

export function initLifetimeCashFlowChart() {
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
                legend: { display: false },
                tooltip: { callbacks: { label: (ctx) => `Cumulative: ${formatCurrency(ctx.raw)}` } }
            },
            scales: {
                y: { ticks: { callback: (v) => formatCurrency(v) } },
                x: { ticks: { maxTicksLimit: 10 } }
            }
        }
    });
}

export function initScenarioComparisonChart() {
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
}
