import { config } from '../data/Config.js';
import { rawData } from '../data/Store.js';
import { formatCurrency } from '../utils/Formatters.js';
import { getTotalIncome } from '../state/DataUtils.js';

export class GapCalculator {
    static init() {
        this.update();
    }

    static update() {
        const targetInput = document.getElementById('calcTargetIncome');
        if (!targetInput) return;

        const targetMonthly = parseFloat(targetInput.value) || 0;
        const scenario = config.currentScenario === 'all' ? 'average' : config.currentScenario;

        // Find the first year of retirement
        const startAge = config.startAge || config.settings.personal.age;
        const retireAge = config.settings.personal.retireAge;
        const yearIndex = Math.max(0, retireAge - startAge);

        // Ensure we don't go out of bounds
        const safeIndex = Math.min(yearIndex, (rawData.years?.length || 1) - 1);

        const annualIncome = getTotalIncome(scenario, safeIndex);
        const projectedMonthly = annualIncome / 12;

        // Update UI
        this.safeUpdate('calcProjectedIncome', formatCurrency(projectedMonthly, false));

        const subtitle = document.getElementById('calcSubtitle');
        if (subtitle && rawData.years) {
            const yearsToRetirement = retireAge - startAge;
            subtitle.textContent = `At Retirement: Age ${retireAge} (${rawData.years[safeIndex]}) - ${yearsToRetirement} years from now`;
        }

        const gap = projectedMonthly - targetMonthly;
        const resultValue = document.getElementById('calcResultValue');
        const resultLabel = document.getElementById('calcResultLabel');
        const progressBar = document.getElementById('calcProgressBar');

        if (resultValue && resultLabel) {
            if (gap >= 0) {
                resultLabel.textContent = 'Surplus';
                resultValue.textContent = '+' + formatCurrency(gap, false);
                resultValue.style.color = '#10b981';
            } else {
                resultLabel.textContent = 'Shortfall';
                resultValue.textContent = '-' + formatCurrency(Math.abs(gap), false);
                resultValue.style.color = '#ef4444';
            }
        }

        if (progressBar) {
            const pct = targetMonthly > 0 ? Math.min(100, (projectedMonthly / targetMonthly) * 100) : 100;
            progressBar.style.width = pct + '%';
            progressBar.style.backgroundColor = pct >= 100 ? '#10b981' : pct >= 80 ? '#f59e0b' : '#ef4444';
        }
    }

    static safeUpdate(id, content) {
        const el = document.getElementById(id);
        if (el) el.textContent = content;
    }

    static syncSlider(value) {
        const slider = document.getElementById('calcTargetIncomeSlider');
        const input = document.getElementById('calcTargetIncome');
        if (slider) slider.value = value;
        if (input) input.value = value;
        this.update();
        // Update CashFlowExplorer scenarios
        if (window.updateCashFlowScenario) {
            window.updateCashFlowScenario();
        }
    }

    static syncInput(value) {
        const slider = document.getElementById('calcTargetIncomeSlider');
        const input = document.getElementById('calcTargetIncome');
        if (slider) slider.value = value;
        if (input) input.value = value;
        this.update();
        // Update CashFlowExplorer scenarios
        if (window.updateCashFlowScenario) {
            window.updateCashFlowScenario();
        }
    }
}

// Global exposure for HTML onchange/oninput handlers
window.initGapCalculator = () => GapCalculator.update();
window.syncGapSlider = (value) => GapCalculator.syncSlider(value);
window.syncGapInput = (value) => GapCalculator.syncInput(value);
