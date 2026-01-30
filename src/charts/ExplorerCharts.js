import Chart from 'chart.js/auto';
import { config } from '../data/Config.js';
import { rawData } from '../data/Store.js';
import { charts } from '../state/ChartStore.js';
import { getSafeCtx } from './ChartHelpers.js';
import { formatCurrency } from '../utils/Formatters.js';
import { applyTooltipConfig } from '../utils/tooltipConfig.js';
import { SocialSecurityCalculator } from '../utils/SocialSecurityCalculator.js';

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
    updateSSExplorerChart();
}

export function updateSSExplorerChart() {
    if (!charts.ssExplorer) return;

    // Get current income and profile from config or use defaults
    const currentIncome = config.profile?.income || 100000;
    const profile = config.profile?.careerProfile || 'high'; // low, medium, high, max

    // Calculate PIA
    // Check if manual input exists and use it, otherwise calculate from profile
    const manualPiaInput = document.getElementById('ssPiaInput');
    const pia = manualPiaInput ? parseFloat(manualPiaInput.value) : SocialSecurityCalculator.calculatePIA(currentIncome, profile);

    // Recalculate benefits with the current PIA
    const benefits = SocialSecurityCalculator.calculateBenefits(pia);

    // Generate years array for projection
    const years = rawData.years || [];
    const ages = rawData.ages || [];

    // Create data series for each claiming age (62, 67, 70)
    // We want to show the cumulative or annual benefit over time for each strategy
    // For "Strategy Strategy", normally we show the break-even lines (Cumulative)

    // Strategy 1: Claim at 62
    const data62 = years.map((y, i) => {
        const age = ages[i];
        if (age < 62) return 0;
        // Annual benefit (monthly * 12) + COLA (assume 2.5% inflation in model)
        // For simplicity here, we just show the base annual amount adjusted for inflation implicitly by the model elsewhere, 
        // but here let's just show the nominal benefit flow or cumulative.
        // User asked for "Strategy Graph", usually comparison of cumulative benefits.

        // Let's do Cumulative for the "Strategy" view as it's best for break-even.
        // But the labels in the chart init were "Claim @ 62", etc.
        return (age >= 62) ? ((age - 62) * benefits.ss62 * 12) + (benefits.ss62 * 12) : 0; // Simple cumulative approximation
    });

    // Let's refine: The chart is likely "Cumulative Benefits over Time" to show break-even.
    // Calculate cumulative sum
    let sum62 = 0;
    const series62 = years.map((y, i) => {
        const age = ages[i];
        if (age >= 62) sum62 += (benefits.ss62 * 12); // Add annual benefit
        return sum62;
    });

    let sum67 = 0;
    const series67 = years.map((y, i) => {
        const age = ages[i];
        if (age >= 67) sum67 += (benefits.ss67 * 12);
        return sum67;
    });

    let sum70 = 0;
    const series70 = years.map((y, i) => {
        const age = ages[i];
        if (age >= 70) sum70 += (benefits.ss70 * 12);
        return sum70;
    });

    charts.ssExplorer.data.labels = years;
    charts.ssExplorer.data.datasets[0].data = series62; // Claim @ 62
    charts.ssExplorer.data.datasets[1].data = series67; // Claim @ 67
    charts.ssExplorer.data.datasets[2].data = series70; // Claim @ 70

    charts.ssExplorer.update();

    // Calculate current monthly benefit based on claim age
    const claimAge = config.settings.socialSecurity.claimAge || 67;
    const benefitAtClaimAge = SocialSecurityCalculator.calculateBenefitAtAge(pia, claimAge);

    // Update Top Stats (First Card)
    if (document.getElementById('ssMonthlyValue')) document.getElementById('ssMonthlyValue').innerText = formatCurrency(benefitAtClaimAge);
    if (document.getElementById('ssAnnualValue')) document.getElementById('ssAnnualValue').innerText = formatCurrency(benefitAtClaimAge * 12);
    if (document.getElementById('ssLifetimeValue')) document.getElementById('ssLifetimeValue').innerText = formatCurrency(benefitAtClaimAge * 12 * (95 - claimAge));

    // Update Comparison Stats (Second Card)
    if (document.getElementById('ss62')) document.getElementById('ss62').textContent = formatCurrency(benefits.ss62) + '/mo';
    if (document.getElementById('ss67')) document.getElementById('ss67').textContent = formatCurrency(benefits.ss67) + '/mo';
    if (document.getElementById('ss70')) document.getElementById('ss70').textContent = formatCurrency(benefits.ss70) + '/mo';

    if (document.getElementById('ss70Lifetime')) document.getElementById('ss70Lifetime').textContent = 'Life: ' + formatCurrency(benefits.ss70 * 12 * (95 - 70));

    // Highlight Active Strategy
    const boxes = ['ssComparisonBox62', 'ssComparisonBox67', 'ssComparisonBox70'];
    boxes.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.border = '1px solid var(--border-color)';
            el.style.transform = 'scale(1)';
            el.style.boxShadow = 'none';
        }
    });

    let activeId = null;
    if (claimAge === 62) activeId = 'ssComparisonBox62';
    else if (claimAge === 67) activeId = 'ssComparisonBox67';
    else if (claimAge === 70) activeId = 'ssComparisonBox70';

    if (activeId) {
        const el = document.getElementById(activeId);
        if (el) {
            el.style.border = '2px solid var(--primary-color)';
            el.style.transform = 'scale(1.02)';
            el.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        }
    }
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
    updateRothExplorerChart();
}

export function initRothTaxImpactChart() {
    const ctx = getSafeCtx('chartRothTaxImpact');
    if (!ctx) return;

    charts.rothTaxImpact = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [
                { label: 'Baseline Taxes', data: [], borderColor: 'rgba(239, 68, 68, 0.5)', borderDash: [5, 5], fill: false, tension: 0.4, pointRadius: 0 },
                { label: 'With Roth Strategy', data: [], borderColor: '#10b981', fill: false, tension: 0.4, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: { y: { ticks: { callback: (v) => formatCurrency(v) } } }
        }
    });
    applyTooltipConfig(charts.rothTaxImpact.options);
    updateRothTaxImpactChart();
}

export function updateRothTaxImpactChart() {
    const scenario = config.currentScenario || 'average';
    if (!charts.rothTaxImpact || !rawData[scenario]) return;

    const baseTaxes = rawData.baseline ? rawData.baseline.expenses.Taxes : rawData[scenario].expenses.Taxes;
    const rothTaxes = rawData[scenario].expenses.Taxes;

    let baseCum = 0, rothCum = 0;
    const baseCumData = baseTaxes.map(v => baseCum += v);
    const rothCumData = rothTaxes.map(v => rothCum += v);

    charts.rothTaxImpact.data.datasets[0].data = baseCumData;
    charts.rothTaxImpact.data.datasets[1].data = rothCumData;
    charts.rothTaxImpact.update();
}

export function updateRothExplorerChart() {
    const scenario = config.currentScenario || 'average';
    if (!charts.rothExplorer || !rawData[scenario]) return;

    const baselineData = rawData.baseline ? rawData.baseline.netWorth : rawData[scenario].netWorth;
    const rothData = rawData[scenario].netWorth;

    // If roth is disabled, baseline and roth are the same
    charts.rothExplorer.data.datasets[0].data = baselineData;
    charts.rothExplorer.data.datasets[1].data = rothData;

    // Update colors/labels if roth is disabled to reflect current state
    if (!config.settings.taxes.rothConversionEnabled) {
        charts.rothExplorer.data.datasets[1].label = 'Roth Disabled';
        charts.rothExplorer.data.datasets[1].borderColor = '#9ca3af';
    } else {
        charts.rothExplorer.data.datasets[1].label = 'With Roth Strategy';
        charts.rothExplorer.data.datasets[1].borderColor = '#8b5cf6';
    }

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

export function initStressTestChart() {
    const ctx = getSafeCtx('chartStressTest');
    if (!ctx) return;

    charts.stressTest = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [
                { label: 'Baseline', data: [], borderColor: 'rgba(59, 130, 246, 0.5)', borderDash: [5, 5], tension: 0.4, pointRadius: 0 },
                { label: 'Stressed', data: [], borderColor: '#ef4444', tension: 0.4, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: { y: { ticks: { callback: v => formatCurrency(v) } } }
        }
    });
    applyTooltipConfig(charts.stressTest.options);
    updateStressTestChart();
}

export function updateStressTestChart() {
    if (!charts.stressTest) return;

    // Default or current scenario
    const baselineData = rawData.average?.netWorth || [];
    charts.stressTest.data.labels = rawData.years;
    charts.stressTest.data.datasets[0].data = baselineData;

    // Stressed data is populated by ExplorerHandler.runStressTest
    // If empty, just show baseline
    if (charts.stressTest.data.datasets[1].data.length === 0) {
        charts.stressTest.data.datasets[1].data = baselineData;
    }

    charts.stressTest.update();
}
