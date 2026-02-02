import { formatCurrency } from '../utils/Formatters.js';

/**
 * CashFlowExplorer - Interactive spend rate scenario analyzer
 * Helps users understand portfolio requirements based on different withdrawal rates
 */
export class CashFlowExplorer {
    static currentRate = 4.0; // Default 4% spend rate

    static init() {
        this.setupSpendRateButtons();
        this.updateScenario();
    }

    static setupSpendRateButtons() {
        const buttons = document.querySelectorAll('.scenario-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setSpendRate(parseFloat(e.target.dataset.rate));
            });
        });
    }

    static setSpendRate(rate) {
        this.currentRate = rate;
        this.updateScenario();
    }

    static updateScenario() {
        // Get target monthly income
        const targetInput = document.getElementById('calcTargetIncome');
        const targetMonthly = parseFloat(targetInput?.value) || 0;
        const targetAnnual = targetMonthly * 12;

        // Calculate portfolio needed based on spend rate
        // Formula: Portfolio = Annual Spending / (Spend Rate / 100)
        const portfolioNeeded = targetAnnual / (this.currentRate / 100);

        // Update UI
        this.safeUpdate('portfolioNeeded', formatCurrency(portfolioNeeded));

        // Highlight active button
        document.querySelectorAll('.scenario-btn').forEach(btn => {
            btn.classList.toggle('active', parseFloat(btn.dataset.rate) === this.currentRate);
        });

        // Update spend rate display
        this.safeUpdate('currentSpendRate', `${this.currentRate}%`);
    }

    static safeUpdate(id, content) {
        const el = document.getElementById(id);
        if (el) el.textContent = content;
    }
}

// Global exposure for integration with GapCalculator
window.updateCashFlowScenario = () => CashFlowExplorer.updateScenario();
