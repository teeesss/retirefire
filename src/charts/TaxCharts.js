import Chart from 'chart.js/auto';
import { config } from '../data/Config.js';
import { rawData } from '../data/Store.js';
import { charts } from '../state/ChartStore.js';
import { getSafeCtx } from './ChartHelpers.js';
import { formatCurrency } from '../utils/Formatters.js';
import { applyTooltipConfig } from '../utils/tooltipConfig.js';
import { getTotalIncome, calculateNetWorth } from '../state/DataUtils.js';

export function initTaxesChart() {
    const ctx = getSafeCtx('chartTaxes');
    if (!ctx) return;
    const taxes = rawData[config.currentScenario].taxes;

    charts.taxes = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: rawData.years,
            datasets: [
                { label: 'Federal Ordinary', data: taxes.Federal, backgroundColor: '#ef4444', stack: 's1' },
                { label: 'Federal Cap Gains', data: taxes.CapGains, backgroundColor: '#f97316', stack: 's1' },
                { label: 'FICA', data: taxes.FICA, backgroundColor: '#f59e0b', stack: 's1' },
                { label: 'State', data: taxes.State || [], backgroundColor: '#3b82f6', stack: 's1' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true, ticks: { maxTicksLimit: 10 } },
                y: { stacked: true, ticks: { callback: v => formatCurrency(v) } }
            }
        }
    });
    applyTooltipConfig(charts.taxes.options);
    charts.taxes.update();
}

export function initEffectiveTaxChart() {
    const ctx = getSafeCtx('chartEffectiveTax');
    if (!ctx) return;

    const scenario = config.currentScenario;
    const data = rawData[scenario];
    const rates = data.years.map((_, i) => {
        const totalTax = (data.taxes.Federal[i] || 0) + (data.taxes.FICA[i] || 0) + (data.taxes.CapGains[i] || 0) + (data.taxes.State?.[i] || 0);
        const totalInc = (data.income.Work[i] || 0) + (data.income.SocialSecurity[i] || 0) + (data.income.RMD[i] || 0) + (data.income.Drawdown[i] || 0);
        return totalInc > 0 ? (totalTax / totalInc) * 100 : 0;
    });

    charts.effectiveTax = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [{
                label: 'Effective Tax Rate',
                data: rates,
                borderColor: '#8b5cf6',
                backgroundColor: '#8b5cf620',
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { ticks: { callback: v => v.toFixed(1) + '%' } },
                x: { ticks: { maxTicksLimit: 10 } }
            }
        }
    });
    applyTooltipConfig(charts.effectiveTax.options, true);
    charts.effectiveTax.update();
}

export function initRothConversionChart() {
    const ctx = getSafeCtx('chartRothConversion');
    if (!ctx) return;

    const conversions = rawData.years.map((_, i) => {
        const year = rawData.years[i];
        if (year >= config.settings.taxes.rothConvStart && year <= config.settings.taxes.rothConvEnd) {
            return config.settings.taxes.rothConversion;
        }
        return 0;
    });

    charts.rothConversion = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: rawData.years,
            datasets: [{ label: 'Roth Conversions', data: conversions, backgroundColor: '#a855f7' }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { ticks: { callback: v => formatCurrency(v) } } }
        }
    });
    applyTooltipConfig(charts.rothConversion.options);
    charts.rothConversion.update();
}

export function initCumulativeTaxChart() {
    const ctx = getSafeCtx('chartCumulativeTax');
    if (!ctx) return;
    const taxes = rawData[config.currentScenario].taxes;

    let cumSum = 0;
    const cumData = rawData.years.map((_, i) => {
        cumSum += (taxes.Federal[i] || 0) + (taxes.FICA[i] || 0) + (taxes.CapGains[i] || 0) + (taxes.State?.[i] || 0);
        return cumSum;
    });

    charts.cumulativeTax = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [{ label: 'Cumulative Taxes', data: cumData, borderColor: '#ef4444', backgroundColor: '#ef444420', fill: true, tension: 0.4, pointRadius: 0 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { ticks: { callback: (v) => formatCurrency(v) } }, x: { ticks: { maxTicksLimit: 8 } } }
        }
    });
    applyTooltipConfig(charts.cumulativeTax.options);
    charts.cumulativeTax.update();
}

export function initTaxBracketChart() {
    const ctx = getSafeCtx('chartTaxBracket');
    if (!ctx) return;

    const brackets = rawData.years.map((_, i) => {
        const income = getTotalIncome(config.currentScenario, i);
        if (income > 700000) return 37;
        if (income > 400000) return 35;
        if (income > 200000) return 32;
        if (income > 100000) return 24;
        if (income > 50000) return 22;
        if (income > 20000) return 12;
        return 10;
    });

    charts.taxBracket = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: rawData.years,
            datasets: [{ label: 'Tax Bracket', data: brackets, backgroundColor: '#8b5cf6' }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { ticks: { callback: (v) => v + '%' }, max: 40 }, x: { ticks: { maxTicksLimit: 10 } } }
        }
    });
    applyTooltipConfig(charts.taxBracket.options, true);
    charts.taxBracket.update();
}

export function initWithdrawalChart() {
    const ctx = getSafeCtx('chartWithdrawal');
    if (!ctx) return;
    const scenario = config.currentScenario;
    const data = rawData[scenario];
    const drawdown = data.drawdown;
    const income = data.income;

    // We'll show Net vs Tax for each major source
    // Social Security tax is already aggregated in federal taxes, but for visibility 
    // we can estimate it (usually 0-85% is taxable). 
    // For now we focus on the drawdown accounts.

    const taxDeferredGross = (drawdown.RetirementSavings || []).map((v, i) => v + (income.RMD?.[i] || 0));
    const taxDeferredTax = drawdown.RetirementSavingsTax || [];
    const taxDeferredNet = taxDeferredGross.map((v, i) => v - (taxDeferredTax[i] || 0));

    const investmentsGross = drawdown.Investments || [];
    const investmentsTax = drawdown.InvestmentsTax || [];
    const investmentsNet = investmentsGross.map((v, i) => v - (investmentsTax[i] || 0));

    charts.withdrawal = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: rawData.years,
            datasets: [
                {
                    label: 'Social Security',
                    data: income.SocialSecurity || [],
                    backgroundColor: '#64748b',
                    stack: 's1'
                },
                {
                    label: 'Cash Savings',
                    data: drawdown.CashSavings || [],
                    backgroundColor: '#84cc16',
                    stack: 's1'
                },
                // Investments
                {
                    label: 'Taxable (Net)',
                    data: investmentsNet,
                    backgroundColor: '#f59e0b',
                    stack: 's1'
                },
                {
                    label: 'Taxable (Tax)',
                    data: investmentsTax,
                    backgroundColor: '#f59e0b80', // Lighter color for tax leakage
                    stack: 's1'
                },
                // Retirement Savings
                {
                    label: 'Tax-Deferred (Net)',
                    data: taxDeferredNet,
                    backgroundColor: '#3b82f6',
                    stack: 's1'
                },
                {
                    label: 'Tax-Deferred (Tax)',
                    data: taxDeferredTax,
                    backgroundColor: '#3b82f680', // Lighter color for tax leakage
                    stack: 's1'
                },
                {
                    label: 'HSA',
                    data: drawdown.HSA || [],
                    backgroundColor: '#8b5cf6',
                    stack: 's1'
                },
                {
                    label: 'Roth IRA',
                    data: drawdown.RothIRA || [],
                    backgroundColor: '#10b981',
                    stack: 's1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    ticks: { maxTicksLimit: 10 }
                },
                y: {
                    stacked: true,
                    ticks: { callback: (v) => formatCurrency(v) }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        afterBody: (context) => {
                            const index = context[0].dataIndex;
                            const invGross = (investmentsNet[index] || 0) + (investmentsTax[index] || 0);
                            const defGross = (taxDeferredNet[index] || 0) + (taxDeferredTax[index] || 0);
                            const totalWithdrawal = invGross + defGross + (drawdown.RothIRA?.[index] || 0) + (drawdown.HSA?.[index] || 0) + (drawdown.CashSavings?.[index] || 0) + (income.SocialSecurity?.[index] || 0);
                            const totalTax = (investmentsTax[index] || 0) + (taxDeferredTax[index] || 0);

                            if (totalWithdrawal > 0) {
                                const efficiency = ((1 - (totalTax / totalWithdrawal)) * 100).toFixed(1);
                                return `\nTax Efficiency: ${efficiency}%`;
                            }
                            return '';
                        }
                    }
                }
            }
        }
    });
    applyTooltipConfig(charts.withdrawal.options);
    charts.withdrawal.update();
}

export function initSWRChart() {
    const ctx = getSafeCtx('chartSWR');
    if (!ctx) return;

    const swrData = rawData.years.map((_, i) => {
        const netWorth = calculateNetWorth(config.currentScenario, i);
        const drawdown = rawData[config.currentScenario].income.Drawdown?.[i] || 0;
        return netWorth > 0 ? (drawdown / netWorth) * 100 : 0;
    });

    charts.swr = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [
                { label: 'Your Rate', data: swrData, borderColor: '#10b981', backgroundColor: '#10b98120', fill: true, tension: 0.4, pointRadius: 0 },
                { label: '4% Rule', data: Array(46).fill(4), borderColor: '#f59e0b', borderDash: [5, 5], fill: false, pointRadius: 0 },
                { label: 'Danger Zone', data: Array(46).fill(6), borderColor: '#ef4444', borderDash: [5, 5], fill: false, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { ticks: { callback: (v) => v.toFixed(1) + '%' }, max: 10, min: 0 }, x: { ticks: { maxTicksLimit: 10 } } }
        }
    });
    applyTooltipConfig(charts.swr.options, true);
    charts.swr.update();
}

export function initRMDChart() {
    const ctx = getSafeCtx('chartRMD');
    if (!ctx) return;
    const rmdData = rawData[config.currentScenario].income.RMD || [];

    charts.rmd = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: rawData.years,
            datasets: [{ label: 'RMD', data: rmdData, backgroundColor: '#06b6d4' }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { ticks: { callback: (v) => formatCurrency(v) } }, x: { ticks: { maxTicksLimit: 10 } } }
        }
    });
    applyTooltipConfig(charts.rmd.options);
    charts.rmd.update();
}
