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
            constraints: { maxAnnual: RothConfig.maxAnnualCap }
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
                        label: 'Roth Calculation',
                        data: timeframe.map(d => d.conversionAmount),
                        backgroundColor: '#10b981',
                        order: 1
                    },
                    {
                        label: 'Bracket Limit',
                        data: timeframe.map(() => bracketLimit),
                        type: 'line',
                        borderColor: '#ef4444',
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
            cumTax += d.taxCost;
            return cumTax;
        });

        // Heuristic: Estimated Future Savings (assuming significant growth + higher tax later)
        // Assume money doubles every 10 years (7%)
        let cumSavings = 0;
        const savingsCurve = yearData.map((d, i) => {
            // Rough heuristic: The converted amount would have grown and been taxed at RMD rates.
            // Let's assume a slightly higher future tax rate (loss aversion) or same rate.
            // Savings = (Conversion * Growth * FutureRate) - (TaxPaidNow) ? 
            // Simpler: Just show the raw Cumulative Tax Cost for now, users asked for "Cost Analysis"
            return d.taxCost; // Placeholder for now, needs real math
        });

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
            const conversionClass = d.conversionAmount > 0 ? 'text-success font-bold' : 'text-muted';

            return `
            <tr>
                <td style="text-align: left; color: var(--text-primary); font-weight: 600;">${d.year}</td>
                <td>${d.age}</td>
                <td>${formatCurrency(d.income)}</td>
                <td style="color: var(--text-muted);">${formatCurrency(room)}</td>
                <td class="${conversionClass}" style="color: ${d.conversionAmount > 0 ? 'var(--success)' : ''}">${formatCurrency(d.conversionAmount)}</td>
                <td style="color: var(--danger);">${formatCurrency(d.taxCost)}</td>
                <td>${d.marginalRate}%</td>
            </tr>
        `}).join('');
    }
}
