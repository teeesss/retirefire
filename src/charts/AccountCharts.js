import Chart from 'chart.js/auto';
import { config } from '../data/Config.js';
import { rawData } from '../data/Store.js';
import { charts } from '../state/ChartStore.js';
import { getSafeCtx } from './ChartHelpers.js';
import { formatCurrency } from '../utils/Formatters.js';
import { accountNames, colors } from '../data/Constants.js';

export function initAccountTrendsChart() {
    const ctx = getSafeCtx('chartAccountTrends');
    if (!ctx) return;
    const accounts = rawData[config.currentScenario].accounts;

    charts.accountTrends = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: Object.keys(accounts).filter(k => k !== 'Debt').map(key => ({
                label: accountNames[key] || key,
                data: accounts[key],
                borderColor: colors[key],
                fill: false,
                tension: 0.4,
                pointRadius: 0
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { ticks: { callback: v => formatCurrency(v) } } }
        }
    });
}

export function initMortgageChart() {
    const ctx = getSafeCtx('chartMortgage');
    if (!ctx) return;
    const mortgage = rawData[config.currentScenario].accounts.Debt.map(v => Math.abs(v));

    charts.mortgage = new Chart(ctx, {
        type: 'area',
        data: {
            labels: rawData.years,
            datasets: [{ label: 'Mortgage Balance', data: mortgage, backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: '#ef4444', fill: true }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { ticks: { callback: v => formatCurrency(v) } } }
        }
    });
}

export function initDebtPayoffChart() {
    const ctx = getSafeCtx('chartDebtPayoff');
    if (!ctx) return;

    charts.debtPayoff = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [
                { label: 'Baseline', data: [], borderColor: '#6b7280', borderDash: [5, 5] },
                { label: 'Accelerated', data: [], borderColor: '#10b981', borderWidth: 3 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { ticks: { callback: v => formatCurrency(v) } } }
        }
    });
}
