import { config } from '../data/Config.js';
import { TaxCalculator } from './TaxCalculator.js';

export class SimulationEngine {
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
                CapGains: []
            },
            netWorth: []
        };

        // Initialize starting values
        let retirement = config.settings.assets.retirement;
        let roth = config.settings.assets.roth;
        let hsa = config.settings.assets.hsa;
        let investments = config.settings.assets.investments;
        let cash = config.settings.assets.cash;
        let mortgage = config.settings.assets.mortgage;
        let homeValue = config.settings.assets.homeValue;
        let otherAssets = config.settings.assets.otherAssets;

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
            const ssStartAge = config.settings.socialSecurity.claimAge;
            if (currentAge >= ssStartAge) {
                ssIncome = config.settings.socialSecurity[`ss${ssStartAge}`] * 12 * Math.pow(1 + config.settings.socialSecurity.cola / 100, Math.max(0, currentAge - ssStartAge));
            }

            // 2. Expenses
            // General Spending
            let generalExp = config.settings.expenses.annualSpending * Math.pow(1 + currentRates.inflation, i);

            // Housing
            let housingExp = (config.settings.housing.propertyTax + config.settings.housing.maintenance + config.settings.housing.insurance) * Math.pow(1 + currentRates.inflation, i);
            if (config.settings.housing.mortgageBalance > 0 && i < config.settings.housing.mortgageYears) {
                housingExp += (config.settings.housing.mortgagePayment * 12);
            }

            // Healthcare
            let medicalExp = 0;
            if (currentAge < 65) medicalExp = config.settings.healthcare.preMedicare;
            else medicalExp = config.settings.healthcare.medicare + config.settings.healthcare.outOfPocket;
            medicalExp *= Math.pow(1 + config.settings.healthcare.inflation / 100, i);

            // LTC
            let ltcExp = 0;
            if (currentAge >= config.settings.healthcare.ltcAge) {
                ltcExp = config.settings.healthcare.ltcCost * Math.pow(1 + config.settings.healthcare.ltcInflation / 100, i);
            }

            let totalExpBeforeTax = generalExp + housingExp + medicalExp + ltcExp;

            // Simple logic for taxes - will be refined below
            let estimatedTax = TaxCalculator.calculateFederalSocialSecurity(workIncome + ssIncome, config.settings.taxSettings.filingStatus);

            // 3. Retirement Contributions
            if (workIncome > 0) {
                retirement += config.settings.income.contribution401k + config.settings.income.employerMatch;
                roth += config.settings.income.rothContrib;
                hsa += config.settings.income.hsaContrib;
            }

            // 4. Growth
            retirement *= (1 + currentRates.return);
            roth *= (1 + currentRates.return);
            hsa *= (1 + currentRates.return);
            investments *= (1 + currentRates.return);
            homeValue *= (1 + config.settings.housing.appreciation / 100);
            otherAssets *= (1 + currentRates.inflation);

            // 5. Drawdown logic if expenses > income
            let netFlow = workIncome + ssIncome - totalExpBeforeTax - estimatedTax;

            if (netFlow < 0) {
                let deficit = Math.abs(netFlow);

                // Investements first
                if (investments >= deficit) {
                    investments -= deficit;
                    deficit = 0;
                } else {
                    deficit -= investments;
                    investments = 0;
                }

                // Retirement Savings next
                if (deficit > 0) {
                    if (retirement >= deficit) {
                        retirement -= deficit;
                        deficit = 0;
                    } else {
                        deficit -= retirement;
                        retirement = 0;
                    }
                }

                // Roth last
                if (deficit > 0) {
                    if (roth >= deficit) {
                        roth -= deficit;
                        deficit = 0;
                    } else {
                        deficit -= roth;
                        roth = 0;
                    }
                }
            } else {
                investments += netFlow;
            }

            // Roth Conversion Ladder
            if (config.settings.taxes.rothConversionEnabled && currentYear >= config.settings.taxes.rothConvStart && currentYear <= config.settings.taxes.rothConvEnd) {
                const convAmount = config.settings.taxes.rothConversion;
                if (retirement >= convAmount) {
                    retirement -= convAmount;
                    roth += convAmount;
                    // Tax on conversion is handled by estimatedTax in next iteration or we should add it here
                    estimatedTax += convAmount * (config.settings.taxSettings.fedBracket / 100);
                }
            }

            // Store results
            results.accounts.RetirementSavings.push(Math.round(retirement));
            results.accounts.RothIRA.push(Math.round(roth));
            results.accounts.HSA.push(Math.round(hsa));
            results.accounts.Investments.push(Math.round(investments));
            results.accounts.CashSavings.push(Math.round(cash));
            results.accounts.Housing.push(Math.round(homeValue));
            results.accounts.OtherAssets.push(Math.round(otherAssets));
            results.accounts.Debt.push(Math.round(-mortgage));

            results.income.Work.push(Math.round(workIncome));
            results.income.SocialSecurity.push(Math.round(ssIncome));
            results.income.RMD.push(0); // TODO: Implement RMD
            results.income.Drawdown.push(netFlow < 0 ? Math.round(Math.abs(netFlow)) : 0);

            results.expenses.General.push(Math.round(generalExp));
            results.expenses.Housing.push(Math.round(housingExp));
            results.expenses.Medical.push(Math.round(medicalExp));
            results.expenses.LTC.push(Math.round(ltcExp));
            results.expenses.Taxes.push(Math.round(estimatedTax));

            results.netWorth.push(Math.round(retirement + roth + hsa + investments + cash + homeValue + otherAssets - mortgage));
        }

        return results;
    }

    static run() {
        // Return a global rawData object with all scenarios
        return {
            years: Array.from({ length: config.endYear - config.startYear + 1 }, (_, i) => config.startYear + i),
            ages: Array.from({ length: config.endYear - config.startYear + 1 }, (_, i) => config.startAge + i),
            optimistic: this.project(config, 'optimistic'),
            average: this.project(config, 'average'),
            pessimistic: this.project(config, 'pessimistic')
        };
    }

    static projectPath(config, volatility = 0.15) {
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
        let infl = config.settings.inflation.average / 100;

        for (let i = 0; i < years; i++) {
            const currentAge = config.startAge + i;
            const isRetired = currentAge >= config.settings.personal.retireAge;

            // Gaussian approx
            const r = baseRate + (Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() - 3) / 3 * volatility;

            if (i > 0) {
                retirement *= (1 + r);
                roth *= (1 + r);
                hsa *= (1 + r);
                investments *= (1 + r);
                otherAssets *= (1 + infl);
            }

            if (!isRetired) {
                retirement += config.settings.income.contribution401k + config.settings.income.employerMatch;
                roth += config.settings.income.rothContrib;
                hsa += config.settings.income.hsaContrib;
            }

            // Simplified drawdown/spending
            const spend = config.settings.expenses.annualSpending * Math.pow(1 + infl, i);
            const ss = (currentAge >= config.settings.socialSecurity.claimAge) ? 40000 : 0; // Mock SS

            let delta = (isRetired ? ss : config.settings.income.work) - spend;
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

    static runMonteCarlo(iterations = 1000) {
        const runs = [];
        for (let i = 0; i < iterations; i++) {
            runs.push(this.projectPath(config));
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
