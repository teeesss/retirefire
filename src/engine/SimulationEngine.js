import { config } from '../data/Config.js';
import { TaxCalculator } from './TaxCalculator.js';
import { RothCalculator } from '../roth/RothCalculator.js';
import RothConfig from '../roth/RothConfig.js';

export class SimulationEngine {
    static run() {
        const scenario = config.currentScenario || 'average';
        const optimistic = this.project(config, 'optimistic');
        const average = this.project(config, 'average');
        const pessimistic = this.project(config, 'pessimistic');

        // ALWAYS generate baseline for comparison (Baseline = Roth Disabled)
        // This is needed for Roth metrics calculation even if Roth is currently disabled
        // Uses the CURRENTLY selected scenario to ensure consistency with top metrics (US-061 Fix)
        const baselineConfig = JSON.parse(JSON.stringify(config));
        baselineConfig.settings.taxes.rothConversionEnabled = false;
        // Also disable RothConfig to ensure no conversions in baseline
        const baseline = this.project(baselineConfig, scenario);

        return {
            years: average.years,
            ages: average.ages,
            optimistic,
            average,
            pessimistic,
            baseline
        };
    }

    static project(config, scenario) {
        const years = config.endYear - config.startYear + 1;
        const results = {
            years: [],
            ages: [],
            accounts: {
                RetirementSavings: [],
                RothIRA: [],
                HSA: [],
                Investments: [],
                CashSavings: [],
                Housing: [],
                OtherAssets: [],
                Debt: []
            },
            income: {
                Work: [],
                SocialSecurity: [],
                RMD: [],
                Drawdown: [],
                HomeSale: []
            },
            expenses: {
                General: [],
                Taxes: [],
                Housing: [],
                Medical: [],
                LTC: []
            },
            taxes: {
                Federal: [],
                FICA: [],
                CapGains: [],
                State: []
            },
            drawdown: {
                Investments: [],
                RetirementSavings: [],
                RothIRA: []
            },
            rothConversions: {
                amounts: [],           // Yearly conversion amounts
                taxPaid: [],          // Tax paid on each conversion
                cumulativeConverted: [] // Running total of conversions
            },
            netWorth: [],
            yearsCount: years
        };

        // Initialize starting values
        // Initialize starting values (robust defaults for US-033/034)
        let retirement = config.settings.assets.retirement || 0;
        let roth = config.settings.assets.roth || 0;
        let hsa = config.settings.assets.hsa || 0;
        let investments = config.settings.assets.investments || 0;
        let cash = config.settings.assets.cash || 0;
        let mortgage = config.settings.housing?.mortgageBalance || config.settings.assets.debt || 0;
        let homeValue = config.settings.housing?.homeValue || 0;
        let otherAssets = config.settings.assets.otherAssets || 0;

        const currentRates = {
            return: (config.settings.rates[scenario] || 7.0) / 100,
            inflation: (config.settings.inflation[scenario] || 2.5) / 100
        };

        for (let i = 0; i < years; i++) {
            const currentYear = config.startYear + i;
            const currentAge = config.startAge + i;

            results.years.push(currentYear);
            results.ages.push(currentAge);

            // 1. Income
            let workIncome = 0;
            if (currentAge < config.settings.personal.retireAge) {
                workIncome = config.settings.income.work * Math.pow(1 + config.settings.income.growth / 100, i);
            }

            let ssIncome = 0;
            const ssStartAge = config.settings.socialSecurity.claimAge || 67;
            if (currentAge >= ssStartAge) {
                // Defensive lookup for ssBenefit: fallback to ss67 if specific age missing
                const ssBenefit = config.settings.socialSecurity[`ss${ssStartAge}`] || config.settings.socialSecurity.ss67 || 0;
                ssIncome = ssBenefit * 12 * Math.pow(1 + (config.settings.socialSecurity.cola || 0) / 100, Math.max(0, currentAge - ssStartAge));
            }

            // 1b. RMD Calculation (ISSUE-060)
            let rmdIncome = 0;
            if (currentAge >= 73 && retirement > 0) {
                // IRS Uniform Lifetime Table (2022) - Abbreviated/Approximated
                // 73: 26.5, 75: 24.6, 80: 20.2, 85: 16.0, 90: 12.2, 95: 8.9, 100: 6.4
                const divisors = { 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1, 80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2, 87: 14.4, 88: 13.7, 89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5, 95: 8.9, 96: 8.4, 97: 7.8, 98: 7.3, 99: 6.8, 100: 6.4 };
                let div = divisors[currentAge];
                if (!div) div = currentAge > 100 ? 6.0 : 27.4;

                rmdIncome = retirement / div;
                retirement -= rmdIncome; // Force withdrawal from tax-deferred
            }

            // Real Estate: Sell Home Logic
            let proceeds = 0;
            if (config.settings.housing.sellHome === 'yes' && currentYear === config.settings.housing.sellYear) {
                proceeds = homeValue * (1 - config.settings.housing.saleCosts / 100) - mortgage;
                investments += proceeds;
                homeValue = 0;
                mortgage = 0;
            }

            // Real Estate: Buy Home Logic
            if (config.settings.housing.buyNewHome === 'yes' && currentYear === config.settings.housing.buyYear) {
                const upfront = config.settings.housing.newHomeValue - config.settings.housing.newMortgageAmount;
                investments -= upfront;
                homeValue = config.settings.housing.newHomeValue;
                mortgage = config.settings.housing.newMortgageAmount;
            }

            // 2. Expenses (Partial for tax calculation)
            let multiplier = 1.0;
            const activePhase = (config.settings.expenses.phases || []).find(p => currentAge >= p.startAge && currentAge < p.endAge);
            if (activePhase) multiplier = activePhase.multiplier;

            let generalExp = config.settings.expenses.annualSpending * multiplier * Math.pow(1 + currentRates.inflation, i);

            let housingExp = 0;
            let annualMortgagePayment = 0;
            let activeMortgageRate = (config.settings.housing?.mortgageRate || 0) / 100;

            if (homeValue > 0) {
                const h = config.settings.housing || {};
                housingExp = ((h.propertyTax || 0) + (h.maintenance || 0) + (h.insurance || 0)) * Math.pow(1 + currentRates.inflation, i);
                if (mortgage > 0) {
                    if (currentYear >= (h.buyYear || 0) && h.buyNewHome === 'yes') {
                        // New mortgage payment
                        activeMortgageRate = (h.newMortgageRate || 0) / 100;
                        const rate = activeMortgageRate / 12;
                        const n = (h.newMortgageYears || 30) * 12;
                        const p = (h.newMortgageAmount || 0);
                        if (p > 0 && rate > 0) {
                            const monthly = (p * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
                            annualMortgagePayment = monthly * 12;
                            housingExp += annualMortgagePayment;
                        }
                    } else if (i < (h.mortgageYears || 0)) {
                        annualMortgagePayment = (h.mortgagePayment || 0) * 12;
                        housingExp += annualMortgagePayment;
                    }
                }
            } else {
                // Renting
                const h = config.settings.housing || {};
                housingExp = (h.futureRent || 0) * 12 * Math.pow(1 + (h.rentInflation || 3) / 100, Math.max(0, currentYear - (h.sellYear || 2030)));
            }

            let medicalExp = 0;
            if (currentAge < 65) medicalExp = config.settings.healthcare.preMedicare;
            else medicalExp = config.settings.healthcare.medicare + config.settings.healthcare.outOfPocket;
            medicalExp *= Math.pow(1 + config.settings.healthcare.inflation / 100, i);

            let ltcExp = 0;
            if (currentAge >= config.settings.healthcare.ltcAge) {
                ltcExp = config.settings.healthcare.ltcCost * Math.pow(1 + config.settings.healthcare.ltcInflation / 100, i);
            }

            let totalExpBeforeTax = generalExp + housingExp + medicalExp + ltcExp;

            // 3. Tax Calculation Breakdown
            // Ordinary Income = Work + Social Security (Simplified 85% taxable) + RMDs/Deferred Drawdown
            // We need to know drawdown BEFORE we can calculate tax, but tax affects drawdown.
            // Using last year's or a rough estimate for iterative tax is better, but let's keep it simple:
            // Calculate taxes on known income, then add drawdown-based taxes.

            // Calculate taxes using improved breakdown
            const otherOrdIncome = rmdIncome + (ssIncome * 0.85);
            let estimatedCapGains = 0;

            // Simple estimate for CG from investments to avoid circular reference
            let preTaxGap = Math.max(0, totalExpBeforeTax - (workIncome + ssIncome));
            if (preTaxGap > 0 && investments > 0) {
                const pullFromInvestments = Math.min(investments, preTaxGap);
                estimatedCapGains = pullFromInvestments * 0.5;
            }

            // Include Roth conversion amount in other ordinary income if enabled
            // Use RothCalculator to determine amount based on strategy mode
            let rothConvToProcess = 0;
            const rothSettings = config.settings?.taxes || {};

            if (rothSettings.rothConversionEnabled && currentYear >= rothSettings.rothConvStart && currentYear <= rothSettings.rothConvEnd) {
                // Calculate ordinary income for the year (before conversion)
                const ordinaryIncome = workIncome + otherOrdIncome;

                // Use RothCalculator with a local override object to ensure baseline uses its own 'enabled' state
                rothConvToProcess = RothCalculator.calculateYearlyConversion(
                    currentYear,
                    retirement,
                    ordinaryIncome,
                    config.settings.taxSettings?.filingStatus || 'joint',
                    {
                        enabled: rothSettings.rothConversionEnabled,
                        startYear: rothSettings.rothConvStart,
                        endYear: rothSettings.rothConvEnd,
                        mode: RothConfig.mode,
                        targetBracket: RothConfig.targetBracket,
                        manualAmount: RothConfig.manualAmount,
                        manualOverrides: RothConfig.manualOverrides,
                        maxAnnualCap: RothConfig.maxAnnualCap
                    }
                );

                // Validate conversion amount
                if (rothConvToProcess > retirement) {
                    rothConvToProcess = retirement;
                }
                if (rothConvToProcess < 0) {
                    rothConvToProcess = 0;
                }
            }

            const taxBreakdown = TaxCalculator.calculateTaxBreakdown(
                workIncome,
                otherOrdIncome + rothConvToProcess,
                estimatedCapGains,
                config.settings.taxSettings.filingStatus,
                config.settings.taxSettings.state
            );

            let estimatedTax = taxBreakdown.total;

            // 4. Retirement Contributions
            if (workIncome > 0) {
                retirement += config.settings.income.contribution401k + config.settings.income.employerMatch;
                roth += config.settings.income.rothContrib;
                hsa += config.settings.income.hsaContrib;
            }

            // 5. Growth
            retirement *= (1 + currentRates.return);
            roth *= (1 + currentRates.return);
            hsa *= (1 + currentRates.return);
            investments *= (1 + currentRates.return);
            homeValue *= (1 + config.settings.housing.appreciation / 100);
            otherAssets *= (1 + currentRates.inflation);

            // Amortize Mortgage Principal (ISSUE-058 Fix)
            if (mortgage > 0 && annualMortgagePayment > 0) {
                const annualInterest = mortgage * activeMortgageRate;
                const principalInfo = Math.max(0, annualMortgagePayment - annualInterest);
                if (!isNaN(principalInfo)) {
                    mortgage -= principalInfo;
                    if (mortgage < 0) mortgage = 0;
                }
            }



            // 6. Drawdown logic if expenses > income
            let netFlow = workIncome + ssIncome + rmdIncome - totalExpBeforeTax - estimatedTax;

            let yearlyDrawdownDetail = { Investments: 0, RetirementSavings: 0, RothIRA: 0 };
            if (netFlow < 0) {
                let deficit = Math.abs(netFlow);
                const strategy = config.settings.taxes.withdrawalStrategy || 'grow_tax_deferred';

                if (strategy === 'proportional') {
                    const totalLiquid = investments + retirement + roth;
                    if (totalLiquid > 0) {
                        const invPct = investments / totalLiquid;
                        const retPct = retirement / totalLiquid;
                        const rothPct = roth / totalLiquid;

                        const invAmt = Math.min(investments, deficit * invPct);
                        investments -= invAmt;
                        yearlyDrawdownDetail.Investments = invAmt;

                        const retAmt = Math.min(retirement, deficit * retPct);
                        retirement -= retAmt;
                        yearlyDrawdownDetail.RetirementSavings = retAmt;

                        const rothAmt = Math.min(roth, deficit * rothPct);
                        roth -= rothAmt;
                        yearlyDrawdownDetail.RothIRA = rothAmt;

                        deficit -= (invAmt + retAmt + rothAmt);
                    }
                }

                if (deficit > 0) {
                    let order = [];
                    if (strategy === 'minimize_rmds') {
                        order = ['RetirementSavings', 'Investments', 'RothIRA'];
                    } else {
                        order = ['Investments', 'RetirementSavings', 'RothIRA'];
                    }

                    for (let accountName of order) {
                        if (deficit <= 0) break;

                        if (accountName === 'Investments') {
                            const amount = Math.min(investments, deficit);
                            investments -= amount;
                            deficit -= amount;
                            yearlyDrawdownDetail.Investments += amount;
                        } else if (accountName === 'RetirementSavings') {
                            const amount = Math.min(retirement, deficit);
                            retirement -= amount;
                            deficit -= amount;
                            yearlyDrawdownDetail.RetirementSavings += amount;
                        } else if (accountName === 'RothIRA') {
                            const amount = Math.min(roth, deficit);
                            roth -= amount;
                            deficit -= amount;
                            yearlyDrawdownDetail.RothIRA += amount;
                        }
                    }
                }
            } else {
                investments += netFlow;
            }

            results.drawdown.Investments.push(Math.round(yearlyDrawdownDetail.Investments));
            results.drawdown.RetirementSavings.push(Math.round(yearlyDrawdownDetail.RetirementSavings));
            results.drawdown.RothIRA.push(Math.round(yearlyDrawdownDetail.RothIRA));

            // Roth Conversion Ladder (processed after initial tax est)
            let actualConversion = 0;
            let conversionTax = 0;

            if (rothConvToProcess > 0) {
                if (retirement >= rothConvToProcess) {
                    retirement -= rothConvToProcess;
                    roth += rothConvToProcess;
                    actualConversion = rothConvToProcess;

                    // Calculate marginal tax on conversion for reporting
                    // Calculate tax on base income (without conversion)
                    const baseTaxBreakdown = TaxCalculator.calculateTaxBreakdown(
                        workIncome,
                        otherOrdIncome,
                        estimatedCapGains,
                        config.settings.taxSettings.filingStatus,
                        config.settings.taxSettings.state
                    );

                    // The difference is the tax attributable to the conversion
                    conversionTax = Math.max(0, taxBreakdown.total - baseTaxBreakdown.total);

                    // Note: We do NOT deduct conversionTax from investments here because 
                    // it was already included in the total estimatedTax subtracted from netFlow 
                    // and processed in the drawdown logic above. 
                }
            }

            // Track conversion details
            results.rothConversions.amounts.push(actualConversion);
            results.rothConversions.taxPaid.push(conversionTax);

            // Calculate cumulative converted
            const prevCumulative = i > 0 ? results.rothConversions.cumulativeConverted[i - 1] : 0;
            results.rothConversions.cumulativeConverted.push(prevCumulative + actualConversion);

            // Store results
            results.accounts.RetirementSavings.push(Math.round(retirement));
            results.accounts.RothIRA.push(Math.round(roth));
            results.accounts.HSA.push(Math.round(hsa));
            results.accounts.Investments.push(Math.round(investments));
            results.accounts.CashSavings.push(Math.round(cash));
            // FIX: Housing should represent HOME EQUITY (homeValue - mortgage), not just homeValue
            results.accounts.Housing.push(Math.round(Math.max(0, homeValue - mortgage)));
            results.accounts.OtherAssets.push(Math.round(otherAssets));
            // FIX: Debt should only show mortgage if home exists, otherwise 0
            results.accounts.Debt.push(homeValue > 0 ? Math.round(-mortgage) : 0);

            results.income.Work.push(Math.round(workIncome));
            results.income.SocialSecurity.push(Math.round(ssIncome));
            results.income.RMD.push(Math.round(rmdIncome));
            results.income.Drawdown.push(netFlow < 0 ? Math.round(Math.abs(netFlow)) : 0);

            results.expenses.General.push(Math.round(generalExp));
            results.expenses.Housing.push(Math.round(housingExp));
            results.expenses.Medical.push(Math.round(medicalExp));
            results.expenses.LTC.push(Math.round(ltcExp));
            results.expenses.Taxes.push(Math.round(estimatedTax));

            results.taxes.Federal.push(taxBreakdown.federalOrd);
            results.taxes.FICA.push(taxBreakdown.fica);
            results.taxes.CapGains.push(taxBreakdown.federalCG);
            results.taxes.State.push(taxBreakdown.state);

            // FIX: Net worth calculation - homeValue and mortgage are already accounted for in Housing equity
            // Don't double-count by including both homeValue and -mortgage
            results.netWorth.push(Math.round(retirement + roth + hsa + investments + cash + (homeValue - mortgage) + otherAssets));
        }

        return results;
    }


    static projectPath(config, volatility = 0.15, spendMultiplier = 1.0, marketScenario = 'monte-carlo') {
        const years = config.endYear - config.startYear + 1;
        let results = new Array(years);

        // S&P 500 Historical Data approx (Total Return)
        const historicalReturns = [
            0.2629, -0.1811, 0.2871, 0.1840, 0.3149, 0.2183, -0.0438, 0.1196, 0.0138, 0.1369,
            0.3239, 0.1600, 0.1506, 0.2646, -0.3700, 0.0549, 0.1579, 0.0491, 0.1088, 0.2868,
            -0.2210, -0.1189, -0.0910, 0.2104, 0.2858, 0.3336, 0.2296, 0.3758, 0.0132, 0.1008,
            0.0762, 0.3047, 0.1661, 0.2256, 0.3173, 0.1867, 0.0627, 0.2155, -0.0497, 0.3231,
            0.1106, -0.0718, 0.1431, 0.1898, -0.1078, 0.0438, 0.1124, -0.0843, 0.1245, 0.0656,
            0.1648, 0.1245, 0.2398, -0.1081, 0.4336, 0.5262, -0.0107, 0.1873, 0.3155, 0.0528,
            -0.0814, 0.1873, -0.0101, 0.1162, 0.5399, 0.0710, -0.3503, 0.4767, -0.0573, -0.0973,
            0.3392, -0.0119, -0.4334, -0.0807, 0.4384, 0.1164, -0.3503, 0.4767, -0.0101, 0.1162,
            0.1873, -0.0814, 0.0528, 0.3155, 0.1873, -0.0107, 0.5262, 0.4336, -0.1081, 0.2398,
            0.1245, 0.1648, 0.0656, 0.1245, -0.0843, 0.1124, 0.0438, -0.1078, 0.1898, 0.1431
        ];

        // Scenario starting indices (approx years from 1928 start)
        const scenarios = {
            '1970s': 42,   // 1970
            'dotcom': 72,  // 2000
            'gfc': 79,     // 2007
            'depression': 1 // 1929
        };

        const baseRate = (config.settings.rates.average || 7.0) / 100;
        let startIndex = 0;

        if (marketScenario === 'historical-bootstrap') {
            startIndex = Math.floor(Math.random() * (historicalReturns.length - years));
        } else if (scenarios[marketScenario]) {
            startIndex = scenarios[marketScenario];
        }

        let retirement = config.settings.assets.retirement;
        let roth = config.settings.assets.roth;
        let hsa = config.settings.assets.hsa;
        let investments = config.settings.assets.investments;
        let cash = config.settings.assets.cash;
        let otherAssets = config.settings.assets.otherAssets;
        let inflation = (config.settings?.inflation?.average || 2.5) / 100;

        for (let i = 0; i < years; i++) {
            const currentAge = (config.startAge || 50) + i;
            const isRetired = currentAge >= (config.settings?.personal?.retireAge || 65);

            let r;
            if (marketScenario === 'monte-carlo') {
                // Gaussian random
                r = baseRate + ((Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() - 3) / 3) * volatility;
            } else {
                // Historical sequence
                const histIdx = (startIndex + i) % historicalReturns.length;
                r = historicalReturns[histIdx];
            }

            if (i > 0) {
                retirement *= (1 + r);
                roth *= (1 + r);
                hsa *= (1 + r);
                investments *= (1 + r);
                otherAssets *= (1 + inflation);
            }

            if (!isRetired) {
                retirement += (config.settings?.income?.contribution401k || 0) + (config.settings?.income?.employerMatch || 0);
                roth += (config.settings?.income?.rothContrib || 0);
                hsa += (config.settings?.income?.hsaContrib || 0);
            }

            // Simplified drawdown/spending
            const baseSpend = (config.settings?.expenses?.annualSpending || 60000);
            const spend = baseSpend * spendMultiplier * Math.pow(1 + inflation, i);

            let ss = 0;
            const ssSettings = config.settings?.socialSecurity || {};
            if (currentAge >= (ssSettings.claimAge || 67)) {
                const claimAge = ssSettings.claimAge || 67;
                const benefit = ssSettings['ss' + claimAge] || ssSettings.ss67 || 0;
                ss = benefit * 12 * Math.pow(1 + (ssSettings.cola || 2.0) / 100, currentAge - claimAge);
            }

            let delta = (isRetired ? ss : (config.settings?.income?.work || 0)) - spend;
            if (delta < 0) {
                let pull = Math.abs(delta);
                if (investments >= pull) investments -= pull;
                else { pull -= investments; investments = 0; retirement = Math.max(0, retirement - pull); }
            } else {
                investments += delta;
            }

            results[i] = Math.max(0, retirement + roth + hsa + investments + cash + otherAssets);
        }
        return results;
    }

    static runMonteCarlo(iterations = 1000, volatility = 0.15, spendMultiplier = 1.0, marketScenario = 'monte-carlo') {
        const runs = [];
        for (let i = 0; i < iterations; i++) {
            runs.push(this.projectPath(config, volatility, spendMultiplier, marketScenario));
        }

        const numYears = runs[0].length;
        const percentiles = { p10: [], p25: [], p50: [], p75: [], p90: [], successRate: 0, legacyRate: 0 };
        const legacyGoal = 5000000;

        for (let y = 0; y < numYears; y++) {
            const yearValues = runs.map(r => r[y]).sort((a, b) => a - b);
            percentiles.p10.push(yearValues[Math.floor(iterations * 0.1)]);
            percentiles.p25.push(yearValues[Math.floor(iterations * 0.25)]);
            percentiles.p50.push(yearValues[Math.floor(iterations * 0.5)]);
            percentiles.p75.push(yearValues[Math.floor(iterations * 0.75)]);
            percentiles.p90.push(yearValues[Math.floor(iterations * 0.9)]);

            if (y === numYears - 1) {
                const successes = yearValues.filter(v => v > 0).length;
                percentiles.successRate = (successes / iterations) * 100;
                const legacyMet = yearValues.filter(v => v >= legacyGoal).length;
                percentiles.legacyRate = (legacyMet / iterations) * 100;
            }
        }
        return percentiles;
    }
}
