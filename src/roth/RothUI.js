/**
 * Roth Conversion UI Handler
 * Manages all UI interactions for Roth conversion controls
 */

import RothConfig, { getStrategyDescription } from './RothConfig.js';
import RothCalculator from './RothCalculator.js';
import { rawData, updateRawData } from '../data/Store.js';
import { config } from '../data/Config.js';
import { recalculate } from '../main.js'; // Or ensure window.recalculate is used

export class RothUI {
    /**
     * Initialize Roth UI controls
     */
    static init() {
        this.syncUIWithConfig();
        this.attachEventListeners();
    }

    /**
     * Sync UI elements with RothConfig
     */
    static syncUIWithConfig() {
        const modeSelect = document.getElementById('rothStrategyMode');
        const bracketSelect = document.getElementById('rothTargetBracket');
        const amountInput = document.getElementById('rothAmountInput');
        const amountSlider = document.getElementById('rothAmountSlider');
        const startYear = document.getElementById('rothStartYear');
        const endYear = document.getElementById('rothEndYear');
        const maxCap = document.getElementById('rothMaxCap');
        const enabled = document.getElementById('rothConversionEnabled');

        if (modeSelect) modeSelect.value = RothConfig.mode;
        if (bracketSelect) bracketSelect.value = RothConfig.targetBracket;
        if (amountInput) amountInput.value = RothConfig.manualAmount;
        if (amountSlider) amountSlider.value = RothConfig.manualAmount;
        if (startYear) startYear.value = RothConfig.startYear;
        if (endYear) endYear.value = RothConfig.endYear;
        if (maxCap) maxCap.value = RothConfig.maxAnnualCap || 100000;
        if (enabled) enabled.checked = RothConfig.enabled;

        this.updateStrategyVisibility();
        this.updateStrategyDescription();
    }

    /**
     * Update visibility of strategy-specific controls
     */
    static updateStrategyVisibility() {
        const manualControls = document.getElementById('rothManualControls');
        const bracketControls = document.getElementById('rothBracketControls');
        const hybridCap = document.getElementById('rothHybridCap');

        if (manualControls) {
            manualControls.style.display = RothConfig.mode === 'manual' ? 'block' : 'none';
        }

        if (bracketControls) {
            bracketControls.style.display =
                (RothConfig.mode === 'bracket' || RothConfig.mode === 'hybrid') ? 'block' : 'none';
        }

        if (hybridCap) {
            hybridCap.style.display = RothConfig.mode === 'hybrid' ? 'block' : 'none';
        }
    }

    /**
     * Update strategy description
     */
    static updateStrategyDescription() {
        const desc = document.getElementById('rothStrategyDesc');
        if (desc) {
            desc.textContent = getStrategyDescription();
        }
    }

    /**
     * Update metrics display
     */
    static updateMetrics(totalConverted, years, taxSavings, legacyBoost) {
        const totalEl = document.getElementById('rothTotalConverted');
        const yearsEl = document.getElementById('rothConversionYears');
        const savingsEl = document.getElementById('rothTaxSavings');
        const legacyEl = document.getElementById('rothLegacyBoost');

        if (totalEl) totalEl.textContent = this.formatCurrency(totalConverted);
        if (yearsEl) yearsEl.textContent = `${years} yrs`;
        if (savingsEl) savingsEl.textContent = this.formatCurrency(taxSavings);
        if (legacyEl) legacyEl.textContent = '+' + this.formatCurrency(legacyBoost);
    }

    /**
     * Format currency
     */
    static formatCurrency(value) {
        if (value >= 1000000) {
            return '$' + (value / 1000000).toFixed(1) + 'M';
        } else if (value >= 1000) {
            return '$' + (value / 1000).toFixed(0) + 'K';
        }
        return '$' + value.toLocaleString();
    }

    /**
     * Attach event listeners
     */
    static attachEventListeners() {
        // Strategy mode change
        window.updateRothStrategy = (mode) => {
            RothConfig.mode = mode;
            this.updateStrategyVisibility();
            this.updateStrategyDescription();
            updateRawData();
            if (window.updateDashboard) window.updateDashboard();
            if (window.refreshAllCharts) window.refreshAllCharts();
            if (window.saveToLocalStorage) window.saveToLocalStorage();
        };

        // Bracket change
        window.updateRothTargetBracket = (bracket) => {
            RothConfig.targetBracket = parseInt(bracket);
            this.updateStrategyDescription();
            updateRawData();
            if (window.updateDashboard) window.updateDashboard();
            if (window.refreshAllCharts) window.refreshAllCharts();
            if (window.saveToLocalStorage) window.saveToLocalStorage();
        };

        // Manual amount change
        window.updateRothConversionAmount = (value) => {
            const amount = parseInt(value) || 0;
            RothConfig.manualAmount = amount;

            const slider = document.getElementById('rothAmountSlider');
            const input = document.getElementById('rothAmountInput');

            if (slider && document.activeElement !== slider) slider.value = amount;
            if (input && document.activeElement !== input) input.value = amount;

            this.updateStrategyDescription();
            window.updateRawData?.();
            window.updateDashboard?.();
            window.refreshAllCharts?.();
            window.saveToLocalStorage?.();
        };

        // Max cap change
        window.updateRothMaxCap = (value) => {
            RothConfig.maxAnnualCap = parseInt(value) || null;
            this.updateStrategyDescription();
            updateRawData();
            if (window.updateDashboard) window.updateDashboard();
            if (window.refreshAllCharts) window.refreshAllCharts();
            if (window.saveToLocalStorage) window.saveToLocalStorage();
        };

        // Period change
        window.updateRothPeriod = () => {
            const start = parseInt(document.getElementById('rothStartYear')?.value);
            const end = parseInt(document.getElementById('rothEndYear')?.value);

            if (start) RothConfig.startYear = start;
            if (end) RothConfig.endYear = end;

            updateRawData();
            if (window.updateDashboard) window.updateDashboard();
            if (window.refreshAllCharts) window.refreshAllCharts();
            if (window.saveToLocalStorage) window.saveToLocalStorage();
        };

        // Toggle enabled
        window.toggleRothConversion = () => {
            const enabled = document.getElementById('rothConversionEnabled')?.checked;
            RothConfig.enabled = enabled;

            updateRawData();
            if (window.updateDashboard) window.updateDashboard();
            if (window.refreshAllCharts) window.refreshAllCharts();
            if (window.saveToLocalStorage) window.saveToLocalStorage();
        };

        // Optimize
        window.optimizeRothConversion = () => {
            console.log('🔍 Optimizing Roth conversion strategy...');

            // Get simulation data
            if (!rawData || !rawData.years) {
                console.error('No simulation data available');
                return;
            }

            // Import optimizer dynamically
            import('./RothOptimizer.js').then(({ default: RothOptimizer }) => {
                // Prepare optimization parameters
                const params = {
                    years: rawData.years,
                    ordinaryIncome: rawData.average.income.Work.map((v, i) =>
                        v + (rawData.average.income.SocialSecurity?.[i] || 0) + (rawData.average.income.RMD?.[i] || 0)
                    ),
                    traditionalBalance: rawData.average.accounts.RetirementSavings,
                    filingStatus: config.settings.taxSettings.filingStatus || 'joint',
                    targetBracket: RothConfig.targetBracket,
                    constraints: {
                        maxAnnual: RothConfig.maxAnnualCap
                    }
                };

                // Run optimization
                const optimized = RothOptimizer.optimize(params);

                // Generate report
                const report = RothOptimizer.generateReport(optimized);

                // Display results
                this.displayOptimizationResults(report, optimized);

                // Ask user if they want to apply
                this.showOptimizationDialog(optimized);
            }).catch(error => {
                console.error('Failed to load optimizer:', error);
            });
        };
    }

    /**
     * Display optimization results
     */
    static displayOptimizationResults(report, optimizedResults) {
        console.log('\n📊 OPTIMIZATION RESULTS\n');
        console.log(report.headline);
        console.log('\n💰 Metrics:');
        console.log(`  Total Converted: $${report.metrics.totalConverted.toLocaleString()}`);
        console.log(`  Total Tax Paid: $${report.metrics.totalTaxPaid.toLocaleString()}`);
        console.log(`  Effective Tax Rate: ${report.metrics.effectiveTaxRate}%`);
        console.log(`  Average Annual: $${Math.round(report.metrics.averageAnnual).toLocaleString()}`);
        console.log(`  Years Active: ${report.metrics.yearsActive}`);

        if (report.yearByYear.length > 0) {
            console.log('\n📅 Year-by-Year Breakdown:');
            report.yearByYear.slice(0, 5).forEach(r => {
                console.log(`  ${r.year}: $${r.conversionAmount.toLocaleString()} (${r.marginalRate}% bracket)`);
            });
            if (report.yearByYear.length > 5) {
                console.log(`  ... and ${report.yearByYear.length - 5} more years`);
            }
        }
    }

    /**
     * Show optimization dialog
     */
    static showOptimizationDialog(optimizedResults) {
        const message = `
Optimization Complete!

Total Conversions: $${(optimizedResults.summary.totalConverted / 1000).toFixed(0)}K
Over ${optimizedResults.summary.yearsWithConversions} years
Effective Tax Rate: ${optimizedResults.summary.effectiveTaxRate.toFixed(1)}%

Would you like to apply this optimized strategy?
        `.trim();

        if (confirm(message)) {
            this.applyOptimizedStrategy(optimizedResults);
        }
    }

    /**
     * Apply optimized strategy
     */
    static applyOptimizedStrategy(optimizedResults) {
        // Switch to bracket mode with the target bracket
        RothConfig.mode = 'bracket';

        // Update UI
        this.syncUIWithConfig();

        // Trigger recalculation
        updateRawData();
        if (window.updateDashboard) window.updateDashboard();
        if (window.refreshAllCharts) window.refreshAllCharts();
        if (window.saveToLocalStorage) window.saveToLocalStorage();

        console.log('✅ Optimized strategy applied!');
    }
}

export default RothUI;
