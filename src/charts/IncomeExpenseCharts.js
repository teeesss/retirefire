import Chart from 'chart.js/auto';
import { config } from '../data/Config.js';
import { rawData } from '../data/Store.js';
import { charts } from '../state/ChartStore.js';
import { getSafeCtx } from './ChartHelpers.js';
import { formatCurrency } from '../utils/Formatters.js';
import { getTotalIncome, getTotalExpenses } from '../state/DataUtils.js';
import { incomeColors, expenseColors, incomeNames, expenseNames } from '../data/Constants.js';

export function initIncomeChart() {
    const ctx = getSafeCtx('chartIncome');
    if (!ctx) return;
    const income = rawData[config.currentScenario].income;

    charts.income = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: rawData.years,
            datasets: Object.keys(income).filter(k => income[k].some(v => v > 0)).map(key => ({
                label: incomeNames[key] || key,
                data: income[key],
                backgroundColor: incomeColors[key] || '#10b981',
                stack: 'stack1'
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { stacked: true, ticks: { maxTicksLimit: 10 } }, y: { stacked: true, ticks: { callback: v => formatCurrency(v) } } }
        }
    });
}

export function initExpensesChart() {
    const ctx = getSafeCtx('chartExpenses');
    if (!ctx) return;
    const expenses = rawData[config.currentScenario].expenses;

    charts.expenses = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: rawData.years,
            datasets: Object.keys(expenses).filter(k => expenses[k].some(v => v > 0)).map(key => ({
                label: expenseNames[key] || key,
                data: expenses[key],
                backgroundColor: expenseColors[key] || '#ef4444',
                stack: 'stack1'
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { stacked: true, ticks: { maxTicksLimit: 10 } }, y: { stacked: true, ticks: { callback: v => formatCurrency(v) } } }
        }
    });
}

export function initHealthcareChart() {
    const ctx = getSafeCtx('chartHealthcare');
    if (!ctx) return;
    const medical = rawData[config.currentScenario].expenses.Medical;
    const ltc = rawData[config.currentScenario].expenses.LTC;

    charts.healthcare = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [
                { label: 'Routine Medical', data: medical, borderColor: '#10b981', fill: false, tension: 0.4 },
                { label: 'Long-Term Care', data: ltc, borderColor: '#ef4444', fill: false, tension: 0.4 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { ticks: { callback: v => formatCurrency(v) } } }
        }
    });
}

export function initSSComparisonChart() {
    const ctx = getSafeCtx('chartSSComparison');
    if (!ctx) return;
    const ss = config.settings.socialSecurity;
    const labels = ['Claim @ 62', 'Claim @ 67 (FRA)', 'Claim @ 70'];
    const data = [ss.ss62, ss.ss67, ss.ss70];

    charts.ssComparison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{ label: 'Monthly Benefit', data: data, backgroundColor: ['#ef4444', '#3b82f6', '#10b981'] }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { ticks: { callback: v => formatCurrency(v) } } }
        }
    });
}

export function initIncomeReplacementChart() {
    const ctx = getSafeCtx('chartIncomeReplacement');
    if (!ctx) return;

    const totalIncomeData = rawData.years.map((_, i) => getTotalIncome(config.currentScenario, i));
    const preRetirementIncome = totalIncomeData[0];
    const replacementData = totalIncomeData.map(inc => preRetirementIncome > 0 ? (inc / preRetirementIncome) * 100 : 0);

    charts.incomeReplacement = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [
                { label: 'Replacement %', data: replacementData, borderColor: '#3b82f6', backgroundColor: '#3b82f620', fill: true, tension: 0.4, pointRadius: 0 },
                { label: '80% Target', data: Array(46).fill(80), borderColor: '#10b981', borderDash: [5, 5], fill: false, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { ticks: { callback: (v) => v + '%' }, max: 150 }, x: { ticks: { maxTicksLimit: 10 } } }
        }
    });
}

export function initSurplusGapChart() {
    const ctx = getSafeCtx('chartSurplusGap');
    if (!ctx) return;

    const totalIncomeData = rawData.years.map((_, i) => getTotalIncome(config.currentScenario, i));
    const totalExpensesData = rawData.years.map((_, i) => getTotalExpenses(config.currentScenario, i));
    const surplusData = totalIncomeData.map((inc, i) => inc - totalExpensesData[i]);

    charts.surplusGap = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: rawData.years,
            datasets: [{
                label: 'Surplus/Gap',
                data: surplusData,
                backgroundColor: surplusData.map(val => val >= 0 ? '#10b981' : '#ef4444'),
                borderColor: surplusData.map(val => val >= 0 ? '#047857' : '#b91c1c'),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (ctx) => `Surplus: ${formatCurrency(ctx.raw)}` } }
            },
            scales: {
                y: { ticks: { callback: (v) => formatCurrency(v) } },
                x: { ticks: { maxTicksLimit: 10 } }
            }
        }
    });
}

export function initExpensePieChart() {
    const ctx = getSafeCtx('chartExpensePie');
    if (!ctx) return;
    charts.expensePie = new Chart(ctx, {
        type: 'pie',
        data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 10, padding: 6, font: { size: 10 } } },
                tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${formatCurrency(ctx.raw, false)}` } }
            }
        }
    });
    updateExpensePieChart();
}

export function updateExpensePieChart() {
    if (!charts.expensePie) return;
    const expenses = rawData[config.currentScenario].expenses;
    const yearIndex = config.currentYear;
    const labels = [], data = [], bgColors = [];

    for (let key in expenses) {
        const value = expenses[key][yearIndex];
        if (value > 0) {
            labels.push(expenseNames[key] || key);
            data.push(value);
            bgColors.push(expenseColors[key] || '#6b7280');
        }
    }

    charts.expensePie.data.labels = labels;
    charts.expensePie.data.datasets[0].data = data;
    charts.expensePie.data.datasets[0].backgroundColor = bgColors;
    charts.expensePie.update();
}
