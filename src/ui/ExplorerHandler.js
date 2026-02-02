import { config } from '../data/Config.js';
import { rawData } from '../data/Store.js';
import { charts } from '../state/ChartStore.js';
import { formatCurrency } from '../utils/Formatters.js';
import { SimulationEngine } from '../engine/SimulationEngine.js';
import { accountNames } from '../data/Constants.js';
import { getNetWorthSeries, calculateNetWorth, getTotalIncome, getTotalExpenses, getTotalTaxes } from '../state/DataUtils.js';
import { updateSSExplorerChart, updateStressTestChart } from '../charts/ExplorerCharts.js';
import { updateSSComparisonChart } from '../charts/IncomeExpenseCharts.js';

export class ExplorerHandler {
    /**
     * Initialize the year slider with correct max value based on simulation data
     */
    static initYearSlider() {
        const slider = document.getElementById('yearSlider');
        if (!slider || !rawData.years) {
            console.warn('⚠️ Year slider or rawData.years not available');
            return;
        }

        const maxYears = rawData.years.length - 1;
        slider.max = maxYears;
        console.log(`✅ Year slider initialized: 0 to ${maxYears} (${rawData.years.length} years)`);

        // Initialize with current value
        this.updateYear(slider.value || 0);
    }

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

    static updateYear(value) {
        const idx = parseInt(value);

        // Enhanced error checking
        if (!rawData || !rawData.years) {
            console.error('❌ updateYear: rawData or rawData.years is undefined');
            return;
        }

        if (!rawData.years[idx]) {
            console.error(`❌ updateYear: No data for index ${idx} (max: ${rawData.years.length - 1})`);
            return;
        }

        console.log(`📅 updateYear called: index=${idx}, year=${rawData.years[idx]}, age=${rawData.ages[idx]}`);

        const scenario = config.currentScenario;
        const year = rawData.years[idx];
        const age = rawData.ages[idx];

        // Update Labels
        this.safeUpdate('selectedYear', year);
        this.safeUpdate('selectedAge', age);
        this.safeUpdate('selectedScenarioLabel', scenario.charAt(0).toUpperCase() + scenario.slice(1));

        // Update Stat Cards
        const spend = getTotalExpenses(scenario, idx);
        const nw = calculateNetWorth(scenario, idx);
        const income = getTotalIncome(scenario, idx);
        const taxes = getTotalTaxes(scenario, idx);

        this.safeUpdate('explorerSpend', formatCurrency(spend));
        this.safeUpdate('explorerNW', formatCurrency(nw));
        this.safeUpdate('explorerImpact', formatCurrency(income - spend - taxes));

        // Update Account Breakdown
        const breakdownEl = document.getElementById('accountBreakdown');
        if (breakdownEl) {
            const accounts = rawData[scenario].accounts;
            let html = '<div class="breakdown-grid">';
            for (const key in accounts) {
                const val = accounts[key][idx] || 0;
                if (val !== 0 || key === 'Cash') {
                    html += `
                        <div class="breakdown-item">
                            <span class="label">${accountNames[key] || key}</span>
                            <span class="value">${formatCurrency(val)}</span>
                        </div>
                    `;
                }
            }
            html += '</div>';
            breakdownEl.innerHTML = html;
        }

        // Update Cash Flow Details
        const cashFlowEl = document.getElementById('cashFlowDetails');
        if (cashFlowEl) {
            const data = rawData[scenario];
            const incWork = (data.income?.Work?.[idx] || 0);
            const incSS = (data.income?.SocialSecurity?.[idx] || 0);
            const incOther = (data.income?.Drawdown?.[idx] || 0) + (data.income?.RMD?.[idx] || 0);

            const taxesFed = (data.taxes?.Federal?.[idx] || 0);
            const taxesState = (data.taxes?.State?.[idx] || 0);
            const taxesFica = (data.taxes?.FICA?.[idx] || 0);

            cashFlowEl.innerHTML = `
                <div class="breakdown-grid">
                    <div class="breakdown-item"><span class="label">Work Income</span><span class="value positive">${formatCurrency(incWork)}</span></div>
                    <div class="breakdown-item"><span class="label">Social Security</span><span class="value positive">${formatCurrency(incSS)}</span></div>
                    <div class="breakdown-item"><span class="label">Other Income</span><span class="value positive">${formatCurrency(incOther)}</span></div>
                    <div class="breakdown-item"><span class="label">Federal Tax</span><span class="value negative">${formatCurrency(taxesFed)}</span></div>
                    <div class="breakdown-item"><span class="label">State Tax</span><span class="value negative">${formatCurrency(taxesState)}</span></div>
                    <div class="breakdown-item"><span class="label">FICA Tax</span><span class="value negative">${formatCurrency(taxesFica)}</span></div>
                    <div class="breakdown-item highlight"><span class="label">Net Cash Flow</span><span class="value ${income - spend - taxes >= 0 ? 'positive' : 'negative'}">${formatCurrency(income - spend - taxes)}</span></div>
                </div>
            `;
        }
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

        this.safeUpdate('stressPurchasingPower', formatCurrency(nw90));
    }

    static runSequenceRisk(scenario, btn) {
        document.body.style.cursor = 'wait';
        setTimeout(() => {
            this._runSequenceRiskInternal(scenario, btn);
            document.body.style.cursor = 'default';
        }, 50);
    }

    static _runSequenceRiskInternal(scenario, btn) {
        const testConfig = JSON.parse(JSON.stringify(config));
        let results = SimulationEngine.project(testConfig, 'average');
        const retireIdx = Math.max(0, testConfig.settings.personal.retireAge - testConfig.settings.personal.age);

        // Base case path
        const baselinePath = rawData.average?.netWorth || [];
        let modifiedPath = [...baselinePath];

        if (scenario === 'pre' || scenario === 'post') {
            const crashYearIdx = scenario === 'pre' ? Math.max(0, retireIdx - 2) : Math.min(results.yearsCount - 1, retireIdx + 2);

            // Re-run projection with a one-time massive hit
            // For visualization we can just apply a 30% hit and propagate.
            for (let i = crashYearIdx; i < results.yearsCount; i++) {
                // Apply a 30% hit in that specific year, but since these are cumulative, 
                // we hit it once and carry it forward.
                const factor = 0.7; // 30% crash
                modifiedPath[i] *= factor;
            }
        }

        if (charts.sequenceRisk) {
            // Check if we need to change chart type from Bar to Line for the explorer
            if (charts.sequenceRisk.config.type === 'bar') {
                // Better to use a line chart for NW comparison in the explorer
            }

            // For now, let's update datasets. Note: initSequenceRiskChart created a Bar chart.
            // We might want to fix initSequenceRiskChart too.
            // But let's just use the baseline and modified paths.
            charts.sequenceRisk.data.datasets[0].data = baselinePath;
            if (charts.sequenceRisk.data.datasets.length < 2) {
                charts.sequenceRisk.data.datasets.push({
                    label: 'Stressed Path',
                    data: modifiedPath,
                    borderColor: '#ef4444',
                    borderWidth: 2,
                    pointRadius: 0,
                    type: 'line'
                });
            } else {
                charts.sequenceRisk.data.datasets[1].data = modifiedPath;
            }
            charts.sequenceRisk.update();
        }

        const finalNW = modifiedPath[modifiedPath.length - 1];
        this.safeUpdate('seqRiskNW', formatCurrency(finalNW));
        this.safeUpdate('seqRiskSuccess', finalNW > 0 ? "Pass" : "Fail");

        document.querySelectorAll('.explore-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
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
