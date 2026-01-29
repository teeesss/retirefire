import Chart from 'chart.js/auto';
import { config } from '../data/Config.js';
import { rawData } from '../data/Store.js';
import { charts } from '../state/ChartStore.js';
import { getSafeCtx } from './ChartHelpers.js';
import { formatCurrency } from '../utils/Formatters.js';
import { applyTooltipConfig } from '../utils/tooltipConfig.js';
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
    applyTooltipConfig(charts.income.options);
    charts.income.update();
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
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: { x: { stacked: true, ticks: { maxTicksLimit: 10 } }, y: { stacked: true, ticks: { callback: v => formatCurrency(v) } } }
        }
    });
    applyTooltipConfig(charts.expenses.options);
    charts.expenses.options.interaction = { mode: 'index', intersect: false };
    charts.expenses.update();
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
    applyTooltipConfig(charts.healthcare.options);
    charts.healthcare.update();
}

export function initSSComparisonChart() {
    const ctx = getSafeCtx('chartSSComparison');
    if (!ctx) return;

    charts.ssComparison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Claim @ 62', 'Claim @ 67 (FRA)', 'Claim @ 70'],
            datasets: [{
                label: 'Monthly Benefit',
                data: [0, 0, 0],
                backgroundColor: ['#ef4444', '#3b82f6', '#10b981']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { ticks: { callback: v => formatCurrency(v) } } }
        }
    });
    applyTooltipConfig(charts.ssComparison.options);
    updateSSComparisonChart(); // Initialize with current data
}

export function updateSSComparisonChart() {
    if (!charts.ssComparison) return;

    const pia = parseFloat(document.getElementById('ssPiaInput')?.value || 2800);
    const viewMode = document.getElementById('ssViewToggle')?.value || 'annual';

    // Calculate factors based on FRA 67
    const getFactor = (age) => {
        if (age === 67) return 1.0;
        if (age < 67) return 1.0 - (67 - age) * 0.0667;
        return 1.0 + (age - 67) * 0.08;
    };

    const f62 = getFactor(62);
    const f67 = getFactor(67);
    const f70 = getFactor(70);

    let data, label;
    if (viewMode === 'cumulative') {
        // Lifetime cumulative to age 95
        data = [
            pia * f62 * 12 * (95 - 62),
            pia * f67 * 12 * (95 - 67),
            pia * f70 * 12 * (95 - 70)
        ];
        label = 'Lifetime Total (to 95)';

        // Update stat boxes to show cumulative values
        const el62 = document.getElementById('ss62');
        const el67 = document.getElementById('ss67');
        const el70 = document.getElementById('ss70');
        if (el62) el62.textContent = formatCurrency(data[0]);
        if (el67) el67.textContent = formatCurrency(data[1]);
        if (el70) el70.textContent = formatCurrency(data[2]);

        // Hide the "Life:" labels since we're showing lifetime already
        const life62 = document.getElementById('ss62Lifetime');
        const life67 = document.getElementById('ss67Lifetime');
        const life70 = document.getElementById('ss70Lifetime');
        if (life62) life62.style.display = 'none';
        if (life67) life67.style.display = 'none';
        if (life70) life70.style.display = 'none';

    } else {
        // Annual benefit
        data = [
            pia * f62 * 12,
            pia * f67 * 12,
            pia * f70 * 12
        ];
        label = 'Annual Benefit';

        // Update stat boxes to show monthly values
        const el62 = document.getElementById('ss62');
        const el67 = document.getElementById('ss67');
        const el70 = document.getElementById('ss70');
        if (el62) el62.textContent = formatCurrency(pia * f62) + '/mo';
        if (el67) el67.textContent = formatCurrency(pia * f67) + '/mo';
        if (el70) el70.textContent = formatCurrency(pia * f70) + '/mo';

        // Show and update the "Life:" labels
        const life62 = document.getElementById('ss62Lifetime');
        const life67 = document.getElementById('ss67Lifetime');
        const life70 = document.getElementById('ss70Lifetime');
        if (life62) {
            life62.style.display = 'block';
            life62.textContent = 'Life: ' + formatCurrency(pia * f62 * 12 * (95 - 62));
        }
        if (life67) {
            life67.style.display = 'block';
            life67.textContent = 'Life: ' + formatCurrency(pia * f67 * 12 * (95 - 67));
        }
        if (life70) {
            life70.style.display = 'block';
            life70.textContent = 'Life: ' + formatCurrency(pia * f70 * 12 * (95 - 70));
        }
    }

    charts.ssComparison.data.datasets[0].data = data;
    charts.ssComparison.data.datasets[0].label = label;
    charts.ssComparison.update();
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
    applyTooltipConfig(charts.incomeReplacement.options, true);
    charts.incomeReplacement.update();
}

export function initSurplusGapChart() {
    const ctx = getSafeCtx('chartSurplusGap');
    if (!ctx) return;

    // Use FALSE for includeDrawdown to show the actual gap/surplus relative to fixed income
    const scenario = config.currentScenario;
    const data = rawData[scenario];
    const totalIncomeNoDrawdown = rawData.years.map((_, i) => getTotalIncome(scenario, i, false));
    const totalExpensesData = rawData.years.map((_, i) => getTotalExpenses(scenario, i));

    // Net Flow without drawdown
    const netFlowData = totalIncomeNoDrawdown.map((inc, i) => inc - totalExpensesData[i]);

    // Identify broken/insolvent years
    const portfolioHistory = data.netWorth || [];

    charts.surplusGap = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: rawData.years,
            datasets: [{
                label: 'Net Cash Flow',
                data: netFlowData,
                backgroundColor: netFlowData.map((val, i) => {
                    const isBroke = portfolioHistory[i] <= 0;
                    if (val >= 0) return '#10b981'; // Surplus (Green)
                    if (isBroke) return '#ef4444';  // Unfunded Gap (Red)
                    return '#3b82f6';                // Funded Gap (Blue/Assets covering)
                }),
                borderColor: netFlowData.map((val, i) => {
                    const isBroke = portfolioHistory[i] <= 0;
                    if (val >= 0) return '#047857';
                    if (isBroke) return '#b91c1c';
                    return '#2563eb';
                }),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: true, labels: { boxWidth: 10, font: { size: 9 } } },
                title: {
                    display: true,
                    text: 'Plan Solvency (Green=Surplus, Blue=Funded by Assets, Red=Gap)',
                    font: { size: 10 }
                }
            },
            scales: {
                y: { ticks: { callback: (v) => formatCurrency(v) } },
                x: { ticks: { maxTicksLimit: 10 } }
            }
        }
    });

    applyTooltipConfig(charts.surplusGap.options);
    charts.surplusGap.update();
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
                legend: { position: 'bottom', labels: { boxWidth: 10, padding: 6, font: { size: 10 } } }
            }
        }
    });
    applyTooltipConfig(charts.expensePie.options);
    updateExpensePieChart();
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
