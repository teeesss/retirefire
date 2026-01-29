import { config } from '../data/Config.js';
import { rawData } from '../data/Store.js';
import { calculateNetWorth, getTotalIncome, getTotalExpenses, getTotalTaxes } from '../state/DataUtils.js';
import { formatCurrency } from '../utils/Formatters.js';
import { accountNames, incomeNames, expenseNames } from '../data/Constants.js';

export class DashboardDetails {
    static renderGoals() {
        const goalsList = document.getElementById('goalsList');
        if (!goalsList) return;

        const retireYearIdx = Math.max(0, config.settings.personal.retireAge - config.settings.personal.age);
        const age70Idx = Math.max(0, 70 - config.settings.personal.age);

        const goals = [
            { name: 'Retirement Net Worth', target: config.settings.goals.retirementNW, current: calculateNetWorth(config.currentScenario, retireYearIdx) },
            { name: 'Age 70 Legacy', target: config.settings.goals.age70NW, current: calculateNetWorth(config.currentScenario, age70Idx) }
        ];

        goalsList.innerHTML = goals.map(goal => {
            const progress = Math.min(100, (goal.current / goal.target) * 100);
            return `
                <div class="goal-item">
                    <div class="goal-header">
                        <span>${goal.name}</span>
                        <span>${formatCurrency(goal.target)}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="goal-footer">
                        <span>Current: ${formatCurrency(goal.current)}</span>
                        <span>${progress.toFixed(0)}%</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    static updateMilestones() {
        const milestones = document.getElementById('milestoneList');
        if (!milestones) return;

        // Dynamic Milestone Detection
        const h = config.settings.housing || {};
        const p = config.settings.personal || {};
        const mortgagePayoffAge = p.age + (h.mortgageYears || 0);
        const mortgagePayoffYear = config.startYear + (h.mortgageYears || 0);

        let html = '';

        // Mortgage
        if (h.mortgageBalance > 0) {
            html += `
                <div class="milestone-item">
                    <span class="milestone-icon">🏠</span>
                    <span>Mortgage Paid Off: Age ${mortgagePayoffAge} (${mortgagePayoffYear})</span>
                </div>
            `;
        }

        // Retirement
        html += `
            <div class="milestone-item">
                <span class="milestone-icon">☀️</span>
                <span>Retirement Eligibility: Age ${p.retireAge} (${config.startYear + (p.retireAge - p.age)})</span>
            </div>
        `;

        // Social Security
        const ssAge = config.settings.socialSecurity.claimAge || 67;
        html += `
            <div class="milestone-item">
                <span class="milestone-icon">🏦</span>
                <span>Social Security Starts: Age ${ssAge} (${config.startYear + (ssAge - p.age)})</span>
            </div>
        `;

        milestones.innerHTML = html;
    }

    static showDataTable(type, btn) {
        const container = document.getElementById('dataTableContainer');
        if (!container) return;

        const scenario = config.currentScenario;
        let html = '<table class="data-table"><thead><tr><th>Year (Age)</th>';

        if (type === 'summary') {
            html += '<th>Net Worth</th><th>Income</th><th>Expenses</th><th>Taxes</th></tr></thead><tbody>';
            for (let i = 0; i < rawData.years.length; i += 2) {
                const nw = calculateNetWorth(scenario, i);
                const inc = getTotalIncome(scenario, i);
                const exp = getTotalExpenses(scenario, i);
                const tax = getTotalTaxes(scenario, i);
                html += `<tr><td>${rawData.years[i]} (${rawData.ages[i]})</td>
                         <td>${formatCurrency(nw)}</td>
                         <td class="positive">${formatCurrency(inc)}</td>
                         <td class="negative">${formatCurrency(exp)}</td>
                         <td class="negative">${formatCurrency(tax)}</td></tr>`;
            }
        } else if (type === 'accounts') {
            const accounts = rawData[scenario].accounts;
            const keys = Object.keys(accounts).filter(k => k !== 'Debt');
            keys.forEach(k => html += `<th>${accountNames[k] || k}</th>`);
            html += '</tr></thead><tbody>';
            for (let i = 0; i < rawData.years.length; i += 2) {
                html += `<tr><td>${rawData.years[i]} (${rawData.ages[i]})</td>`;
                keys.forEach(k => html += `<td>${formatCurrency(accounts[k][i])}</td>`);
                html += '</tr>';
            }
        } else if (type === 'income') {
            const income = rawData[scenario].income;
            const keys = Object.keys(income).filter(k => income[k].some(v => v > 0));
            keys.forEach(k => html += `<th>${incomeNames[k] || k}</th>`);
            html += '</tr></thead><tbody>';
            for (let i = 0; i < rawData.years.length; i += 2) {
                html += `<tr><td>${rawData.years[i]} (${rawData.ages[i]})</td>`;
                keys.forEach(k => html += `<td class="positive">${formatCurrency(income[k][i])}</td>`);
                html += '</tr>';
            }
        } else if (type === 'taxes') {
            const taxes = rawData[scenario].taxes;
            html += '<th>Federal Ord</th><th>Cap Gains</th><th>FICA</th><th>State</th><th>Total</th></tr></thead><tbody>';
            for (let i = 0; i < rawData.years.length; i += 2) {
                const total = (taxes.Federal[i] || 0) + (taxes.CapGains[i] || 0) + (taxes.FICA[i] || 0) + (taxes.State[i] || 0);
                html += `<tr><td>${rawData.years[i]} (${rawData.ages[i]})</td>
                         <td class="negative">${formatCurrency(taxes.Federal[i])}</td>
                         <td class="negative">${formatCurrency(taxes.CapGains[i])}</td>
                         <td class="negative">${formatCurrency(taxes.FICA[i])}</td>
                         <td class="negative">${formatCurrency(taxes.State[i])}</td>
                         <td class="negative"><strong>${formatCurrency(total)}</strong></td></tr>`;
            }
        } else if (type === 'expenses') {
            const exp = rawData[scenario].expenses;
            const keys = Object.keys(exp).filter(k => k !== 'Taxes');
            keys.forEach(k => html += `<th>${expenseNames[k] || k}</th>`);
            html += '<th>Taxes</th><th>Total</th></tr></thead><tbody>';
            for (let i = 0; i < rawData.years.length; i += 2) {
                html += `<tr><td>${rawData.years[i]} (${rawData.ages[i]})</td>`;
                let total = 0;
                keys.forEach(k => {
                    const val = exp[k][i] || 0;
                    total += val;
                    html += `<td class="negative">${formatCurrency(val)}</td>`;
                });
                const tax = getTotalTaxes(scenario, i);
                html += `<td class="negative">${formatCurrency(tax)}</td>`;
                html += `<td class="negative"><strong>${formatCurrency(total + tax)}</strong></td></tr>`;
            }
        }

        html += '</tbody></table>';
        container.innerHTML = html;

        if (btn) {
            document.querySelectorAll('#tableTabs .tab').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
        }
    }
}
