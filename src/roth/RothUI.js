/**
 * Roth Conversion UI Handler
 * Manages all UI interactions for Roth conversion controls
 */

import RothConfig, { getStrategyDescription } from './RothConfig.js';
import RothCalculator from './RothCalculator.js';

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
            window.updateRawData?.();
            window.updateDashboard?.();
            window.refreshAllCharts?.();
            window.saveToLocalStorage?.();
        };

        // Bracket change
        window.updateRothTargetBracket = (bracket) => {
            RothConfig.targetBracket = parseInt(bracket);
            this.updateStrategyDescription();
            window.updateRawData?.();
            window.updateDashboard?.();
            window.refreshAllCharts?.();
            window.saveToLocalStorage?.();
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
            window.updateRawData?.();
            window.updateDashboard?.();
            window.refreshAllCharts?.();
            window.saveToLocalStorage?.();
        };

        // Period change
        window.updateRothPeriod = () => {
            const start = parseInt(document.getElementById('rothStartYear')?.value);
            const end = parseInt(document.getElementById('rothEndYear')?.value);

            if (start) RothConfig.startYear = start;
            if (end) RothConfig.endYear = end;

            window.updateRawData?.();
            window.updateDashboard?.();
            window.refreshAllCharts?.();
            window.saveToLocalStorage?.();
        };

        // Toggle enabled
        window.toggleRothConversion = () => {
            const enabled = document.getElementById('rothConversionEnabled')?.checked;
            RothConfig.enabled = enabled;

            window.updateRawData?.();
            window.updateDashboard?.();
            window.refreshAllCharts?.();
            window.saveToLocalStorage?.();
        };

        // Optimize
        window.optimizeRothConversion = () => {
            // This will be implemented to call RothCalculator.optimizeStrategy
            console.log('Optimizing Roth conversion strategy...');
            // TODO: Implement optimization logic
        };
    }
}

export default RothUI;
