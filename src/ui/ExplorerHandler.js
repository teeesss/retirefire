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

    static runWhatIf(scenario, btn) {
        let modifiedResults;
        let diffText = "";
        const testConfig = JSON.parse(JSON.stringify(config));

        switch (scenario) {
            case 'crash55':
                modifiedResults = SimulationEngine.project(testConfig, 'average');
                const crashYearIdx = 55 - testConfig.startAge;
                if (crashYearIdx >= 0 && crashYearIdx < modifiedResults.yearsCount) {
                    modifiedResults.accounts.Investments[crashYearIdx] *= 0.7;
                    modifiedResults.accounts.RetirementSavings[crashYearIdx] *= 0.7;
                    // Cascade properties? Simple version: just drop it that year.
                }
                diffText = "Market crash at 55 reduces assets by 30%.";
                break;
            case 'bear':
                modifiedResults = SimulationEngine.project(testConfig, 'average');
                // Simulate 6 years of poor returns
                const bearStart = modifiedResults.ages.indexOf(65);
                if (bearStart !== -1) {
                    for (let i = bearStart; i < bearStart + 6 && i < modifiedResults.yearsCount; i++) {
                        modifiedResults.accounts.Investments[i] *= 0.95;
                    }
                }
                diffText = "6-year bear market sequence after age 65.";
                break;
            case 'healthcare':
                modifiedResults = SimulationEngine.project(testConfig, 'average');
                const medicalIdx = modifiedResults.ages.indexOf(75);
                if (medicalIdx !== -1) {
                    modifiedResults.expenses.Medical[medicalIdx] += 250000;
                }
                diffText = "$250k major healthcare event at age 75.";
                break;
            default:
                modifiedResults = SimulationEngine.project(testConfig, 'average');
                diffText = "Baseline average scenario.";
        }

        const baselinePath = rawData.average?.netWorth || [];
        const modifiedPath = modifiedResults.netWorth || [];

        if (charts.whatIf) {
            charts.whatIf.data.datasets[0].data = baselinePath;
            charts.whatIf.data.datasets[1].data = modifiedPath;
            charts.whatIf.update();
        }

        this.safeUpdate('whatIfNW95', formatCurrency(modifiedPath[modifiedPath.length - 1]));
        const success = modifiedPath[modifiedPath.length - 1] > 0 ? "100%" : "0%";
        this.safeUpdate('whatIfSuccess', success);

        document.querySelectorAll('.explorer-card').forEach(b => b.classList.remove('highlight'));
        if (btn) btn.classList.add('highlight');
    }

    static updateSSExplorer() {
        const pia = parseFloat(document.getElementById('ssPiaInput')?.value || 2800);
        const claimAge = config.settings.socialSecurity.claimAge || 67;

        // Calculate factors based on FRA 67 (Standard SSA percentages)
        const getFactor = (age) => {
            if (age === 67) return 1.0;
            if (age < 67) return 1.0 - (67 - age) * 0.0667;
            return 1.0 + (age - 67) * 0.08;
        };

        const f62 = getFactor(62), f67 = getFactor(67), f70 = getFactor(70);
        const currentFactor = getFactor(claimAge);

        const data62 = [], data67 = [], data70 = [], labels = [];
        let c62 = 0, c67 = 0, c70 = 0;

        for (let age = 62; age <= 95; age++) {
            labels.push(`Age ${age}`);
            c62 += Math.round(pia * f62 * 12);
            c67 += age >= 67 ? Math.round(pia * f67 * 12) : 0;
            c70 += age >= 70 ? Math.round(pia * f70 * 12) : 0;

            data62.push(c62);
            data67.push(c67);
            data70.push(c70);
        }

        if (charts.ssExplorer) {
            charts.ssExplorer.data.labels = labels;
            charts.ssExplorer.data.datasets[0].data = data62;
            charts.ssExplorer.data.datasets[1].data = data67;
            charts.ssExplorer.data.datasets[2].data = data70;
            charts.ssExplorer.update();
        }

        // Update Top Stats
        const monthly = pia * currentFactor;
        this.safeUpdate('ssMonthlyValue', formatCurrency(monthly, false));
        this.safeUpdate('ssAnnualValue', formatCurrency(monthly * 12, false));
        this.safeUpdate('ssLifetimeValue', formatCurrency(monthly * 12 * (95 - claimAge)));

        // Update Comparison Stats
        this.safeUpdate('ss62', formatCurrency(pia * f62) + '/mo');
        this.safeUpdate('ss67', formatCurrency(pia * f67) + '/mo');
        this.safeUpdate('ss70', formatCurrency(pia * f70) + '/mo');

        this.safeUpdate('ss62Lifetime', 'Life: ' + formatCurrency(pia * f62 * 12 * (95 - 62)));
        this.safeUpdate('ss67Lifetime', 'Life: ' + formatCurrency(pia * f67 * 12 * (95 - 67)));
        this.safeUpdate('ss70Lifetime', 'Life: ' + formatCurrency(pia * f70 * 12 * (95 - 70)));

        // Update current claim age display
        this.safeUpdate('currentSSClaimAge', claimAge);
    }

    static safeUpdate(id, content) {
        const el = document.getElementById(id);
        if (el) el.textContent = content;
    }

    static setSSClaimAge(age, btn) {
        config.settings.socialSecurity.claimAge = age;
        const currentDisplay = document.getElementById('currentSSClaimAge');
        if (currentDisplay) currentDisplay.textContent = age;

        document.querySelectorAll('.age-tab').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');

        this.updateSSExplorer();
        if (window.recalculate) window.recalculate();
    }
}

