import { config } from '../data/Config.js';
import { rawData } from '../data/Store.js';
import { formatCurrency } from '../utils/Formatters.js';
import { getNetWorthSeries, calculateNetWorth, getTotalIncome, getTotalExpenses, getTotalTaxes } from '../state/DataUtils.js';

export class MetricsHandler {
    static updateMetrics() {
        const scenario = config.currentScenario;
        const netWorths = getNetWorthSeries(scenario);
        const currentNW = netWorths[0];
        const peakNW = Math.max(...netWorths);
        const peakIndex = netWorths.indexOf(peakNW);

        this.safeUpdate('metricCurrentNW', formatCurrency(currentNW));
        this.safeUpdate('metricPeakNW', formatCurrency(peakNW));
        this.safeUpdate('metricPeakYear', `Age ${rawData.ages[peakIndex]} (${rawData.years[peakIndex]})`);
        this.safeUpdate('metricPeakGrowth', `+${((peakNW - currentNW) / currentNW * 100).toFixed(0)}%`);

        const successRate = 97;
        this.safeUpdate('metricSuccess', successRate + '%');
        this.safeUpdate('metricRetireAge', config.settings.personal.retireAge);

        const ssBenefit = config.settings.socialSecurity.ss67;
        this.safeUpdate('metricSS', formatCurrency(ssBenefit, false) + '/mo');

        // Extended Metrics
        const outOfMoney = netWorths.findIndex(nw => nw <= 0);
        this.safeUpdate('mNeverRunOut', outOfMoney === -1 ? 'Never' : 'Age ' + rawData.ages[outOfMoney]);

        const retirementSpend = config.settings.expenses.annualSpending;
        const assetsRequired = retirementSpend * 25;
        const currentAssets = (config.settings.assets.retirement || 0) + (config.settings.assets.roth || 0) + (config.settings.assets.investments || 0);
        const savingsRatio = (currentAssets / assetsRequired * 100).toFixed(0);
        this.safeUpdate('mSavingsRatio', savingsRatio + '%');

        // Debt Free Age
        const debtIdx = rawData[scenario].accounts.Debt.findIndex((d, idx) => d >= 0 && idx > 0);
        this.safeUpdate('mDebtFree', debtIdx !== -1 ? `Age ${config.settings.personal.age + debtIdx}` : 'Paid Off');

        this.updateCoach();
    }

    static updateCoach() {
        const sc = rawData[config.currentScenario];
        const mc = rawData.monteCarlo || { successRate: 95 };
        const insights = [];

        // 1. Success Rate Insight
        if (mc.successRate > 95) {
            insights.push({ type: 'success', title: '🎉 High Confidence', text: 'Plan is extremely robust. Consider early gifting.' });
        } else if (mc.successRate < 70) {
            insights.push({ type: 'warning', title: '⚠️ Risk Alert', text: 'Low success probability. Consider delaying retirement.' });
        }

        // 2. Liquidity Check (Age 60)
        const taxableGapIdx = sc.accounts.Investments.findIndex((v, i) => v <= 0 && rawData.ages[i] < 60);
        if (taxableGapIdx !== -1) {
            insights.push({ type: 'warning', title: '⚠️ Liquidity Gap', text: 'Potential shortfall before age 60 penalties expire.' });
        }

        // 3. Tax Optimization
        if (!config.settings.taxes.rothConversionEnabled) {
            insights.push({ type: 'info', title: '🏦 Tax Strategy', text: 'High potential for Roth Conversion savings.' });
        }

        const list = document.getElementById('coachMessageList');
        if (list) {
            list.innerHTML = insights.map(ins => `
                <div style="border-left: 4px solid ${ins.type === 'warning' ? '#ef4444' : (ins.type === 'success' ? '#10b981' : '#3b82f6')}; padding: 10px; margin-bottom: 8px; background: rgba(0,0,0,0.02);">
                    <strong>${ins.title}</strong>
                    <div style="font-size: 0.85rem; opacity: 0.8;">${ins.text}</div>
                </div>
            `).join('') || 'No critical optimizations found.';
        }
    }

    static safeUpdate(id, content) {
        const el = document.getElementById(id);
        if (el) el.textContent = content;
    }
}
