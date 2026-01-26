import { config } from '../data/Config.js';
import { rawData } from '../data/Store.js';
import { charts } from '../state/ChartStore.js';
import { formatCurrency } from '../utils/Formatters.js';
import { SimulationEngine } from '../engine/SimulationEngine.js';
import { getNetWorthSeries } from '../state/DataUtils.js';

export class ExplorerHandler {
    static updateSpending(value) {
        const spending = parseInt(value);
        config.settings.expenses.annualSpending = spending;

        this.safeUpdate('spendingValue', formatCurrency(spending, false));
        this.safeUpdate('spendingMonthly', formatCurrency(spending / 12, false));
        this.safeUpdate('spending25x', formatCurrency(spending * 25));

        // Impact analysis
        const baseline = 90000;
        const diff = spending - baseline;
        const pctDiff = ((diff / baseline) * 100).toFixed(1);
        let impactText = diff > 0 ? `+${formatCurrency(diff, false)}/yr (+${pctDiff}%)` : `${formatCurrency(diff, false)}/yr (${pctDiff}%)`;
        this.safeUpdate('spendingImpact', diff === 0 ? 'Baseline' : impactText);

        window.recalculate();
    }

    static runMarketRisk(scenario, btn) {
        const testConfig = JSON.parse(JSON.stringify(config));
        let results;
        let insight = "";

        switch (scenario) {
            case 'dotcom':
                results = SimulationEngine.project(testConfig, 'average');
                for (let i = 0; i < 3 && i < results.yearsCount; i++) {
                    const factor = [0.85, 0.70, 0.55][i];
                    results.accounts.Investments[i] *= factor;
                    results.accounts.RetirementSavings[i] *= factor;
                }
                insight = "DotCom crash (early sequence risk) drains early principal.";
                break;
            case 'gfc':
                results = SimulationEngine.project(testConfig, 'average');
                const startIdx = Math.max(0, testConfig.settings.personal.retireAge - testConfig.settings.personal.age);
                for (let i = startIdx; i < results.yearsCount; i++) {
                    results.accounts.Investments[i] *= 0.63;
                    results.accounts.RetirementSavings[i] *= 0.63;
                }
                insight = "GFC crash at retirement destroys the safe withdrawal safety net.";
                break;
            default:
                results = SimulationEngine.project(testConfig, 'average');
                insight = "Baseline average market conditions.";
        }

        const path = results.years.map((_, i) => {
            let nw = 0;
            for (const k in results.accounts) nw += results.accounts[k][i] || 0;
            return nw;
        });

        if (charts.marketRisk) {
            charts.marketRisk.data.datasets[1].data = path;
            charts.marketRisk.update();
        }

        this.safeUpdate('riskLegacyValue', formatCurrency(path[path.length - 1]));
        this.safeUpdate('riskInsightText', insight);

        document.querySelectorAll('.risk-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
    }

    static updateSSExplorer() {
        const pia = parseFloat(document.getElementById('ssPiaInput')?.value || 2800);
        const data62 = [], data67 = [], data70 = [];
        let c62 = 0, c67 = 0, c70 = 0;

        for (let age = 62; age <= 95; age++) {
            c62 += pia * 0.7 * 12;
            if (age >= 67) c67 += pia * 1.0 * 12;
            if (age >= 70) c70 += pia * 1.24 * 12;
            data62.push(c62); data67.push(c67); data70.push(c70);
        }

        if (charts.ssExplorer) {
            charts.ssExplorer.data.labels = Array.from({ length: 34 }, (_, i) => 62 + i);
            charts.ssExplorer.data.datasets[0].data = data62;
            charts.ssExplorer.data.datasets[1].data = data67;
            charts.ssExplorer.data.datasets[2].data = data70;
            charts.ssExplorer.update();
        }

        this.safeUpdate('ssMonthlyValue', formatCurrency(pia));
    }

    static safeUpdate(id, content) {
        const el = document.getElementById(id);
        if (el) el.textContent = content;
    }
}
