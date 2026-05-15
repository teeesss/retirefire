import { config } from '../data/Config.js';
import { rawData } from '../data/Store.js';
import { formatCurrency } from '../utils/Formatters.js';
import { getNetWorthSeries, getTotalIncome, getTotalExpenses, getTotalTaxes } from '../state/DataUtils.js';

export class MetricsHandler {
    static updateMetrics() {
        let scenario = config.currentScenario;
        if (scenario === 'all' || !rawData[scenario]) scenario = 'average';

        const netWorths = getNetWorthSeries(scenario);
        const currentNW = netWorths[0];
        const peakNW = Math.max(...netWorths);
        const peakIndex = netWorths.indexOf(peakNW);
        const currentYearIdx = config.currentYear || 0;

        const scenarioLabel = config.currentScenario.charAt(0).toUpperCase() + config.currentScenario.slice(1);
        this.safeUpdate('metricScenarioLabel', scenarioLabel);

        // Header Metrics
        this.safeUpdate('metricCurrentNW', formatCurrency(currentNW));
        if (rawData.ages?.[0] !== undefined && rawData.years?.[0] !== undefined) {
            this.safeUpdate('currentNWSubtitle', `Age ${rawData.ages[0]} (${rawData.years[0]})`);
        }

        this.safeUpdate('metricPeakNW', formatCurrency(peakNW));
        if (rawData.ages?.[peakIndex] !== undefined && rawData.years?.[peakIndex] !== undefined) {
            this.safeUpdate('metricPeakYear', `Age ${rawData.ages[peakIndex]} (${rawData.years[peakIndex]})`);
        }

        const growthVal = currentNW != 0 ? ((peakNW - currentNW) / currentNW * 100).toFixed(0) : 0;
        this.safeUpdate('metricPeakGrowth', `+${growthVal}%`);

        const mc = rawData.monteCarlo || { successRate: 99 };
        const successRate = mc.successRate;
        this.safeUpdate('metricSuccess', successRate.toFixed(0) + '%');
        this.safeUpdate('mSuccessRate', successRate.toFixed(0) + '%');
        this.updateStatusBadgeByValue('mSuccessRate', successRate, 95, 80);

        this.safeUpdate('metricRetireAge', config.settings.personal.retireAge);
        const rYear = (rawData.years?.[0] || 2025) + (config.settings.personal.retireAge - (rawData.ages?.[0] || 30));
        this.safeUpdate('metricRetireYear', `Year ${rYear}`);

        const ssBenefit = config.settings.socialSecurity.ss67;
        this.safeUpdate('metricSS', formatCurrency(ssBenefit, false) + '/mo');
        const claimAge = config.settings.socialSecurity.claimAge || 67;
        this.safeUpdate('metricSSAge', `Starting Age ${claimAge}`);
        this.safeUpdate('currentSSClaimAge', claimAge);

        // Financial Health Summary
        const outOfMoney = netWorths.findIndex(nw => nw <= 0);
        const outOfMoneyAgeVal = (outOfMoney === -1) ? 'Never' : (rawData.ages?.[outOfMoney] !== undefined ? 'Age ' + rawData.ages[outOfMoney] : 'Run Out');
        this.safeUpdate('mNeverRunOut', outOfMoneyAgeVal);
        this.updateStatusBadge('mNeverRunOut', outOfMoney === -1 ? 'EXC' : 'VULN');

        const retirementSpend = config.settings.expenses.annualSpending || 80000;
        const assetsRequired = retirementSpend * 25;
        const currentAssets = (config.settings.assets.retirement || 0) + (config.settings.assets.roth || 0) + (config.settings.assets.investments || 0);
        const savingsRatio = assetsRequired > 0 ? (currentAssets / assetsRequired * 100).toFixed(0) : 0;
        this.safeUpdate('mSavingsRatio', savingsRatio + '%');
        this.updateStatusBadgeByValue('mSavingsRatio', parseFloat(savingsRatio), 100, 75);

        // Progress Summary
        const totalExpenses = getTotalExpenses(scenario, currentYearIdx);
        this.safeUpdate('mTotalExpenses', formatCurrency(totalExpenses / 1000, false) + 'k');
        
        const currentAge = rawData.ages?.[currentYearIdx] || config.settings.personal.age;
        const retireAge = config.settings.personal.retireAge;
        const monthsToRetire = Math.max(0, (retireAge - currentAge) * 12);
        this.safeUpdate('mRetireCount', monthsToRetire > 0 ? monthsToRetire + ' mo' : 'Retired');
        
        const workIncome = config.settings.income.work || 0;
        const totalSaved = (config.settings.income.contribution401k || 0) + (config.settings.income.rothContrib || 0) + (config.settings.income.hsaContrib || 0);
        const savingsRate = workIncome > 0 ? (totalSaved / workIncome * 100).toFixed(1) : 0;
        this.safeUpdate('mSavingsRate', savingsRate + '%');
        this.updateStatusBadgeByValue('mSavingsRate', parseFloat(savingsRate), 20, 10);

        // Debt & Cash
        const debt = rawData[scenario]?.accounts?.Debt;
        const debtIdx = debt ? debt.findIndex((d, idx) => d >= 0 && idx > 0) : -1;
        const isAlreadyPaidOff = debt && debt[0] >= 0;
        const debtFreeLabel = isAlreadyPaidOff ? 'Paid Off' : (debtIdx !== -1 ? `Age ${config.settings.personal.age + debtIdx}` : 'Paid Off');
        this.safeUpdate('mDebtFree', debtFreeLabel);
        this.updateStatusBadge('mDebtFree', isAlreadyPaidOff || debtIdx !== -1 ? 'EXC' : 'PROG');

        const totalDebt = Math.abs(rawData[scenario]?.accounts?.Debt?.[currentYearIdx] || 0);
        const debtRatio = currentNW > 0 ? (totalDebt / currentNW * 100).toFixed(1) : 0;
        this.safeUpdate('mDebtRatio', debtRatio + '%');
        this.updateStatusBadgeByValue('mDebtRatio', parseFloat(debtRatio), 30, 50, true);

        const income = getTotalIncome(scenario, currentYearIdx);
        const taxes = getTotalTaxes(scenario, currentYearIdx);
        const netCashFlow = income - totalExpenses - taxes;
        this.safeUpdate('mCashFlow12', formatCurrency(netCashFlow / 1000, false) + 'k');
        this.updateStatusBadge('mCashFlow12', netCashFlow >= 0 ? 'EXC' : (netWorths[currentYearIdx] > Math.abs(netCashFlow) ? 'PROG' : 'VULN'));

        // Taxes & Home
        let totalLifetimeTax = 0;
        let totalLifetimeIncome = 0;
        for (let i = 0; i < rawData.years.length; i++) {
            totalLifetimeTax += getTotalTaxes(scenario, i);
            totalLifetimeIncome += getTotalIncome(scenario, i);
        }
        const lifeTaxRate = totalLifetimeIncome > 0 ? (totalLifetimeTax / totalLifetimeIncome * 100).toFixed(1) : 0;
        this.safeUpdate('mTaxLifetime', lifeTaxRate + '%');
        
        const nextYrTax = getTotalTaxes(scenario, currentYearIdx + 1);
        const nextYrInc = getTotalIncome(scenario, currentYearIdx + 1);
        const nextYrTaxRate = nextYrInc > 0 ? (nextYrTax / nextYrInc * 100).toFixed(1) : 0;
        this.safeUpdate('mTaxNextYear', nextYrTaxRate + '%');

        const homeVal = config.settings.housing.homeValue || 0;
        const housingRatio = currentNW > 0 ? (homeVal / currentNW * 100).toFixed(1) : 0;
        this.safeUpdate('mHousingRatio', housingRatio + '%');
        this.updateStatusBadgeByValue('mHousingRatio', parseFloat(housingRatio), 20, 40, true);

        // Legacy
        const legacyGoal = config.settings.goals.legacy || 1000000;
        const finalNW = netWorths[netWorths.length - 1];
        const legacyScore = ((finalNW / legacyGoal) * 100).toFixed(0);
        this.safeUpdate('mLegacyScore', legacyScore + '%');
        this.updateStatusBadgeByValue('mLegacyScore', parseFloat(legacyScore), 100, 50);

        const rothLegacyBoost = (rawData.roth?.netWorth?.[netWorths.length - 1] || finalNW) - finalNW;
        this.safeUpdate('mRothLegacy', (rothLegacyBoost >= 0 ? '+' : '') + formatCurrency(rothLegacyBoost / 1000000, false) + 'M');

        // Risk
        const withdrawalRate = totalExpenses > 0 && currentNW > 0 ? (totalExpenses / currentNW * 100).toFixed(1) : 0;
        this.safeUpdate('mWithdrawalRate', withdrawalRate + '%');
        this.updateStatusBadgeByValue('mWithdrawalRate', parseFloat(withdrawalRate), 4, 6, true);

        this.safeUpdate('mStressTest', outOfMoney === -1 ? 'Passed' : 'Failed');
        this.updateStatusBadge('mStressTest', outOfMoney === -1 ? 'EXC' : 'VULN');

        this.updateCoach();
    }

    static updateCoach() {
        let scenario = config.currentScenario;
        if (scenario === 'all' || !rawData[scenario]) scenario = 'average';
        const mc = rawData.monteCarlo || { successRate: 99 };
        const insights = [];

        // 1. Success Rate Insight
        if (mc.successRate > 95) {
            insights.push({
                type: 'success',
                title: '🎉 High Confidence',
                text: 'Plan is extremely robust. Consider early gifting.',
                section: 'section-networth'
            });
        } else if (mc.successRate < 70) {
            insights.push({
                type: 'warning',
                title: '⚠️ Risk Alert',
                text: 'Low success probability. Consider delaying retirement.',
                section: 'section-montecarlo'
            });
        }

        // 2. Liquidity Check (Age 60)
        const sc = rawData[scenario];
        if (sc && sc.accounts && sc.accounts.Investments) {
            const taxableGapIdx = sc.accounts.Investments.findIndex((v, i) => v <= 0 && rawData.ages[i] < 60);
            if (taxableGapIdx !== -1) {
                insights.push({
                    type: 'warning',
                    title: '⚠️ Liquidity Gap',
                    text: 'Potential shortfall before age 60 penalties expire.',
                    section: 'section-withdrawals'
                });
            }
        }

        // 3. Tax Optimization
        if (!config.settings.taxes.rothConversionEnabled) {
            insights.push({
                type: 'info',
                title: '🏦 Tax Strategy',
                text: 'High potential for Roth Conversion savings.',
                section: 'section-roth'
            });
        }

        // 4. Social Security Optimization
        const ssAge = config.settings.socialSecurity.claimAge || 62;
        if (ssAge < 70 && mc.successRate > 90) {
            insights.push({
                type: 'info',
                title: '📈 SS Optimization',
                text: 'High success rate detected. Delaying SS to 70 could maximize legacy.',
                section: 'section-socialsecurity'
            });
        }

        // 5. Withdrawal Strategy Check
        const drawdown = sc?.drawdown;
        if (drawdown && drawdown.InvestmentsTax && drawdown.RetirementSavingsTax) {
            const totalDrawTax = drawdown.InvestmentsTax.reduce((a, b) => a + b, 0) +
                drawdown.RetirementSavingsTax.reduce((a, b) => a + b, 0);
            if (totalDrawTax > 500000) { // Threshold for "High" tax leakage
                insights.push({
                    type: 'warning',
                    title: '💸 Tax Leakage',
                    text: 'Significant tax leakage from withdrawals. Review "Withdrawal Strategy" section.',
                    section: 'section-withdrawals'
                });
            }
        }

        // 6. Portfolio Drag
        const currentAge = config.settings.personal.age || 50;
        const allocation = config.settings.glidePath || {};
        const conservativeAlloc = (allocation.bonds || 0) + (allocation.cash || 0);
        if (currentAge < 55 && conservativeAlloc > 40) {
            insights.push({
                type: 'info',
                title: '📉 Portfolio Drag',
                text: `High cash/bonds allocation (${conservativeAlloc}%) may limit growth. Consider adjusting asset mix.`,
                section: 'section-networth'
            });
        }

        // 7. Inflation Risk
        const netWorths = getNetWorthSeries(scenario);
        const finalNW = netWorths[netWorths.length - 1];
        const startNW = netWorths[0];
        const realGrowth = ((finalNW / startNW) - 1) * 100;
        if (realGrowth < 50) { // Less than 50% real growth over lifetime
            insights.push({
                type: 'warning',
                title: '📊 Inflation Risk',
                text: 'Purchasing power may decline significantly. Review inflation assumptions.',
                section: 'settings-inflation'
            });
        }

        const list = document.getElementById('coachMessageList');
        if (list) {
            list.innerHTML = insights.map(ins => `
                <div class="coach-insight-item" onclick="scrollToSection('${ins.section}')" 
                     style="border-left: 4px solid ${ins.type === 'warning' ? '#ef4444' : (ins.type === 'success' ? '#10b981' : '#3b82f6')}; 
                            padding: 12px; background: rgba(59, 130, 246, 0.05); cursor: pointer;
                            transition: all 0.2s ease;
                            border-radius: 4px;
                            margin-bottom: 8px;"
                     onmouseover="this.style.background='rgba(59, 130, 246, 0.15)'; this.style.transform='translateX(4px)';"
                     onmouseout="this.style.background='rgba(59, 130, 246, 0.05)'; this.style.transform='translateX(0)';">
                    <strong>${ins.title}</strong>
                    <div style="font-size: 0.85rem; opacity: 0.9; margin-top: 4px;">${ins.text}</div>
                </div>
            `).join('') || '<div style="color: var(--text-muted); padding: 10px;">No critical optimizations found.</div>';
        }
    }

    static updateStatusBadge(id, status) {
        const el = document.getElementById(id);
        if (!el) return;
        const badge = el.nextElementSibling;
        if (!badge || !badge.classList.contains('metric-status')) return;

        badge.className = 'metric-status ml-2';
        if (status === 'EXC') {
            badge.classList.add('status-excelling');
            badge.textContent = 'EXC';
        } else if (status === 'PROG') {
            badge.classList.add('status-progressing');
            badge.textContent = 'PROG';
        } else if (status === 'VULN') {
            badge.classList.add('status-vulnerable');
            badge.textContent = 'VULN';
        } else {
            badge.classList.add('status-informational');
            badge.textContent = 'INFO';
        }
    }

    static updateStatusBadgeByValue(id, value, excThreshold, progThreshold, lowerIsBetter = false) {
        let status = 'VULN';
        if (lowerIsBetter) {
            if (value <= excThreshold) status = 'EXC';
            else if (value <= progThreshold) status = 'PROG';
        } else {
            if (value >= excThreshold) status = 'EXC';
            else if (value >= progThreshold) status = 'PROG';
        }
        this.updateStatusBadge(id, status);
    }

    static safeUpdate(id, content) {
        const el = document.getElementById(id);
        if (el) el.textContent = content;
    }
}
