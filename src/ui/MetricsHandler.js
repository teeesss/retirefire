import { config } from '../data/Config.js';
import { rawData } from '../data/Store.js';
import { formatCurrency } from '../utils/Formatters.js';
import { getNetWorthSeries } from '../state/DataUtils.js';

export class MetricsHandler {
    static updateMetrics() {
        let scenario = config.currentScenario;
        if (scenario === 'all') scenario = 'average';

        const netWorths = getNetWorthSeries(scenario);
        const currentNW = netWorths[0];
        const peakNW = Math.max(...netWorths);
        const peakIndex = netWorths.indexOf(peakNW);

        const scenarioLabel = config.currentScenario.charAt(0).toUpperCase() + config.currentScenario.slice(1);
        this.safeUpdate('metricScenarioLabel', scenarioLabel);

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

        const mc = rawData.monteCarlo || { successRate: 97 };
        const successRate = mc.successRate;
        this.safeUpdate('metricSuccess', successRate.toFixed(0) + '%');
        this.safeUpdate('metricRetireAge', config.settings.personal.retireAge);

        const rYear = (rawData.years?.[0] || 2025) + (config.settings.personal.retireAge - (rawData.ages?.[0] || 30));
        this.safeUpdate('metricRetireYear', `Year ${rYear}`);

        const ssBenefit = config.settings.socialSecurity.ss67;
        this.safeUpdate('metricSS', formatCurrency(ssBenefit, false) + '/mo');
        this.safeUpdate('metricSSAge', `Starting Age ${config.settings.socialSecurity.claimAge || 62}`);

        // Extended Metrics
        const outOfMoney = netWorths.findIndex(nw => nw <= 0);
        const outOfMoneyAge = (outOfMoney === -1) ? 'Never' : (rawData.ages?.[outOfMoney] !== undefined ? 'Age ' + rawData.ages[outOfMoney] : 'Run Out');
        this.safeUpdate('mNeverRunOut', outOfMoneyAge);

        const retirementSpend = config.settings.expenses.annualSpending || 80000;
        const assetsRequired = retirementSpend * 25;
        const currentAssets = (config.settings.assets.retirement || 0) + (config.settings.assets.roth || 0) + (config.settings.assets.investments || 0);
        const savingsRatio = assetsRequired > 0 ? (currentAssets / assetsRequired * 100).toFixed(0) : 0;
        this.safeUpdate('mSavingsRatio', savingsRatio + '%');

        const debt = rawData[scenario]?.accounts?.Debt;
        const debtIdx = debt ? debt.findIndex((d, idx) => d >= 0 && idx > 0) : -1;
        const isAlreadyPaidOff = debt && debt[0] >= 0;
        this.safeUpdate('mDebtFree', isAlreadyPaidOff ? 'Paid Off' : (debtIdx !== -1 ? `Age ${config.settings.personal.age + debtIdx}` : 'Paid Off'));

        this.updateCoach();
    }

    static updateCoach() {
        let scenario = config.currentScenario;
        if (scenario === 'all') scenario = 'average';
        const sc = rawData[scenario];
        const mc = rawData.monteCarlo || { successRate: 95 };
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
        const taxableGapIdx = sc.accounts.Investments.findIndex((v, i) => v <= 0 && rawData.ages[i] < 60);
        if (taxableGapIdx !== -1) {
            insights.push({
                type: 'warning',
                title: '⚠️ Liquidity Gap',
                text: 'Potential shortfall before age 60 penalties expire.',
                section: 'section-withdrawals'
            });
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
                text: 'High success rate detected. Delaying SS to 70 could maximize your legacy.',
                section: 'section-socialsecurity'
            });
        }

        // 5. Withdrawal Strategy Check
        const drawdown = sc.drawdown;
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

        // 6. Portfolio Drag (NEW)
        const currentAge = config.settings.personal.age || 50;
        const allocation = config.settings.assets.allocation || {};
        const conservativeAlloc = (allocation.bonds || 0) + (allocation.cash || 0);
        if (currentAge < 55 && conservativeAlloc > 40) {
            insights.push({
                type: 'info',
                title: '📉 Portfolio Drag',
                text: `High cash/bonds allocation (${conservativeAlloc}%) may limit growth. Consider adjusting asset mix.`,
                section: 'section-networth'
            });
        }

        // 7. Inflation Risk (NEW)
        const finalNW = getNetWorthSeries(scenario)[getNetWorthSeries(scenario).length - 1];
        const currentNW = getNetWorthSeries(scenario)[0];
        const realGrowth = ((finalNW / currentNW) - 1) * 100;
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

    static safeUpdate(id, content) {
        const el = document.getElementById(id);
        if (el) el.textContent = content;
    }
}
