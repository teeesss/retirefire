import { rawData } from '../data/Store.js';
import { config } from '../data/Config.js';
import { formatCurrency } from '../utils/Formatters.js';
import { accountNames, incomeNames, expenseNames } from '../data/Constants.js';

export class ModalHandler {
    static openYearModal(yearIndex) {
        const year = rawData.years[yearIndex];
        const age = rawData.ages[yearIndex];

        this.safeUpdateElement('modalYear', year);
        this.safeUpdateElement('modalAge', age);

        const scenario = config.currentScenario;
        const accounts = rawData[scenario].accounts;
        const income = rawData[scenario].income;
        const expenses = rawData[scenario].expenses;

        let html = '<div class="settings-grid">';

        html += '<div><h4 style="margin-bottom: 0.5rem; color: var(--primary);">Assets</h4>';
        for (let key in accounts) {
            if (accounts[key][yearIndex] !== 0) {
                html += `<div style="display: flex; justify-content: space-between; padding: 0.25rem 0; font-size: 0.85rem;"><span>${accountNames[key] || key}</span><span>${formatCurrency(accounts[key][yearIndex], false)}</span></div>`;
            }
        }
        html += '</div>';

        html += '<div><h4 style="margin-bottom: 0.5rem; color: var(--success);">Income</h4>';
        for (let key in income) {
            if (income[key][yearIndex] > 0) {
                html += `<div style="display: flex; justify-content: space-between; padding: 0.25rem 0; font-size: 0.85rem;"><span>${incomeNames[key] || key}</span><span class="positive">${formatCurrency(income[key][yearIndex], false)}</span></div>`;
            }
        }
        html += '</div>';

        html += '<div><h4 style="margin-bottom: 0.5rem; color: var(--danger);">Expenses</h4>';
        for (let key in expenses) {
            if (expenses[key][yearIndex] > 0) {
                html += `<div style="display: flex; justify-content: space-between; padding: 0.25rem 0; font-size: 0.85rem;"><span>${expenseNames[key] || key}</span><span class="negative">${formatCurrency(expenses[key][yearIndex], false)}</span></div>`;
            }
        }
        html += '</div>';

        html += '</div>';

        this.safeUpdateElement('yearModalBody', html, 'innerHTML');
        const modal = document.getElementById('yearDetailModal');
        if (modal) modal.classList.add('active');
    }

    static closeYearModal() {
        const modal = document.getElementById('yearDetailModal');
        if (modal) modal.classList.remove('active');
    }

    static safeUpdateElement(id, content, type = 'textContent') {
        const el = document.getElementById(id);
        if (el) el[type] = content;
    }

    static openModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.style.display = 'flex';
            // Accessibiltiy focus could go here
        }
    }

    static closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.style.display = 'none';
        }
    }
}
