import Chart from 'chart.js/auto';
import { config } from '../data/Config.js';
import { rawData } from '../data/Store.js';
import { charts } from '../state/ChartStore.js';
import { getSafeCtx } from './ChartHelpers.js';
import { formatCurrency } from '../utils/Formatters.js';
import { applyTooltipConfig } from '../utils/tooltipConfig.js';
import { getTotalIncome, getTotalExpenses } from '../state/DataUtils.js';
import { incomeColors, expenseColors, incomeNames, expenseNames } from '../data/Constants.js';
import { SocialSecurityCalculator } from '../utils/SocialSecurityCalculator.js';

export function initIncomeChart() {
    const ctx = getSafeCtx('chartIncome');
    if (!ctx) return;
    const scenario = config.currentScenario;
    const income = rawData[scenario].income;
    const drawdown = rawData[scenario].drawdown;

    // Filter out legacy "Drawdown" summary if granular ones exist to avoid double counting
    const keysToExclude = ['Drawdown'];

    charts.income = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: rawData.years,
            datasets: Object.keys(income)
                .filter(k => !keysToExclude.includes(k) && income[k].some(v => v > 0))
                .map(key => ({
                    label: incomeNames[key] || key,
                    data: income[key],
                    backgroundColor: incomeColors[key] || '#10b981',
                    stack: 'stack1',
                    // Store tax data for tooltips if it's a drawdown key
                    taxData: key.endsWith('Drawdown') ? drawdown[key.replace('Drawdown', 'Tax')] : null
                }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: { x: { stacked: true, ticks: { maxTicksLimit: 10 } }, y: { stacked: true, ticks: { callback: v => formatCurrency(v) } } },
            plugins: {
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) label += formatCurrency(context.parsed.y);

                            // Add tax info if available
                            const taxVal = context.dataset.taxData ? context.dataset.taxData[context.dataIndex] : 0;
                            if (taxVal > 0) {
                                label += ` (Tax Cost: ${formatCurrency(taxVal)})`;
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
    // applyTooltipConfig(charts.income.options); // Use custom callback instead for tax info
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
            labels: ['Claim @ 62', 'Claim @ 67 (FRA)', 'Claim @ 70', 'Current Choice'],
            datasets: [{
                label: 'Benefit Amount',
                data: [0, 0, 0, 0],
                backgroundColor: ['#ef4444', '#3b82f6', '#10b981', '#a855f7'], // Purple for active choice
                barPercentage: 0.6,
                categoryPercentage: 0.8
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

    const choiceAge = config.settings.socialSecurity.claimAge || 67;
    const b62 = SocialSecurityCalculator.calculateBenefitAtAge(pia, 62);
    const b67 = SocialSecurityCalculator.calculateBenefitAtAge(pia, 67);
    const b70 = SocialSecurityCalculator.calculateBenefitAtAge(pia, 70);
    const bChoice = SocialSecurityCalculator.calculateBenefitAtAge(pia, choiceAge);

    let data, label;
    if (viewMode === 'cumulative') {
        data = [
            b62 * 12 * (95 - 62),
            b67 * 12 * (95 - 67),
            b70 * 12 * (95 - 70),
            bChoice * 12 * (95 - choiceAge)
        ];
        label = 'Lifetime Total (to 95)';

        // Update stat boxes
        const el62 = document.getElementById('ss62');
        const el67 = document.getElementById('ss67');
        const el70 = document.getElementById('ss70');
        if (el62) el62.textContent = formatCurrency(data[0]);
        if (el67) el67.textContent = formatCurrency(data[1]);
        if (el70) el70.textContent = formatCurrency(data[2]);

        // Hide "Life:" labels
        ['ss62Lifetime', 'ss67Lifetime', 'ss70Lifetime'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        charts.ssComparison.data.labels[3] = `Choice (${choiceAge})`;
    } else {
        data = [
            b62 * 12,
            b67 * 12,
            b70 * 12,
            bChoice * 12
        ];
        label = 'Annual Benefit';

        // Update stat boxes to show monthly values
        const el62 = document.getElementById('ss62');
        const el67 = document.getElementById('ss67');
        const el70 = document.getElementById('ss70');
        if (el62) el62.textContent = formatCurrency(b62) + '/mo';
        if (el67) el67.textContent = formatCurrency(b67) + '/mo';
        if (el70) el70.textContent = formatCurrency(b70) + '/mo';

        // Show and update "Life:" labels
        const life62 = document.getElementById('ss62Lifetime');
        const life67 = document.getElementById('ss67Lifetime');
        const life70 = document.getElementById('ss70Lifetime');
        if (life62) {
            life62.style.display = 'block';
            life62.textContent = 'Life: ' + formatCurrency(b62 * 12 * (95 - 62));
        }
        if (life67) {
            life67.style.display = 'block';
            life67.textContent = 'Life: ' + formatCurrency(b67 * 12 * (95 - 67));
        }
        if (life70) {
            life70.style.display = 'block';
            life70.textContent = 'Life: ' + formatCurrency(b70 * 12 * (95 - 70));
        }

        charts.ssComparison.data.labels[3] = `Choice (${choiceAge})`;
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
    applyTooltipConfig(charts.expensePie.options, false, true);
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
