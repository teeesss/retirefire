/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from 'vitest';
import { CashFlowExplorer } from '../../src/explorers/CashFlowExplorer.js';

describe('CashFlowExplorer', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <button class="scenario-btn" data-rate="3.0">3%</button>
            <button class="scenario-btn" data-rate="3.5">3.5%</button>
            <button class="scenario-btn active" data-rate="4.0">4%</button>
            <button class="scenario-btn" data-rate="4.5">4.5%</button>
            <button class="scenario-btn" data-rate="5.0">5%</button>
            <span id="portfolioNeeded"></span>
            <span id="currentSpendRate"></span>
            <input id="calcTargetIncome" value="12000">
        `;

        CashFlowExplorer.init();
    });

    it('should initialize with default 4% spend rate', () => {
        expect(CashFlowExplorer.currentRate).toBe(4.0);
    });

    it('should calculate portfolio needed correctly (4% rule)', () => {
        CashFlowExplorer.setSpendRate(4.0);

        const portfolioNeeded = document.getElementById('portfolioNeeded');
        // $12k/month * 12 months / 4% = $3.6M
        expect(portfolioNeeded.textContent).toContain('$3.6M');
    });

    it('should calculate portfolio needed correctly (3% rule)', () => {
        CashFlowExplorer.setSpendRate(3.0);

        const portfolioNeeded = document.getElementById('portfolioNeeded');
        // $12k/month * 12 months / 3% = $4.8M
        expect(portfolioNeeded.textContent).toContain('$4.8M');
    });

    it('should calculate portfolio needed correctly (5% rule)', () => {
        CashFlowExplorer.setSpendRate(5.0);

        const portfolioNeeded = document.getElementById('portfolioNeeded');
        // $12k/month * 12 months / 5% = $2.88M
        expect(portfolioNeeded.textContent).toContain('$2.9M');
    });

    it('should highlight active spend rate button', () => {
        CashFlowExplorer.setSpendRate(5.0);

        const buttons = document.querySelectorAll('.scenario-btn');
        const activeButton = Array.from(buttons).find(btn => btn.classList.contains('active'));

        expect(activeButton).toBeTruthy();
        expect(activeButton.dataset.rate).toBe('5.0');
    });

    it('should update current spend rate display', () => {
        CashFlowExplorer.setSpendRate(3.5);

        const currentRate = document.getElementById('currentSpendRate');
        expect(currentRate.textContent).toBe('3.5%');
    });

    it('should handle different target income values', () => {
        document.getElementById('calcTargetIncome').value = '8000';
        CashFlowExplorer.setSpendRate(4.0);

        const portfolioNeeded = document.getElementById('portfolioNeeded');
        // $8k/month * 12 months / 4% = $2.4M
        expect(portfolioNeeded.textContent).toContain('$2.4M');
    });

    it('should handle zero target income gracefully', () => {
        document.getElementById('calcTargetIncome').value = '0';
        CashFlowExplorer.setSpendRate(4.0);

        const portfolioNeeded = document.getElementById('portfolioNeeded');
        expect(portfolioNeeded.textContent).toContain('$0');
    });

    it('should setup button click handlers', () => {
        const button = document.querySelector('[data-rate="3.5"]');
        button.click();

        expect(CashFlowExplorer.currentRate).toBe(3.5);
    });
});
