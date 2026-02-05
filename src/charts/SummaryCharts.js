import Chart from 'chart.js/auto';
import { config } from '../data/Config.js';
import { rawData } from '../data/Store.js';
import { charts, destroyChart } from '../state/ChartStore.js';
import { getSafeCtx, validateData } from './ChartHelpers.js';
import { formatCurrency } from '../utils/Formatters.js';
import { applyTooltipConfig } from '../utils/tooltipConfig.js';
import { getNetWorthSeries } from '../state/DataUtils.js';
import { colors, scenarioColors, accountNames } from '../data/Constants.js';

export function initNetWorthChart() {
    destroyChart('netWorth');
    const ctx = getSafeCtx('chartNetWorth');
    if (!ctx) return;

    const optData = getNetWorthSeries('optimistic');
    const avgData = getNetWorthSeries('average');
    const pesData = getNetWorthSeries('pessimistic');

    const datasets = [
        {
            label: 'Optimistic',
            data: optData,
            borderColor: scenarioColors.optimistic,
            backgroundColor: scenarioColors.optimistic + '20',
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            hidden: config.currentScenario !== 'optimistic' && config.currentScenario !== 'all'
        },
        {
            label: 'Average',
            data: avgData,
            borderColor: scenarioColors.average,
            backgroundColor: scenarioColors.average + '20',
            fill: true,
            tension: 0.4,
            pointRadius: 0
        },
        {
            label: 'Pessimistic',
            data: pesData,
            borderColor: scenarioColors.pessimistic,
            backgroundColor: scenarioColors.pessimistic + '20',
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            hidden: config.currentScenario !== 'pessimistic' && config.currentScenario !== 'all'
        }
    ];

    charts.netWorth = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'top', labels: { boxWidth: 12, padding: 8 } }
            },
            scales: {
                y: { ticks: { callback: (v) => formatCurrency(v) } },
                x: { ticks: { maxTicksLimit: 10 } }
            }
        }
    });
    applyTooltipConfig(charts.netWorth.options);
    charts.netWorth.update();
}

export function initSuccessGauge() {
    destroyChart('successGauge');
    const ctx = getSafeCtx('gaugeSuccess');
    if (!ctx) return;

    const successRate = (rawData.monteCarlo?.successRate || 95);

    charts.successGauge = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [successRate, 100 - successRate],
                backgroundColor: [successRate > 80 ? '#10b981' : successRate > 60 ? '#f59e0b' : '#ef4444', '#e5e7eb'],
                borderWidth: 0,
                circumference: 180,
                rotation: 270,
                cutout: '80%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } }
        }
    });
}

export function initAllocationChart() {
    destroyChart('allocation');
    const ctx = getSafeCtx('chartAllocation');
    if (!ctx) return;

    const alloc = config.settings.glidePath;
    const data = [alloc.stocks, alloc.bonds, alloc.cash, alloc.crypto];
    const labels = ['Stocks', 'Bonds', 'Cash', 'Crypto'];
    const bgColors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

    charts.allocation = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: bgColors,
                borderWidth: 2,
                borderColor: config.theme === 'dark' ? '#1f2937' : '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15 } }
            },
            cutout: '65%'
        }
    });
    applyTooltipConfig(charts.allocation.options, true, true);
    charts.allocation.update();
}

export function initMoneyFlowChart() {
    destroyChart('moneyFlow');
    const ctx = getSafeCtx('chartMoneyFlow');
    if (!ctx) return;

    let scenario = config.currentScenario;
    if (scenario === 'all') scenario = 'average';
    const data = rawData[scenario];
    if (!data || !data.income) return; // Safeguard if data not yet available

    const yearCount = data.yearsCount || (rawData.years ? rawData.years.length : 0);
    const years = rawData.years || [];

    const taxes = [];
    const expenses = [];
    const savings = [];

    console.log(`📊 Initializing Money Flow Chart [Scenario: ${config.currentScenario}]`);
    console.log(`   - Data structure: ${data ? 'OK' : 'MISSING'}`);
    console.log(`   - Income categories: ${Object.keys(data.income || {}).join(', ')}`);

    for (let i = 0; i < yearCount; i++) {
        const inc = (data.income?.Work?.[i] || 0) + (data.income?.SocialSecurity?.[i] || 0) + (data.income?.Drawdown?.[i] || 0) + (data.income?.RMD?.[i] || 0);
        const tax = (data.taxes?.Federal?.[i] || 0) + (data.taxes?.FICA?.[i] || 0) + (data.taxes?.CapGains?.[i] || 0) + (data.taxes?.State?.[i] || 0);
        const exp = (data.expenses?.General?.[i] || 0) + (data.expenses?.Housing?.[i] || 0) + (data.expenses?.Medical?.[i] || 0) + (data.expenses?.LTC?.[i] || 0);

        // Savings is surplus income.
        const surplus = inc - tax - exp;

        taxes.push(tax);
        expenses.push(exp);
        savings.push(Math.max(0, surplus));
    }

    if (!validateData(taxes, 'Money Flow Taxes') && !validateData(expenses, 'Money Flow Expenses')) {
        console.error('❌ Critical: Money Flow Chart has no renderable data. Rendering will proceed but chart may appear empty.');
    }

    charts.moneyFlow = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [
                { label: 'Taxes', data: taxes, backgroundColor: '#ef4444', stack: 's1' },
                { label: 'Expenses', data: expenses, backgroundColor: '#f59e0b', stack: 's1' },
                { label: 'Savings', data: savings, backgroundColor: '#10b981', stack: 's1' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { stacked: true, ticks: { maxTicksLimit: 10 } }, y: { stacked: true, ticks: { callback: v => formatCurrency(v) } } }
        }
    });
    applyTooltipConfig(charts.moneyFlow.options);
    charts.moneyFlow.update();
}

export function initRealNominalChart() {
    destroyChart('realNominal');
    const ctx = getSafeCtx('chartRealNominal');
    if (!ctx) return;
    let scenario = config.currentScenario;
    if (scenario === 'all') scenario = 'average';
    const nominal = getNetWorthSeries(scenario);
    const inflationRate = (config.settings.inflation?.[scenario] || 2.5) / 100;
    const real = nominal.map((v, i) => v / Math.pow(1 + inflationRate, i));

    charts.realNominal = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [
                { label: 'Nominal', data: nominal, borderColor: '#3b82f6', backgroundColor: '#3b82f620', fill: true, tension: 0.4, pointRadius: 0 },
                { label: 'Real', data: real, borderColor: '#10b981', backgroundColor: '#10b98120', fill: true, tension: 0.4, pointRadius: 0 }
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
                y: { ticks: { callback: (v) => formatCurrency(v) } },
                x: { ticks: { maxTicksLimit: 8 } }
            }
        }
    });
    applyTooltipConfig(charts.realNominal.options);
    charts.realNominal.update();
}

export function initStackedPortfolioChart() {
    destroyChart('stackedPortfolio');
    const ctx = getSafeCtx('chartStackedPortfolio');
    if (!ctx) return;
    let scenario = config.currentScenario;
    if (scenario === 'all') scenario = 'average';
    const accounts = rawData[scenario].accounts;

    charts.stackedPortfolio = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: Object.keys(accounts).filter(k => k !== 'Debt').map(key => ({
                label: accountNames[key] || key,
                data: accounts[key],
                backgroundColor: (colors[key] || '#6b7280') + '80',
                borderColor: colors[key],
                fill: true,
                pointRadius: 0
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'top', labels: { boxWidth: 12, padding: 8 } } },
            scales: {
                y: { stacked: true, ticks: { callback: (v) => formatCurrency(v) } },
                x: { ticks: { maxTicksLimit: 10 } }
            }
        }
    });
    applyTooltipConfig(charts.stackedPortfolio.options);
    charts.stackedPortfolio.update();
}
