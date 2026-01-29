import Chart from 'chart.js/auto';
import { config } from '../data/Config.js';
import { rawData } from '../data/Store.js';
import { charts } from '../state/ChartStore.js';
import { getSafeCtx } from './ChartHelpers.js';
import { formatCurrency } from '../utils/Formatters.js';

export function initSSExplorerChart() {
    const ctx = getSafeCtx('chartSSExplorer');
    if (!ctx) return;

    charts.ssExplorer = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: 'Claim @ 62', data: [], borderColor: '#ef4444', tension: 0.4, pointRadius: 0 },
                { label: 'Claim @ 67', data: [], borderColor: '#3b82f6', tension: 0.4, pointRadius: 0 },
                { label: 'Claim @ 70', data: [], borderColor: '#10b981', tension: 0.4, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { ticks: { callback: v => formatCurrency(v) } } }
        }
    });
    applyTooltipConfig(charts.ssExplorer.options);
    charts.ssExplorer.update();
}

export function initRothExplorerChart() {
    const ctx = getSafeCtx('chartRothExplorer');
    if (!ctx) return;

    charts.rothExplorer = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [
                { label: 'Baseline', data: [], borderColor: 'rgba(59, 130, 246, 0.5)', borderDash: [5, 5], tension: 0.4, pointRadius: 0 },
                { label: 'With Roth Strategy', data: [], borderColor: '#8b5cf6', tension: 0.4, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: { y: { ticks: { callback: (v) => formatCurrency(v) } } }
        }
    });
    applyTooltipConfig(charts.rothExplorer.options);
    charts.rothExplorer.update();
}

export function initWhatIfChart() {
    const ctx = getSafeCtx('chartWhatIf');
    if (!ctx) return;

    charts.whatIf = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [
                { label: 'Baseline', data: [], borderColor: 'rgba(59, 130, 246, 0.5)', borderDash: [5, 5], fill: false, tension: 0.4, pointRadius: 0 },
                { label: 'Modified', data: [], borderColor: '#ef4444', fill: false, tension: 0.4, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { boxWidth: 12, padding: 8 } }
            },
            scales: { y: { ticks: { callback: (v) => formatCurrency(v) } }, x: { ticks: { maxTicksLimit: 10 } } }
        }
    });
    applyTooltipConfig(charts.whatIf.options);
    charts.whatIf.update();
}

export function initMarketRiskChart() {
    const ctx = getSafeCtx('chartMarketRisk');
    if (!ctx) return;
    charts.marketRisk = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [
                { label: 'Baseline', data: [], borderColor: 'rgba(59, 130, 246, 0.5)', borderDash: [5, 5], fill: false, tension: 0.4, pointRadius: 0 },
                { label: 'Stress Test', data: [], borderColor: '#ef4444', fill: false, tension: 0.4, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { boxWidth: 12, padding: 8 } } },
            scales: { y: { ticks: { callback: (v) => formatCurrency(v) } }, x: { ticks: { maxTicksLimit: 10 } } }
        }
    });
    applyTooltipConfig(charts.marketRisk.options);
    charts.marketRisk.update();
}

export function initDebtPayoffChart() {
    const ctx = getSafeCtx('chartDebtPayoff');
    if (!ctx) return;
    charts.debtPayoff = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{ label: 'Total Debt Balance', data: [], borderColor: '#f59e0b', backgroundColor: '#f59e0b20', fill: true, tension: 0.4, pointRadius: 0 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { ticks: { callback: (v) => formatCurrency(v) } }, x: { display: false } }
        }
    });
    applyTooltipConfig(charts.debtPayoff.options);
    charts.debtPayoff.update();
}

export function initSparklines() {
    const sparkNWCtx = getSafeCtx('sparkNW');
    if (sparkNWCtx) {
        charts.sparkNW = new Chart(sparkNWCtx, {
            type: 'line',
            data: {
                labels: rawData.years.slice(0, 10),
                datasets: [{ data: [], borderColor: '#10b981', borderWidth: 2, pointRadius: 0, tension: 0.4 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
        });
    }

    const sparkGrowthCtx = getSafeCtx('sparkGrowth');
    if (sparkGrowthCtx) {
        charts.sparkGrowth = new Chart(sparkGrowthCtx, {
            type: 'line',
            data: {
                labels: rawData.years,
                datasets: [{ data: [], borderColor: '#3b82f6', borderWidth: 2, pointRadius: 0, tension: 0.4 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
        });
    }
}
