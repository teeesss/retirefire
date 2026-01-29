import { config } from '../data/Config.js';
import { TaxCalculator } from './TaxCalculator.js';

export class SimulationEngine {
    static run() {
        const optimistic = this.project(config, 'optimistic');
        const average = this.project(config, 'average');
        const pessimistic = this.project(config, 'pessimistic');

        return {
            years: average.years,
            ages: average.ages,
            optimistic,
            average,
            pessimistic
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

        const rates = {
            optimistic: { return: 0.08, inflation: 0.02 },
            average: { return: 0.06, inflation: 0.03 },
            pessimistic: { return: 0.04, inflation: 0.04 }
        };
        const currentRates = rates[scenario] || rates.average;

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
            let rothConvToProcess = 0;
            if (config.settings.taxes.rothConversionEnabled && currentYear >= config.settings.taxes.rothConvStart && currentYear <= config.settings.taxes.rothConvEnd) {
                rothConvToProcess = config.settings.taxes.rothConversion || 0;
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

            // Roth Conversion Ladder (processed after initial tax est, but amount was included in breakdown)
            if (rothConvToProcess > 0) {
                if (retirement >= rothConvToProcess) {
                    retirement -= rothConvToProcess;
                    roth += rothConvToProcess;

                    // Note: Taxes for this were already calculated in taxBreakdown above
                    // We just need to pay them from liquid assets
                    const convTax = taxBreakdown.federalOrd * (rothConvToProcess / (workIncome + otherOrdIncome + rothConvToProcess || 1));
                    // Actually, let's keep it simple: the total estimatedTax already includes it.
                    // If we pull tax for conversion specifically, we subtract it here.
                }
            }

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


    static projectPath(config, volatility = 0.15, spendMultiplier = 1.0) {
        const years = config.endYear - config.startYear + 1;
        let results = new Array(years);
        let currentConfig = JSON.parse(JSON.stringify(config));

        // Randomize returns for each year
        const baseRate = config.settings.rates.average / 100;

        // Simplified projection for MC
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

            // Gaussian approx for random returns
            // Using Box-Muller-ish approach for better normalization
            const r = baseRate + ((Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() - 3) / 3) * volatility;

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

    static runMonteCarlo(iterations = 1000, volatility = 0.15, spendMultiplier = 1.0) {
        const runs = [];
        for (let i = 0; i < iterations; i++) {
            runs.push(this.projectPath(config, volatility, spendMultiplier));
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
