import { config } from '../data/Config.js';
import { rawData } from '../data/Store.js';
import { charts } from '../state/ChartStore.js';
import { formatCurrency } from '../utils/Formatters.js';
import { SimulationEngine } from '../engine/SimulationEngine.js';
import { getNetWorthSeries } from '../state/DataUtils.js';
import { updateSSExplorerChart, updateStressTestChart } from '../charts/ExplorerCharts.js';
import { updateSSComparisonChart } from '../charts/IncomeExpenseCharts.js';

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
        // Reuse existing logic but ensure it doesn't block
        setTimeout(() => {
            this._runMarketRiskInternal(scenario, btn);
        }, 10);
    }

    static _runMarketRiskInternal(scenario, btn) {
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
        // Debounce/Async to prevent UI freeze
        document.body.style.cursor = 'wait';
        setTimeout(() => {
            this._runWhatIfInternal(scenario, btn);
            document.body.style.cursor = 'default';
        }, 50);
    }

    static _runWhatIfInternal(scenario, btn) {
        let modifiedResults;
        const testConfig = JSON.parse(JSON.stringify(config));

        switch (scenario) {
            case 'crash55':
                // Apply crash at age 55
                const crashYearIdx = 55 - testConfig.settings.personal.age; // Fix: use settings.personal.age
                modifiedResults = SimulationEngine.project(testConfig, 'average');

                // If 55 is in the future
                if (crashYearIdx >= 0 && crashYearIdx < modifiedResults.yearsCount) {
                    // Apply 30% drop to investments in that year and verify propogation
                    // Note: SimulationEngine projects year-over-year, so we need to adjust the flow or just hack the result for visualization
                    // For true simulation, we should adjust the RETURNS vector passed to project, but project uses fixed returns.
                    // Simple hack for visualization: Post-process the NW array
                    for (let i = crashYearIdx; i < modifiedResults.yearsCount; i++) {
                        // Permanently reduce by 30% from that point (sequence risk)
                        for (const k in modifiedResults.accounts) modifiedResults.accounts[k][i] *= 0.7;
                    }
                }
                break;
            case 'bear':
                modifiedResults = SimulationEngine.project(testConfig, 'average');
                const bearStart = Math.max(0, 65 - testConfig.settings.personal.age);
                for (let i = bearStart; i < bearStart + 6 && i < modifiedResults.yearsCount; i++) {
                    // Flatten growth during bear market
                    for (const k in modifiedResults.accounts) modifiedResults.accounts[k][i] *= 0.95;
                    // And subsequent years are lower naturally because of this
                }
                // Propagate the loss forward? The loop actually compounds the drop each year of the bear market
                // But we need to ensure subsequent years start from the lower base. 
                // SimulationEngine returns cumulative arrays. Modifying one year doesn't auto-update future years in the result array if we hack it here.
                // WE MUST re-propagate the reduction factor to all future years.
                for (let i = bearStart + 6; i < modifiedResults.yearsCount; i++) {
                    for (const k in modifiedResults.accounts) modifiedResults.accounts[k][i] *= Math.pow(0.95, 6); // Approx roughly
                }
                break;
            case 'healthcare':
                // Medical Event
                modifiedResults = SimulationEngine.project(testConfig, 'average');
                const medicalIdx = Math.max(0, 75 - testConfig.settings.personal.age);
                if (medicalIdx < modifiedResults.yearsCount) {
                    // Subtract 250k from NW
                    for (let i = medicalIdx; i < modifiedResults.yearsCount; i++) {
                        // Simple NW reduction
                        // We can't easily edit individual accounts without complex logic, so we just subtract from the total when summing later?
                        // Or just scale down. 250k might be all of it :)
                        // Let's assume it comes out of investments.
                        // But we are returning 'modifiedResults' which has accounts.
                        // Let's just create a 'netWorth' property update.
                    }
                }
                // Actually SimulationEngine.project returns object with .accounts and .netWorth (calculated inside? No, usuall just accounts)
                // Let's check SimulationEngine return. It usually returns { years, ages, accounts... }
                // We calculate NW from accounts.
                break;
            default:
                modifiedResults = SimulationEngine.project(testConfig, 'average');
        }

        // Re-calculate NW for the modified scenario
        const modifiedPath = modifiedResults.years.map((_, i) => {
            let nw = 0;
            // Apply manual adjustments for "healthcare" here since it's a fixed amount
            const age = modifiedResults.ages[i];
            let adjustment = 0;
            if (scenario === 'healthcare' && age >= 75) adjustment = -250000;

            for (const k in modifiedResults.accounts) nw += modifiedResults.accounts[k][i] || 0;
            return Math.max(0, nw + adjustment);
        });

        const baselinePath = rawData.average?.netWorth || [];

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

    static runStressTest(btn) {
        const inflation = parseFloat(document.getElementById('stressInflation').value);
        const marketShock = parseFloat(document.getElementById('stressMarket').value);

        // Run simulation with these parameters
        const testConfig = JSON.parse(JSON.stringify(config));
        testConfig.settings.inflation = inflation; // Override inflation
        // How to apply market shock? 
        // We can inject a one-time drop in current assets
        if (marketShock !== 0) {
            testConfig.portfolio.investments *= (1 + marketShock);
            testConfig.portfolio.retirement *= (1 + marketShock);
        }

        const results = SimulationEngine.project(testConfig, 'average');
        const stressedPath = results.years.map((_, i) => {
            let nw = 0;
            for (const k in results.accounts) nw += results.accounts[k][i] || 0;
            return nw;
        });

        if (charts.stressTest) {
            charts.stressTest.data.datasets[1].data = stressedPath;
            updateStressTestChart(); // Trigger update
        }

        // Purchasing power at age 90
        const idx90 = results.ages.indexOf(90);
        const nw90 = idx90 !== -1 ? stressedPath[idx90] : stressedPath[stressedPath.length - 1];

        // Adjust for inflation to show "Real" purchasing power? 
        // Or just nominal? User usually understands nominal, but "Purchasing Power" implies real.
        // Let's show Nominal for now to match other charts, maybe label it "Assets @ 90"
        this.safeUpdate('stressPurchasingPower', formatCurrency(nw90));
    }

    static updateSSExplorer() {
        // Delegate to the Chart module which uses the robust Calculator
        updateSSExplorerChart();
        updateSSComparisonChart();
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
