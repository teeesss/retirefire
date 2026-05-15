import { config } from '../data/Config.js';
import { TaxCalculator } from './TaxCalculator.js';
import { RothCalculator } from '../roth/RothCalculator.js';
import RothConfig from '../roth/RothConfig.js';

/**
 * Mulberry32 Seeded Pseudo-Random Number Generator
 * Fast, high-quality PRNG suitable for Monte Carlo simulations
 * Provides reproducible random sequences when given the same seed
 */
class SeededRandom {
    /**
     * @param {number} seed - Integer seed value (default: current timestamp)
     */
    constructor(seed = Date.now()) {
        this.seed = seed >>> 0; // Ensure 32-bit unsigned integer
    }

    /**
     * Generate next random number in [0, 1)
     * @returns {number} Random number between 0 (inclusive) and 1 (exclusive)
     */
    next() {
        this.seed = (this.seed + 0x6D2B79F5) | 0;
        let t = Math.imul(this.seed ^ (this.seed >>> 15), 1 | this.seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    /**
     * Generate Gaussian (normal) random number using Box-Muller transform
     * @param {number} mean - Mean of the distribution (default: 0)
     * @param {number} stdDev - Standard deviation (default: 1)
     * @returns {number} Random number from normal distribution
     */
    nextGaussian(mean = 0, stdDev = 1) {
        // Ensure u1 is in (0, 1] to avoid log(0)
        const u1 = 1 - this.next();
        const u2 = this.next();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return mean + z0 * stdDev;
    }
}

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

    /**
     * Initialize empty results structure
     */
    static _initializeResults(years) {
        return {
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
                HomeSale: [],
                InvestmentsDrawdown: [],
                RetirementSavingsDrawdown: [],
                RothIRADrawdown: [],
                HSADrawdown: [],
                CashSavingsDrawdown: []
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
                State: [],
                Penalty: []
            },
            drawdown: {
                Investments: [],
                InvestmentsTax: [],
                RetirementSavings: [],
                RetirementSavingsTax: [],
                RothIRA: [],
                RothIRATax: [],
                HSA: [],
                HSATax: [],
                CashSavings: [],
                CashSavingsTax: []
            },
            rothConversions: {
                amounts: [],
                taxPaid: [],
                cumulativeConverted: []
            },
            netWorth: [],
            yearsCount: years
        };
    }

    /**
     * Initialize starting account balances
     */
    static _initializeState(config) {
        return {
            retirement: config.settings?.assets?.retirement || 0,
            roth: config.settings?.assets?.roth || 0,
            hsa: config.settings?.assets?.hsa || 0,
            investments: config.settings?.assets?.investments || 0,
            cash: config.settings?.assets?.cash || 0,
            mortgage: config.settings?.housing?.mortgageBalance || config.settings?.assets?.debt || 0,
            homeValue: config.settings?.housing?.homeValue || 0,
            otherAssets: config.settings?.assets?.otherAssets || 0
        };
    }

    /**
     * Append year results to results arrays
     */
    static _appendResults(results, yearResults, yearIndex) {
        results.years.push(yearResults.year);
        results.ages.push(yearResults.age);

        // Accounts
        Object.keys(results.accounts).forEach(key => {
            results.accounts[key].push(yearResults.accounts[key]);
        });

        // Income
        Object.keys(results.income).forEach(key => {
            if (key === 'InvestmentsDrawdown') {
                results.income[key].push(yearResults.drawdown.Investments);
            } else if (key === 'RetirementSavingsDrawdown') {
                results.income[key].push(yearResults.drawdown.RetirementSavings);
            } else if (key === 'RothIRADrawdown') {
                results.income[key].push(yearResults.drawdown.RothIRA);
            } else if (key === 'HSADrawdown') {
                results.income[key].push(yearResults.drawdown.HSA);
            } else if (key === 'CashSavingsDrawdown') {
                results.income[key].push(yearResults.drawdown.CashSavings);
            } else {
                results.income[key].push(yearResults.income[key]);
            }
        });

        // Expenses
        Object.keys(results.expenses).forEach(key => {
            results.expenses[key].push(yearResults.expenses[key]);
        });

        // Taxes
        Object.keys(results.taxes).forEach(key => {
            if (key === 'Penalty') {
                results.taxes[key].push(yearResults.taxes.Penalty || 0);
            } else {
                results.taxes[key].push(yearResults.taxes[key]);
            }
        });

        // Drawdown
        results.drawdown.Investments.push(yearResults.drawdown.Investments);
        results.drawdown.InvestmentsTax.push(yearResults.drawdown.InvestmentsTax || 0);
        results.drawdown.RetirementSavings.push(yearResults.drawdown.RetirementSavings);
        results.drawdown.RetirementSavingsTax.push(yearResults.drawdown.RetirementSavingsTax || 0);
        results.drawdown.RothIRA.push(yearResults.drawdown.RothIRA);
        results.drawdown.RothIRATax.push(yearResults.drawdown.RothIRATax || 0);
        results.drawdown.HSA.push(yearResults.drawdown.HSA);
        results.drawdown.HSATax.push(yearResults.drawdown.HSATax || 0);
        results.drawdown.CashSavings.push(yearResults.drawdown.CashSavings);
        results.drawdown.CashSavingsTax.push(yearResults.drawdown.CashSavingsTax || 0);

        // Roth Conversions
        results.rothConversions.amounts.push(yearResults.rothConversion.amount);
        results.rothConversions.taxPaid.push(yearResults.rothConversion.taxPaid);
        const prevCumulative = yearIndex > 0 ? results.rothConversions.cumulativeConverted[yearIndex - 1] : 0;
        results.rothConversions.cumulativeConverted.push(prevCumulative + yearResults.rothConversion.amount);

        // Net Worth
        results.netWorth.push(yearResults.netWorth);
    }

    /**
     * Process a single year of financial projections
     * This is the core calculation engine used by both project() and Monte Carlo simulations
     * 
     * @param {Object} state - Current account balances { retirement, roth, hsa, investments, cash, mortgage, homeValue, otherAssets }
     * @param {Object} config - Configuration object
     * @param {number} currentYear - Year being processed
     * @param {number} currentAge - Age in this year
     * @param {number} yearIndex - Index of year (0-based)
     * @param {number} marketReturn - Market return rate for this year (decimal, e.g., 0.07)
     * @param {number} inflationRate - Inflation rate for this year (decimal, e.g., 0.025)
     * @returns {Object} { newState, yearResults }
     */
    static _processYear(state, config, currentYear, currentAge, yearIndex, marketReturn, inflationRate) {
        // Make a copy of state to avoid mutations
        let { retirement, roth, hsa, investments, cash, mortgage, homeValue, otherAssets } = state;

        // 1. Income Calculations
        let workIncome = 0;
        if (currentAge < (config.settings?.personal?.retireAge || 65)) {
            workIncome = (config.settings?.income?.work || 0) * Math.pow(1 + (config.settings?.income?.growth || 0) / 100, yearIndex);
        }

        let ssIncome = 0;
        const ssStartAge = config.settings?.socialSecurity?.claimAge || 67;
        if (currentAge >= ssStartAge) {
            const ssBenefit = config.settings?.socialSecurity?.[`ss${ssStartAge}`] || config.settings?.socialSecurity?.ss67 || 0;
            ssIncome = ssBenefit * 12 * Math.pow(1 + (config.settings?.socialSecurity?.cola || 0) / 100, Math.max(0, currentAge - ssStartAge));
        }

        // RMD Calculation
        let rmdIncome = 0;
        if (currentAge >= 73 && retirement > 0) {
            const divisors = { 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1, 80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2, 87: 14.4, 88: 13.7, 89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5, 95: 8.9, 96: 8.4, 97: 7.8, 98: 7.3, 99: 6.8, 100: 6.4 };
            let div = divisors[currentAge] || (currentAge > 100 ? 6.0 : 27.4);
            rmdIncome = retirement / div;
            retirement -= rmdIncome;
        }

        // Housing Events
        let proceeds = 0;
        if (config.settings?.housing?.sellHome === 'yes' && currentYear === config.settings.housing.sellYear) {
            proceeds = homeValue * (1 - (config.settings.housing.saleCosts || 0) / 100) - mortgage;
            investments += proceeds;
            homeValue = 0;
            mortgage = 0;
        }

        if (config.settings?.housing?.buyNewHome === 'yes' && currentYear === config.settings.housing.buyYear) {
            const upfront = (config.settings.housing.newHomeValue || 0) - (config.settings.housing.newMortgageAmount || 0);
            investments -= upfront;
            homeValue = config.settings.housing.newHomeValue || 0;
            mortgage = config.settings.housing.newMortgageAmount || 0;
        }

        // 2. Expense Calculations
        let multiplier = 1.0;
        const activePhase = (config.settings?.expenses?.phases || []).find(p => currentAge >= p.startAge && currentAge < p.endAge);
        if (activePhase) multiplier = activePhase.multiplier;

        let generalExp = (config.settings?.expenses?.annualSpending || 0) * multiplier * Math.pow(1 + inflationRate, yearIndex);

        let housingExp = 0;
        let annualMortgagePayment = 0;
        let activeMortgageRate = (config.settings?.housing?.mortgageRate || 0) / 100;

        if (homeValue > 0) {
            const h = config.settings?.housing || {};
            housingExp = ((h.propertyTax || 0) + (h.maintenance || 0) + (h.insurance || 0)) * Math.pow(1 + inflationRate, yearIndex);
            if (mortgage > 0) {
                if (currentYear >= (h.buyYear || 0) && h.buyNewHome === 'yes') {
                    activeMortgageRate = (h.newMortgageRate || 0) / 100;
                    const rate = activeMortgageRate / 12;
                    const n = (h.newMortgageYears || 30) * 12;
                    const p = (h.newMortgageAmount || 0);
                    if (p > 0 && rate > 0) {
                        const monthly = (p * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
                        annualMortgagePayment = monthly * 12;
                        housingExp += annualMortgagePayment;
                    }
                } else if (yearIndex < (h.mortgageYears || 0)) {
                    annualMortgagePayment = (h.mortgagePayment || 0) * 12;
                    housingExp += annualMortgagePayment;
                }
            }
        } else {
            const h = config.settings?.housing || {};
            housingExp = (h.futureRent || 0) * 12 * Math.pow(1 + (h.rentInflation || 3) / 100, Math.max(0, currentYear - (h.sellYear || 2030)));
        }

        let medicalExp = 0;
        if (currentAge < 65) medicalExp = config.settings?.healthcare?.preMedicare || 0;
        else medicalExp = (config.settings?.healthcare?.medicare || 0) + (config.settings?.healthcare?.outOfPocket || 0);
        medicalExp *= Math.pow(1 + (config.settings?.healthcare?.inflation || 0) / 100, yearIndex);

        let ltcExp = 0;
        if (currentAge >= (config.settings?.healthcare?.ltcAge || 999)) {
            ltcExp = (config.settings?.healthcare?.ltcCost || 0) * Math.pow(1 + (config.settings?.healthcare?.ltcInflation || 0) / 100, yearIndex);
        }

        let totalExpBeforeTax = generalExp + housingExp + medicalExp + ltcExp;
        if (config.events && Array.isArray(config.events)) {
            const yearEvents = config.events.filter(e => e.year === currentYear);
            for (const evt of yearEvents) {
                if (evt.type === 'expense') {
                    totalExpBeforeTax += (evt.amount || 0);
                    // Logger.debug(`Year ${currentYear}: Applied one-time expense event: ${evt.name} ($${evt.amount})`);
                } else if (evt.type === 'income') {
                    // Treat as ordinary income? or non-taxable?
                    // For now, let's treat simplistically as generic "otherAssets" inflow or handle in specific buckets needed.
                    // But simpler: just offset expenses to keep it clean, or add to 'otherOrdIncome'
                    // For typical "inheritance" etc, likely tax-free or specific.
                    // Let's assume generic tax-free inflow to investments for simplicity unless specified
                    investments += (evt.amount || 0);
                    // Logger.debug(`Year ${currentYear}: Applied one-time income event: ${evt.name} ($${evt.amount})`);
                }
            }
        }

        // 3. Tax Calculation
        const filingStatus = config.settings?.taxSettings?.filingStatus || 'single';
        const taxableSS = TaxCalculator.calculateTaxableSocialSecurity(rmdIncome + workIncome, ssIncome, filingStatus);
        const otherOrdIncome = rmdIncome + taxableSS;
        let estimatedCapGains = 0;
        let preTaxGap = Math.max(0, totalExpBeforeTax - (workIncome + ssIncome));
        if (preTaxGap > 0 && investments > 0) {
            const pullFromInvestments = Math.min(investments, preTaxGap);
            estimatedCapGains = pullFromInvestments * 0.5;
        }

        // Roth Conversion
        let rothConvToProcess = 0;
        const rothSettings = config.settings?.taxes || {};
        if (rothSettings.rothConversionEnabled && currentYear >= rothSettings.rothConvStart && currentYear <= rothSettings.rothConvEnd) {
            const ordinaryIncome = workIncome + otherOrdIncome;
            rothConvToProcess = RothCalculator.calculateYearlyConversion(
                currentYear,
                retirement,
                ordinaryIncome,
                config.settings?.taxSettings?.filingStatus || 'joint',
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
            rothConvToProcess = Math.max(0, Math.min(rothConvToProcess, retirement));
        }

        const taxBreakdown = TaxCalculator.calculateTaxBreakdown(
            workIncome,
            otherOrdIncome + rothConvToProcess,
            estimatedCapGains,
            config.settings?.taxSettings?.filingStatus || 'joint',
            config.settings?.taxSettings?.state || 'none'
        );

        let estimatedTax = taxBreakdown.total;

        // 4. Retirement Contributions
        if (workIncome > 0) {
            retirement += (config.settings?.income?.contribution401k || 0) + (config.settings?.income?.employerMatch || 0);
            roth += (config.settings?.income?.rothContrib || 0);
            hsa += (config.settings?.income?.hsaContrib || 0);
        }

        // 5. Growth
        retirement *= (1 + marketReturn);
        roth *= (1 + marketReturn);
        hsa *= (1 + marketReturn);
        investments *= (1 + marketReturn);
        homeValue *= (1 + (config.settings?.housing?.appreciation || 0) / 100);
        otherAssets *= (1 + inflationRate);

        // Mortgage Amortization
        if (mortgage > 0 && annualMortgagePayment > 0) {
            const annualInterest = mortgage * activeMortgageRate;
            const principalPayment = Math.max(0, annualMortgagePayment - annualInterest);
            if (!isNaN(principalPayment)) {
                mortgage = Math.max(0, mortgage - principalPayment);
            }
        }

        // 6. Drawdown Logic (Iterative to handle tax gross-ups)
        let yearlyDrawdownDetail = {
            Investments: 0, InvestmentsTax: 0,
            RetirementSavings: 0, RetirementSavingsTax: 0,
            RothIRA: 0, RothIRATax: 0,
            HSA: 0, HSATax: 0,
            CashSavings: 0, CashSavingsTax: 0
        };

        const strategy = config.settings?.taxes?.withdrawalStrategy || 'grow_tax_deferred';
        let currentDeficit = Math.max(0, totalExpBeforeTax + estimatedTax - (workIncome + ssIncome + rmdIncome));

        // Iterative loop to handle "tax on tax" from traditional retirement withdrawals
        let iterations = 0;

        while (currentDeficit > 0.1 && iterations < 20) {
            iterations++;
            let amountToFund = currentDeficit;

            // Determine drawdown loop order
            let order = [];
            if (currentAge < 59.5) {
                order = ['CashSavings', 'Investments', 'RothIRA', 'HSA', 'RetirementSavings'];
            } else {
                order = strategy === 'minimize_rmds'
                    ? ['CashSavings', 'RetirementSavings', 'Investments', 'HSA', 'RothIRA']
                    : ['CashSavings', 'Investments', 'RetirementSavings', 'HSA', 'RothIRA'];
            }

            // Proportional handling (Only for first iteration)
            if (iterations === 1 && strategy === 'proportional' && currentAge >= 59.5) {
                const totalLiquid = investments + retirement + roth;
                if (totalLiquid > 0) {
                    const invAmt = Math.min(investments, amountToFund * (investments / totalLiquid));
                    investments -= invAmt;
                    yearlyDrawdownDetail.Investments += invAmt;
                    amountToFund -= invAmt;

                    const retAmt = Math.min(retirement, amountToFund * (retirement / totalLiquid));
                    retirement -= retAmt;
                    yearlyDrawdownDetail.RetirementSavings += retAmt;
                    amountToFund -= retAmt;

                    const rothAmt = Math.min(roth, amountToFund * (roth / totalLiquid));
                    roth -= rothAmt;
                    yearlyDrawdownDetail.RothIRA += rothAmt;
                    amountToFund -= rothAmt;
                }
            }

            // Waterfall Drawdown
            for (let accountName of order) {
                if (amountToFund <= 0) break;

                if (accountName === 'Investments') {
                    const amount = Math.min(investments, amountToFund);
                    investments -= amount;
                    amountToFund -= amount;
                    yearlyDrawdownDetail.Investments += amount;
                } else if (accountName === 'RetirementSavings') {
                    const amount = Math.min(retirement, amountToFund);
                    retirement -= amount;
                    amountToFund -= amount;
                    yearlyDrawdownDetail.RetirementSavings += amount;
                } else if (accountName === 'RothIRA') {
                    const amount = Math.min(roth, amountToFund);
                    roth -= amount;
                    amountToFund -= amount;
                    yearlyDrawdownDetail.RothIRA += amount;
                } else if (accountName === 'HSA') {
                    const amount = Math.min(hsa, amountToFund);
                    hsa -= amount;
                    amountToFund -= amount;
                    yearlyDrawdownDetail.HSA += amount;
                } else if (accountName === 'CashSavings') {
                    const amount = Math.min(cash, amountToFund);
                    cash -= amount;
                    amountToFund -= amount;
                    yearlyDrawdownDetail.CashSavings += amount;
                }
            }

            // RE-CALCULATE TAXES based on new withdrawals
            const currentTaxableOrd = otherOrdIncome + rothConvToProcess + yearlyDrawdownDetail.RetirementSavings;
            const currentTaxableCG = estimatedCapGains + (yearlyDrawdownDetail.Investments * 0.5);
            let currentPenalty = (currentAge < 59.5 && yearlyDrawdownDetail.RetirementSavings > 0)
                ? yearlyDrawdownDetail.RetirementSavings * 0.10 : 0;

            const newTaxBreakdown = TaxCalculator.calculateTaxBreakdown(
                workIncome,
                currentTaxableOrd,
                currentTaxableCG,
                config.settings?.taxSettings?.filingStatus || 'joint',
                config.settings?.taxSettings?.state || 'none',
                currentPenalty
            );

            estimatedTax = newTaxBreakdown.total;
            Object.assign(taxBreakdown, newTaxBreakdown);

            // Re-calculate current deficit: (Requirements) - (Inflows + Drawdowns so far)
            const totalDrawdownSoFar = yearlyDrawdownDetail.Investments + yearlyDrawdownDetail.RetirementSavings +
                yearlyDrawdownDetail.RothIRA + yearlyDrawdownDetail.HSA + yearlyDrawdownDetail.CashSavings;
            const totalInflowSoFar = workIncome + ssIncome + rmdIncome + totalDrawdownSoFar;
            const totalRequirements = totalExpBeforeTax + estimatedTax;

            currentDeficit = Math.max(0, totalRequirements - totalInflowSoFar);
        }

        // Final surplus logic if netFlow was positive
        let netFlow = workIncome + ssIncome + rmdIncome - totalExpBeforeTax - estimatedTax;
        if (currentYear === 2026) {
            // console.log(`[DEBUG] Year ${currentYear}: Work=${workIncome}, SS=${ssIncome}, RMD=${rmdIncome}, Exp=${totalExpBeforeTax}, Tax=${estimatedTax}, netFlow=${netFlow}`);
        }
        if (netFlow > 0) {
            investments += netFlow;
        }

        // Assign marginal taxes for detail display
        yearlyDrawdownDetail.RetirementSavingsTax = Math.round(yearlyDrawdownDetail.RetirementSavings * 0.22);
        yearlyDrawdownDetail.InvestmentsTax = Math.round(yearlyDrawdownDetail.Investments * 0.15);

        // Process Roth Conversion (already factored into taxes above via rothConvToProcess)
        let actualConversion = 0;
        let conversionTax = 0;
        if (rothConvToProcess > 0 && retirement >= rothConvToProcess) {
            retirement -= rothConvToProcess;
            roth += rothConvToProcess;
            actualConversion = rothConvToProcess;

            // Use the already calculated marginal values for detail if needed, 
            // but the total tax is already correct in estimatedTax.
            conversionTax = 0; // Simplified tracking for walkthrough
        }

        // Build year results
        const yearResults = {
            year: currentYear,
            age: currentAge,
            accounts: {
                RetirementSavings: Math.round(retirement),
                RothIRA: Math.round(roth),
                HSA: Math.round(hsa),
                Investments: Math.round(investments),
                CashSavings: Math.round(cash),
                Housing: Math.round(Math.max(0, homeValue - mortgage)),
                OtherAssets: Math.round(otherAssets),
                Debt: homeValue > 0 ? Math.round(-mortgage) : 0
            },
            income: {
                Work: Math.round(workIncome),
                SocialSecurity: Math.round(ssIncome),
                RMD: Math.round(rmdIncome),
                Drawdown: netFlow < 0 ? Math.round(Math.abs(netFlow)) : 0,
                HomeSale: Math.round(proceeds)
            },
            expenses: {
                General: Math.round(generalExp),
                Taxes: Math.round(estimatedTax),
                Housing: Math.round(housingExp),
                Medical: Math.round(medicalExp),
                LTC: Math.round(ltcExp)
            },
            taxes: {
                Federal: taxBreakdown.federalOrd,
                FICA: taxBreakdown.fica,
                CapGains: taxBreakdown.federalCG,
                State: taxBreakdown.state,
                Penalty: taxBreakdown.penalty || 0
            },
            drawdown: {
                Investments: Math.round(yearlyDrawdownDetail.Investments),
                InvestmentsTax: Math.round(yearlyDrawdownDetail.InvestmentsTax),
                RetirementSavings: Math.round(yearlyDrawdownDetail.RetirementSavings),
                RetirementSavingsTax: Math.round(yearlyDrawdownDetail.RetirementSavingsTax),
                RothIRA: Math.round(yearlyDrawdownDetail.RothIRA),
                RothIRATax: Math.round(yearlyDrawdownDetail.RothIRATax),
                HSA: Math.round(yearlyDrawdownDetail.HSA),
                HSATax: Math.round(yearlyDrawdownDetail.HSATax),
                CashSavings: Math.round(yearlyDrawdownDetail.CashSavings),
                CashSavingsTax: Math.round(yearlyDrawdownDetail.CashSavingsTax)
            },
            rothConversion: {
                amount: actualConversion,
                taxPaid: conversionTax
            },
            netWorth: Math.round(retirement + roth + hsa + investments + cash + (homeValue - mortgage) + otherAssets)
        };

        const newState = {
            retirement,
            roth,
            hsa,
            investments,
            cash,
            mortgage,
            homeValue,
            otherAssets
        };

        return { newState, yearResults };
    }

    static project(config, scenario) {
        const years = config.endYear - config.startYear + 1;
        const results = this._initializeResults(years);
        let state = this._initializeState(config);

        // Standardize fallback logic: Scenario -> Average -> Default
        const marketReturn = (config.settings?.rates?.[scenario] ?? config.settings?.rates?.average ?? 7.0) / 100;
        const inflationRate = (config.settings?.inflation?.[scenario] ?? config.settings?.inflation?.average ?? 2.5) / 100;

        for (let i = 0; i < years; i++) {
            const currentYear = config.startYear + i;
            const currentAge = config.startAge + i;

            const { newState, yearResults } = this._processYear(
                state,
                config,
                currentYear,
                currentAge,
                i,
                marketReturn,
                inflationRate
            );

            state = newState;
            this._appendResults(results, yearResults, i);
        }

        return results;
    }



    /**
     * Project a single Monte Carlo path with variable market returns
     * This now uses the complete project() engine with variable returns
     * 
     * @param {Object} config - Configuration object
     * @param {number} volatility - Market volatility (standard deviation)
     * @param {number} spendMultiplier - Spending adjustment multiplier
     * @param {string} marketScenario - 'monte-carlo', 'historical-bootstrap', '1970s', 'dotcom', 'gfc', 'depression'
     * @param {SeededRandom} rng - Optional seeded random number generator (for reproducibility)
     * @returns {Array} Net worth for each year
     */
    static projectPath(config, volatility = 0.15, spendMultiplier = 1.0, marketScenario = 'monte-carlo', rng = null) {
        const years = config.endYear - config.startYear + 1;

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

        // Create RNG if not provided
        if (!rng) {
            rng = new SeededRandom();
        }

        if (marketScenario === 'historical-bootstrap') {
            startIndex = Math.floor(rng.next() * (historicalReturns.length - years));
        } else if (marketScenario.startsWith('last-')) {
            const lookback = parseInt(marketScenario.split('-')[1]);
            startIndex = Math.max(0, historicalReturns.length - lookback);
        } else if (scenarios[marketScenario]) {
            startIndex = scenarios[marketScenario];
        }

        // Generate return sequence for all years
        const returnSequence = [];
        for (let i = 0; i < years; i++) {
            let r;
            if (marketScenario === 'monte-carlo') {
                // Use Gaussian random from seeded RNG
                r = rng.nextGaussian(baseRate, volatility);
            } else {
                // Historical sequence
                const histIdx = (startIndex + i) % historicalReturns.length;
                r = historicalReturns[histIdx];
            }
            returnSequence.push(r * 100); // Convert to percentage for config
        }

        // Create a modified config with variable returns and spending multiplier
        const mcConfig = JSON.parse(JSON.stringify(config));

        // Apply spending multiplier
        if (mcConfig.settings?.expenses?.annualSpending) {
            mcConfig.settings.expenses.annualSpending *= spendMultiplier;
        }

        // Override rates with our sequence
        // We'll use the 'average' scenario but inject variable returns
        const scenario = 'average';

        // Run the FULL projection engine with variable returns
        // We need to modify project() to accept a return sequence
        const results = this._projectWithVariableReturns(mcConfig, scenario, returnSequence);

        return results.netWorth;
    }

    static _projectWithVariableReturns(config, scenario, returnSequence) {
        const years = config.endYear - config.startYear + 1;
        const results = this._initializeResults(years);
        let state = this._initializeState(config);

        const inflationRate = (config.settings?.inflation?.[scenario] ?? config.settings?.inflation?.average ?? 2.5) / 100;

        for (let i = 0; i < years; i++) {
            const currentYear = config.startYear + i;
            const currentAge = config.startAge + i;

            const marketReturn = returnSequence && returnSequence[i] !== undefined
                ? returnSequence[i] / 100
                : (config.settings?.rates?.[scenario] ?? config.settings?.rates?.average ?? 7.0) / 100;

            const { newState, yearResults } = this._processYear(
                state,
                config,
                currentYear,
                currentAge,
                i,
                marketReturn,
                inflationRate
            );

            state = newState;
            this._appendResults(results, yearResults, i);
        }

        return results;
    }

    /**
     * Run Monte Carlo simulation with multiple iterations
     * @param {number} iterations - Number of Monte Carlo iterations
     * @param {number} volatility - Market volatility (standard deviation)
     * @param {number} spendMultiplier - Spending adjustment multiplier
     * @param {string} marketScenario - Market scenario to simulate
     * @param {number} seed - Optional seed for reproducible results (null = random)
     * @returns {Object} Percentile results (p10, p25, p50, p75, p90, successRate, legacyRate)
     */
    static runMonteCarlo(iterations = 1000, volatility = 0.15, spendMultiplier = 1.0, marketScenario = 'monte-carlo', seed = null) {
        // Create seeded RNG if seed provided, otherwise use random seed
        const masterRng = seed !== null ? new SeededRandom(seed) : new SeededRandom();

        const runs = [];
        for (let i = 0; i < iterations; i++) {
            // Create a new RNG for each iteration with a derived seed
            // This ensures each iteration is different but reproducible
            const iterationSeed = Math.floor(masterRng.next() * 0xFFFFFFFF);
            const iterationRng = new SeededRandom(iterationSeed);

            runs.push(this.projectPath(config, volatility, spendMultiplier, marketScenario, iterationRng));
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
