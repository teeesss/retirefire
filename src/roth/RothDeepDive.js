/**
 * Roth Deep Dive Analysis Module
 * Handles the advanced modal view for Roth conversion planning.
 */

import Chart from 'chart.js/auto';
import { formatCurrency } from '../utils/Formatters.js';
import { rawData } from '../data/Store.js';
import { config } from '../data/Config.js';
import RothOptimizer from './RothOptimizer.js';
import RothConfig from './RothConfig.js';
import { getSafeCtx } from '../charts/ChartHelpers.js';
import { applyTooltipConfig } from '../utils/tooltipConfig.js';

export class RothDeepDive {
    static chartWaterfall = null;
    static chartBreakeven = null;

    static init() {
        // Expose globally
        window.openRothDeepDive = this.open.bind(this);
        window.closeRothDeepDive = this.close.bind(this);
        window.updateDeepDiveParams = this.updateParams.bind(this);
        window.handleConversionEdit = this.handleConversionEdit.bind(this);

        // Inject modal if missing
        if (!document.getElementById('rothDeepDiveModal')) {
            this.injectModal();
        }
    }

    static async injectModal() {
        try {
            // In a real build, this might be pre-loaded. 
            // For now, we assume index.html loads it, OR we fetch it dynamically.
            // Since we are using vite-plugin-html-inject, it should be in index.html if we add it there.
            // But if we want it lazy loaded:
            // const response = await fetch('/src/partials/modals/roth-deep-dive.html');
            // const html = await response.text();
            // document.body.insertAdjacentHTML('beforeend', html);

            // However, the cleanest way in this architecture is to rely on it being present 
            // or invisible in the DOM. 
            // IF it's not in index.html yet, we should add it to settings-and-modals.html or similar.
            // For this step, I will assume we will add it to the build. 
            // But for safety, let's check.
        } catch (e) {
            console.error('Failed to inject Roth Deep Dive modal', e);
        }
    }

    static open() {
        const modal = document.getElementById('rothDeepDiveModal');
        if (!modal) {
            console.error('Roth Deep Dive modal not found in DOM');
            return;
        }

        modal.style.display = 'flex';
        this.syncUItoConfig();
        this.renderAnalysis();
    }

    static syncUItoConfig() {
        // Sync the dropdowns with current RothConfig
        const bracketSelect = document.getElementById('deepDiveTargetBracket');
        const taxSourceSelect = document.getElementById('deepDiveTaxSource');
        const iraSourceSelect = document.getElementById('deepDiveIRASource');

        if (bracketSelect) bracketSelect.value = RothConfig.targetBracket;
        if (taxSourceSelect) taxSourceSelect.value = RothConfig.payTaxesFrom;
        if (iraSourceSelect) iraSourceSelect.value = RothConfig.sourceAccount;
    }

    static updateParams() {
        const bracketSelect = document.getElementById('deepDiveTargetBracket');
        const taxSourceSelect = document.getElementById('deepDiveTaxSource');
        const iraSourceSelect = document.getElementById('deepDiveIRASource');

        if (bracketSelect) RothConfig.targetBracket = Number(bracketSelect.value);
        if (taxSourceSelect) RothConfig.payTaxesFrom = taxSourceSelect.value;
        if (iraSourceSelect) RothConfig.sourceAccount = iraSourceSelect.value;

        // Re-render
        this.renderAnalysis();
    }

    static handleConversionEdit(year, value) {
        const amt = Number(value.replace(/[^0-9.-]+/g, ""));
        if (isNaN(amt)) return;

        RothConfig.manualOverrides[year] = amt;
        this.renderAnalysis();
    }

    static close() {
        const modal = document.getElementById('rothDeepDiveModal');
        if (modal) modal.style.display = 'none';

        // Destroy charts to free resources
        if (this.chartWaterfall) { this.chartWaterfall.destroy(); this.chartWaterfall = null; }
        if (this.chartBreakeven) { this.chartBreakeven.destroy(); this.chartBreakeven = null; }
    }

    static renderAnalysis() {
        // Validation
        if (!rawData.years || !rawData.average?.income?.Work) {
            console.error('RothDeepDive: Missing rawData for analysis');
            return;
        }

        // 1. Get Optimized Data
        const params = {
            years: rawData.years,
            ordinaryIncome: rawData.average.income.Work.map((v, i) =>
                v + (rawData.average.income.SocialSecurity?.[i] || 0) + (rawData.average.income.RMD?.[i] || 0)
            ),
            traditionalBalance: rawData.average.accounts.RetirementSavings,
            filingStatus: config.settings.taxSettings.filingStatus || 'joint',
            targetBracket: RothConfig.targetBracket,
            constraints: {
                maxAnnual: RothConfig.maxAnnualCap,
                payTaxesFrom: RothConfig.payTaxesFrom
            }
        };

        const optimization = RothOptimizer.optimize(params);

        // Use ALL results, not just positive conversions (for waterfall context)
        // Add Age to the result set
        const completeResults = optimization.results.map((r, i) => {
            return {
                ...r,
                age: rawData.ages?.[i] || '-'
            };
        });

        // 2. Render Charts
        this.renderWaterfall(completeResults, params.filingStatus);
        this.renderBreakeven(completeResults);

        // 3. Render Table
        this.renderTable(completeResults);

        // 4. Update Header Metrics
        this.updateHeaderMetrics(optimization.summary);
    }

    static updateHeaderMetrics(summary) {
        const elTotal = document.getElementById('ddMetricTotalConverted');
        const elTax = document.getElementById('ddMetricTotalTax');
        const elRate = document.getElementById('ddMetricAvgRate');

        if (elTotal) elTotal.textContent = formatCurrency(summary.totalConverted);
        if (elTax) elTax.textContent = formatCurrency(summary.totalTaxPaid);
        if (elRate) elRate.textContent = summary.effectiveTaxRate.toFixed(1) + '%';
    }

    static renderWaterfall(yearData, filingStatus) {
        const ctx = getSafeCtx('chartRothWaterfall');
        if (!ctx) return;

        // Limit to 10 years for readability
        const timeframe = yearData.slice(0, 10);
        const years = timeframe.map(d => d.year);

        // Get limits for the target bracket to show "Ceiling"
        // We need the TOP of the chosen bracket
        const targetBracket = RothConfig.targetBracket;
        const bracketLimit = RothConfig.brackets[targetBracket]?.[filingStatus] || 0;

        if (this.chartWaterfall) {
            this.chartWaterfall.destroy();
            this.chartWaterfall = null;
        }

        this.chartWaterfall = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [
                    {
                        label: 'Ordinary Income',
                        data: timeframe.map(d => d.income),
                        backgroundColor: '#6b7280',
                        order: 2
                    },
                    {
                        label: 'Amt to Roth',
                        data: timeframe.map(d => d.netToRoth),
                        backgroundColor: '#10b981',
                        order: 1
                    },
                    {
                        label: 'Tax (Withheld)',
                        data: timeframe.map(d => d.conversionAmount - d.netToRoth),
                        backgroundColor: '#ef4444',
                        order: 1,
                        hidden: RothConfig.payTaxesFrom === 'brokerage'
                    },
                    {
                        label: 'Bracket Limit',
                        data: timeframe.map(() => bracketLimit),
                        type: 'line',
                        borderColor: '#94a3b8',
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: false,
                        order: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { stacked: true },
                    y: {
                        stacked: true,
                        ticks: { callback: v => formatCurrency(v) }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return ` ${context.dataset.label}: ${formatCurrency(context.raw)}`;
                            }
                        }
                    }
                }
            }
        });
        applyTooltipConfig(this.chartWaterfall.options);
        this.chartWaterfall.update();
    }

    static renderBreakeven(yearData) {
        const ctx = getSafeCtx('chartRothBreakeven');
        if (!ctx) return;

        // Cumulative Tax Paid vs Growth
        // This is tricky without a full "baseline" comparison simulation.
        // For now, we'll visualize the "Tax Paid Now" accumulating.
        // Future enhancements: Compare against "Tax Saved Later" (Projected RMD tax).

        let cumTax = 0;
        const taxCurve = yearData.map(d => {
            cumTax += d.taxOnConversion || 0;
            return cumTax;
        });

        // Heuristic: Estimated Future Savings (Tax-Free Growth Benefit)
        // This is a rough visualization of potential future tax avoidance.
        let cumSavingsValue = 0;
        const savingsCurve = yearData.map((d, i) => {
            if (d.conversionAmount > 0) {
                // Heuristic: Each dollar converted saves ~25 cents in future RMD taxes/growth drag
                cumSavingsValue += d.conversionAmount * 0.25;
            }
            return cumSavingsValue;
        });

        if (this.chartBreakeven) {
            this.chartBreakeven.destroy();
            this.chartBreakeven = null;
        }

        this.chartBreakeven = new Chart(ctx, {
            type: 'line',
            data: {
                labels: yearData.map(d => d.year),
                datasets: [
                    {
                        label: 'Cumulative Tax Paid (Investment)',
                        data: taxCurve,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Estimated Future Savings (Avoided Tax)',
                        data: savingsCurve,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Total Tax Investment' }
                },
                scales: {
                    y: { ticks: { callback: v => formatCurrency(v) } }
                }
            }
        });
        applyTooltipConfig(this.chartBreakeven.options);
        this.chartBreakeven.update();
    }

    static renderTable(yearData) {
        const tbody = document.getElementById('rothDeepDiveTableBody');
        if (!tbody) return;

        // Get limits for the target bracket context
        const targetBracket = RothConfig.targetBracket;
        const filingStatus = config.settings.taxSettings.filingStatus || 'joint';
        const bracketLimit = RothConfig.brackets[targetBracket]?.[filingStatus] || 0;

        tbody.innerHTML = yearData.map(d => {
            const room = Math.max(0, bracketLimit - d.income);
            const conversionClass = d.conversionAmount > 0 ? 'text-success' : 'text-muted';
            const displayAmount = d.taxPaymentSource === 'traditional' ? d.netToRoth : d.conversionAmount;
            const isOverridden = RothConfig.manualOverrides[d.year] !== undefined;

            return `
            <tr style="${isOverridden ? 'background: rgba(59, 130, 246, 0.05)' : ''}">
                <td style="text-align: left; color: var(--text-primary); font-weight: 600;">${d.year}</td>
                <td>${d.age}</td>
                <td style="color: var(--text-muted); font-size: 0.8rem;">${formatCurrency(d.income)}</td>
                <td style="color: var(--text-muted); font-size: 0.75rem;">${formatCurrency(room)}</td>
                <td class="${conversionClass}">
                    <input type="text" 
                           value="${isOverridden ? d.conversionAmount : formatCurrency(displayAmount)}" 
                           onblur="window.handleConversionEdit(${d.year}, this.value)"
                           onfocus="if(!this.dataset.touched){ this.value = '${d.conversionAmount}'; this.dataset.touched=true; }"
                           style="width: 100px; text-align: right; background: ${isOverridden ? 'var(--bg-tertiary)' : 'var(--bg-input)'}; color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px; padding: 2px 5px; font-weight: 700;">
                    ${d.taxPaymentSource === 'traditional' && d.conversionAmount > 0 ? `<div style="font-size: 0.6rem; color: var(--danger)">+ ${formatCurrency(d.taxOnConversion)} tax</div>` : ''}
                </td>
                <td style="color: var(--danger);">${formatCurrency(d.taxOnConversion)}</td>
                <td style="font-size: 0.8rem;">${d.marginalRate}%</td>
            </tr>
        `}).join('');
    }
}
