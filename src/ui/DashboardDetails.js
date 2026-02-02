import { config } from '../data/Config.js';
import { rawData } from '../data/Store.js';
import { calculateNetWorth, getTotalIncome, getTotalExpenses, getTotalTaxes } from '../state/DataUtils.js';
import { formatCurrency } from '../utils/Formatters.js';
import { accountNames, incomeNames, expenseNames } from '../data/Constants.js';

export class DashboardDetails {
    static renderGoals() {
        const goalsList = document.getElementById('goalsList');
        if (!goalsList) return;

        let scenario = config.currentScenario;
        if (scenario === 'all') scenario = 'average';

        const goals = (config.goals || []).map((goal, index) => {
            const yearIndex = Math.max(0, goal.year - config.startYear);
            const currentAmount = calculateNetWorth(scenario, yearIndex);
            return {
                ...goal,
                current: currentAmount,
                index
            };
        });

        if (goals.length === 0) {
            goalsList.innerHTML = '<p class="text-muted" style="text-align:center; padding: 1rem;">No goals added yet.</p>';
            return;
        }

        goalsList.innerHTML = goals.map(goal => {
            const progress = Math.min(100, Math.max(0, (goal.current / goal.target) * 100));
            return `
                <div class="goal-item" style="position: relative; margin-bottom: 1.5rem;">
                    <button class="btn-close-sm" onclick="removeGoal(${goal.index})" style="position: absolute; right: -5px; top: -5px; background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 0.75rem;">×</button>
                    <div class="goal-header">
                        <span style="font-weight: 600;">${goal.name} (${goal.year})</span>
                        <span style="color: var(--primary); font-weight: 700;">${formatCurrency(goal.target)}</span>
                    </div>
                    <div class="progress-bar" style="background: var(--bg-tertiary); height: 8px; border-radius: 4px; margin: 0.5rem 0; overflow: hidden;">
                        <div class="progress-fill" style="width: ${progress}%; background: ${progress >= 100 ? 'var(--success)' : 'var(--primary)'}; height: 100%; transition: width 0.5s ease;"></div>
                    </div>
                    <div class="goal-footer" style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary);">
                        <span>Current Est: ${formatCurrency(goal.current)}</span>
                        <span style="font-weight: bold; color: ${progress >= 100 ? 'var(--success)' : 'inherit'}">${progress.toFixed(0)}%</span>
                    </div>
                </div>
            `;
        }).join('') + `
            <div style="text-align: center; margin-top: 1rem;">
                <button class="btn btn-sm btn-outline" onclick="openGoalModal()">+ Add Goal</button>
            </div>
        `;
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

        let scenario = config.currentScenario;
        if (scenario === 'all') scenario = 'average';
        let html = '<table class="data-table"><thead><tr><th>Year (Age)</th>';

        if (type === 'summary') {
            html += '<th>Net Worth</th><th>Income</th><th>Expenses</th><th>Taxes</th><th>Net Flow</th></tr></thead><tbody>';
            for (let i = 0; i < rawData.years.length; i++) {
                const nw = calculateNetWorth(scenario, i);
                const inc = getTotalIncome(scenario, i);
                const exp = getTotalExpenses(scenario, i);
                const tax = getTotalTaxes(scenario, i);
                const flow = inc - exp - tax;
                html += `<tr><td>${rawData.years[i]} (${rawData.ages[i]})</td>
                         <td>${formatCurrency(nw)}</td>
                         <td class="positive">${formatCurrency(inc)}</td>
                         <td class="negative">${formatCurrency(exp)}</td>
                         <td class="negative">${formatCurrency(tax)}</td>
                         <td class="${flow >= 0 ? 'positive' : 'negative'}"><strong>${formatCurrency(flow)}</strong></td></tr>`;
            }
        } else if (type === 'accounts') {
            const accounts = rawData[scenario].accounts;
            const keys = Object.keys(accounts).filter(k => k !== 'Debt');
            keys.forEach(k => html += `<th>${accountNames[k] || k}</th>`);
            html += '</tr></thead><tbody>';
            for (let i = 0; i < rawData.years.length; i++) {
                html += `<tr><td>${rawData.years[i]} (${rawData.ages[i]})</td>`;
                keys.forEach(k => html += `<td>${formatCurrency(accounts[k][i])}</td>`);
                html += '</tr>';
            }
        } else if (type === 'income') {
            const income = rawData[scenario].income;
            const keys = Object.keys(income).filter(k => income[k].some(v => v > 0));
            keys.forEach(k => html += `<th>${incomeNames[k] || k}</th>`);
            html += '</tr></thead><tbody>';
            for (let i = 0; i < rawData.years.length; i++) {
                html += `<tr><td>${rawData.years[i]} (${rawData.ages[i]})</td>`;
                keys.forEach(k => html += `<td class="positive">${formatCurrency(income[k][i])}</td>`);
                html += '</tr>';
            }
        } else if (type === 'taxes') {
            const taxes = rawData[scenario].taxes;
            html += '<th>Gross Income</th><th>Federal Ord</th><th>Cap Gains</th><th>FICA</th><th>State</th><th>Total</th></tr></thead><tbody>';
            for (let i = 0; i < rawData.years.length; i++) {
                const inc = getTotalIncome(scenario, i);
                const total = (taxes.Federal[i] || 0) + (taxes.CapGains[i] || 0) + (taxes.FICA[i] || 0) + (taxes.State[i] || 0);

                html += `<tr><td>${rawData.years[i]} (${rawData.ages[i]})</td>
                         <td class="positive">${formatCurrency(inc)}</td>
                         <td class="negative">${formatCurrency(taxes.Federal[i])}</td>
                         <td class="negative">${formatCurrency(taxes.CapGains[i])}</td>
                         <td class="negative">${formatCurrency(taxes.FICA[i])}</td>
                         <td class="negative">${formatCurrency(taxes.State[i])}</td>
                         <td class="negative"><strong>${formatCurrency(total)}</strong></td></tr>`;
            }
            html += '<tr><td colspan="7" style="font-size: 0.75rem; opacity: 0.7; padding: 10px;">Note: Federal Ord includes taxes on wages, RMDs, Social Security (85%), and Traditional account withdrawals. Cap Gains includes tax on Investment account sales.</td></tr>';
        } else if (type === 'expenses') {
            const exp = rawData[scenario].expenses;
            const keys = Object.keys(exp).filter(k => k !== 'Taxes');
            keys.forEach(k => html += `<th>${expenseNames[k] || k}</th>`);
            html += '<th>Taxes</th><th>Total</th></tr></thead><tbody>';
            for (let i = 0; i < rawData.years.length; i++) {
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
        } else if (type === 'roth') {
            const roth = rawData[scenario].roth;
            html += '<th>Converted</th><th>Tax Cost</th><th>Basis</th><th>Balance</th></tr></thead><tbody>';
            const bal = rawData[scenario].accounts.Roth;
            for (let i = 0; i < rawData.years.length; i++) {
                html += `<tr><td>${rawData.years[i]} (${rawData.ages[i]})</td>
                         <td class="positive">${formatCurrency(roth.Converted[i])}</td>
                         <td class="negative">${formatCurrency(roth.TaxPaid[i])}</td>
                         <td>${formatCurrency(bal[i])}</td></tr>`;
            }
        } else if (type === 'cashflow') {
            html += '<th>Gross Income</th><th>Expenses</th><th>Tax</th><th>Net Flow</th></tr></thead><tbody>';
            for (let i = 0; i < rawData.years.length; i++) {
                const inc = getTotalIncome(scenario, i);
                const exp = getTotalExpenses(scenario, i);
                const tax = getTotalTaxes(scenario, i);
                const flow = inc - exp - tax;
                html += `<tr><td>${rawData.years[i]} (${rawData.ages[i]})</td>
                         <td class="positive">${formatCurrency(inc)}</td>
                         <td class="negative">${formatCurrency(exp)}</td>
                         <td class="negative">${formatCurrency(tax)}</td>
                         <td class="${flow >= 0 ? 'positive' : 'negative'}"><strong>${formatCurrency(flow)}</strong></td></tr>`;
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
