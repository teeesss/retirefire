/**
 * Roth Deep Dive Analysis Module
 * Handles the advanced modal view for Roth conversion planning.
 */

import { Logger } from '../utils/Logger.js';
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
    static selectedStrategy = null;

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
            Logger.error('Failed to inject Roth Deep Dive modal', e);
        }
    }

    static open() {
        const modal = document.getElementById('rothDeepDiveModal');
        if (!modal) {
            Logger.error('Roth Deep Dive modal not found in DOM');
            return;
        }

        // Inject constraint explanation div if it doesn't exist
        if (!document.getElementById('constraintExplanation')) {
            const controlsBar = modal.querySelector('[style*="background: var(--bg-secondary)"]');
            if (controlsBar) {
                const explanationHTML = `
                    <div id="constraintExplanation" style="background: rgba(59, 130, 246, 0.1); padding: 10px 20px; border-bottom: 1px solid var(--border-color); display: none;">
                        <div style="font-size: 0.75rem; color: var(--text-primary);">
                            <strong>Strategy:</strong> <span id="effectiveLimitDisplay">Loading...</span>
                        </div>
                        <div id="constraintDetails" style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px;">
                            <!-- Dynamically updated based on inputs -->
                        </div>
                    </div>
                `;
                controlsBar.insertAdjacentHTML('afterend', explanationHTML);
            }
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
        const maxAnnualInput = document.getElementById('deepDiveMaxAnnual');

        if (bracketSelect) bracketSelect.value = RothConfig.targetBracket;
        if (taxSourceSelect) taxSourceSelect.value = RothConfig.payTaxesFrom;
        if (iraSourceSelect) iraSourceSelect.value = RothConfig.sourceAccount;
        if (maxAnnualInput) maxAnnualInput.value = RothConfig.maxAnnualCap || '';

        this.updateConstraintExplanation();
    }

    static updateParams() {
        const bracketSelect = document.getElementById('deepDiveTargetBracket');
        const taxSourceSelect = document.getElementById('deepDiveTaxSource');
        const iraSourceSelect = document.getElementById('deepDiveIRASource');
        const maxAnnualInput = document.getElementById('deepDiveMaxAnnual');

        if (bracketSelect) RothConfig.targetBracket = Number(bracketSelect.value);
        if (taxSourceSelect) RothConfig.payTaxesFrom = taxSourceSelect.value;
        if (iraSourceSelect) RothConfig.sourceAccount = iraSourceSelect.value;

        // NEW: Read max annual cap
        if (maxAnnualInput) {
            const value = Number(maxAnnualInput.value);
            RothConfig.maxAnnualCap = value > 0 ? value : null;
        }

        // Update constraint explanation
        this.updateConstraintExplanation();

        // Re-render
        this.renderAnalysis();
    }

    static handleConversionEdit(year, value) {
        const amt = Number(value.replace(/[^0-9.-]+/g, ""));
        if (isNaN(amt)) return;

        RothConfig.manualOverrides[year] = amt;
        this.renderAnalysis();
    }

    /**
     * Update the constraint explanation display
     * Shows the combined strategy in plain English
     */
    static updateConstraintExplanation() {
        const explanationDiv = document.getElementById('constraintExplanation');
        const limitDisplay = document.getElementById('effectiveLimitDisplay');
        const detailsDiv = document.getElementById('constraintDetails');

        if (!explanationDiv || !limitDisplay || !detailsDiv) return;

        const maxAnnual = RothConfig.maxAnnualCap;
        const targetBracket = RothConfig.targetBracket;

        if (!maxAnnual) {
            // No max annual cap - bracket only
            explanationDiv.style.display = 'none';
            return;
        }

        // Show explanation
        explanationDiv.style.display = 'block';

        // Build explanation text
        limitDisplay.textContent = `Fill ${targetBracket}% bracket OR $${formatCurrency(maxAnnual, 0)} per year (whichever is less)`;

        detailsDiv.innerHTML = `
            <div style="display: flex; gap: 20px; align-items: center;">
                <div>
                    <strong>📊 Bracket Limit:</strong> Fill up to ${targetBracket}% bracket each year
                </div>
                <div>
                    <strong>💰 Annual Cap:</strong> Maximum $${formatCurrency(maxAnnual, 0)}/year
                </div>
                <div style="color: var(--success);">
                    <strong>✓ Combined:</strong> Uses the lesser of the two
                </div>
            </div>
        `;
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
            Logger.error('RothDeepDive: Missing rawData for analysis');
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
        const elBreakEven = document.getElementById('ddMetricBreakEven');

        if (elTotal) elTotal.textContent = formatCurrency(summary.totalConverted);
        if (elTax) elTax.textContent = formatCurrency(summary.totalTaxPaid);
        if (elRate) elRate.textContent = summary.effectiveTaxRate.toFixed(1) + '%';

        // Calculate break-even using heuristic
        // Assumption: Tax-free growth saves ~25% of converted amount over time
        // Break-even when savings >= tax paid
        if (elBreakEven && summary.totalConverted > 0) {
            const estimatedAnnualReturn = 0.06; // 6% growth
            const effectiveTaxRate = summary.effectiveTaxRate / 100;

            // Heuristic: Years to break even ≈ tax rate / annual return
            // This is a simplified model; real calculation needs baseline comparison
            const yearsToBreakEven = Math.ceil(effectiveTaxRate / estimatedAnnualReturn);
            const currentAge = config.startAge || 53;
            const breakEvenAge = currentAge + summary.yearsWithConversions + yearsToBreakEven;

            // Color coding
            let color = 'var(--success)'; // Green
            if (yearsToBreakEven > 30 || breakEvenAge > 90) {
                color = 'var(--danger)'; // Red
            } else if (yearsToBreakEven > 20) {
                color = 'var(--warning)'; // Yellow
            }

            elBreakEven.textContent = `${breakEvenAge} (${yearsToBreakEven}y)`;
            elBreakEven.style.color = color;
        } else if (elBreakEven) {
            elBreakEven.textContent = '—';
            elBreakEven.style.color = 'var(--text-muted)';
        }
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

        // Enhanced Tooltip for Waterfall
        this.chartWaterfall.options.plugins.tooltip = {
            callbacks: {
                label: (context) => {
                    const label = context.dataset.label;
                    const val = formatCurrency(context.raw);
                    if (label === 'Tax (Withheld)') {
                        return [`${label}: ${val}`, 'Reduces invested amount (Tax Drag)'];
                    }
                    if (label === 'Amt to Roth') {
                        return [`${label}: ${val}`, 'Compounds tax-free forever'];
                    }
                    return `${label}: ${val}`;
                }
            }
        };

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
        const savingsCurve = yearData.map((d) => {
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

        // Enhanced Tooltip for Breakeven
        this.chartBreakeven.options.plugins.tooltip = {
            callbacks: {
                footer: (context) => {
                    const ctxTax = context.find(c => c.dataset.label.includes('Tax Paid'));
                    const ctxSave = context.find(c => c.dataset.label.includes('Future Savings'));

                    if (ctxTax && ctxSave) {
                        const tax = ctxTax.parsed.y;
                        const save = ctxSave.parsed.y;
                        if (save > tax) {
                            return `✅ Profit: ${formatCurrency(save - tax)}`;
                        } else {
                            return `⏳ Recovering: ${formatCurrency(tax - save)} to go`;
                        }
                    }
                    return '';
                }
            }
        };

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

            // NEW: Format source accounts display
            const sources = d.sources || { retirement: 0, investments: 0 };
            const sourceDisplay = d.conversionAmount > 0
                ? `<div style="font-size: 0.75rem; line-height: 1.3;">
                     ${sources.retirement > 0 ? `<div>401k: ${formatCurrency(sources.retirement)}</div>` : ''}
                     ${sources.investments > 0 ? `<div>Taxable: ${formatCurrency(sources.investments)}</div>` : ''}
                     ${sources.retirement === 0 && sources.investments === 0 ? '<div style="color: var(--text-muted);">—</div>' : ''}
                   </div>`
                : '<div style="color: var(--text-muted); font-size: 0.75rem;">—</div>';

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
                <td>${sourceDisplay}</td>
                <td style="color: var(--danger);">${formatCurrency(d.taxOnConversion)}</td>
                <td style="font-size: 0.8rem;">${d.marginalRate}%</td>
            </tr>
        `}).join('');
    }

    /**
     * Switch between detailed and comparison tabs
     */
    static switchTab(tabName) {
        // Update tab buttons
        const tabs = document.querySelectorAll('.roth-tab');
        tabs.forEach(tab => tab.classList.remove('active'));

        const activeTab = document.getElementById(`tab${tabName === 'detailed' ? 'DetailedAnalysis' : 'Comparison'}`);
        if (activeTab) activeTab.classList.add('active');

        // Update views
        const views = document.querySelectorAll('.roth-view');
        views.forEach(view => view.classList.remove('active'));

        const activeView = document.getElementById(`view${tabName === 'detailed' ? 'DetailedAnalysis' : 'Comparison'}`);
        if (activeView) activeView.classList.add('active');

        // If switching to comparison and not yet loaded, run comparison
        if (tabName === 'comparison' && !this.comparisonLoaded) {
            this.loadComparison();
        }
    }

    /**
     * Load and render comparison view
     */
    static async loadComparison() {
        // Import comparison module dynamically
        const { RothComparison } = await import('./RothComparison.js');

        // Prepare parameters (same as renderAnalysis)
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

        // Run comparison
        await RothComparison.runComparison(params);
        this.comparisonLoaded = true;
    }

    /**
     * Update the detail header to show which strategy is being viewed
     */
    static updateDetailHeader(amount, score) {
        // Try to find a header element in the detailed view
        const detailedView = document.getElementById('viewDetailedAnalysis');
        if (!detailedView) return;

        // Look for existing header or create one
        let header = detailedView.querySelector('.strategy-detail-header');

        if (!header) {
            // Create header element at the top of the detailed view
            header = document.createElement('div');
            header.className = 'strategy-detail-header';
            header.style.cssText = `
                background: rgba(59, 130, 246, 0.1);
                padding: 15px 20px;
                border-bottom: 1px solid var(--border-color);
                margin-bottom: 20px;
                border-radius: 8px;
            `;

            // Insert at the beginning of the detailed view
            const firstChild = detailedView.firstElementChild;
            if (firstChild) {
                detailedView.insertBefore(header, firstChild);
            } else {
                detailedView.appendChild(header);
            }
        }

        // Update header content
        header.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="margin: 0; color: var(--text-primary); font-size: 1.1rem;">
                        📊 Viewing Strategy: ${formatCurrency(amount)}/year
                    </h3>
                    <p style="margin: 5px 0 0 0; color: var(--text-muted); font-size: 0.85rem;">
                        Score: <span style="color: ${score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--text-muted)'}; font-weight: 700;">${score}/100</span>
                    </p>
                </div>
                <button onclick="window.switchRothTab('comparison')" 
                        class="btn-secondary" 
                        style="padding: 8px 16px; font-size: 0.9rem;">
                    ← Back to Comparison
                </button>
            </div>
        `;
    }
}

// Global function for tab switching
window.switchRothTab = (tabName) => {
    RothDeepDive.switchTab(tabName);
};
