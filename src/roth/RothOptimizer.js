/**
 * Advanced Roth Conversion Optimizer
 * 
 * Finds the optimal Roth conversion strategy by:
 * - Analyzing tax brackets across multiple years
 * - Considering future RMDs and Social Security income
 * - Maximizing conversions while minimizing lifetime tax burden
 * - Providing detailed tax impact analysis
 */

import RothConfig from './RothConfig.js';

export class RothOptimizer {
    /**
     * Optimize Roth conversion strategy across all years
     * 
     * @param {Object} params - Optimization parameters
     * @param {Array} params.years - Array of years to optimize
     * @param {Array} params.ordinaryIncome - Ordinary income per year
     * @param {Array} params.traditionalBalance - Traditional IRA/401k balance per year
     * @param {string} params.filingStatus - 'single' or 'joint'
     * @param {number} params.targetBracket - Target marginal tax bracket (12, 22, 24, etc.)
     * @param {Object} params.constraints - Optional constraints
     * @returns {Object} Optimized conversion strategy
     */
    static optimize(params) {
        const {
            years,
            ordinaryIncome,
            traditionalBalance,
            filingStatus = 'joint',
            targetBracket = 24,
            constraints = {}
        } = params;

        // Validate and normalize target bracket
        const validatedBracket = this.validateBracket(targetBracket);

        const results = [];
        let totalConverted = 0;
        let totalTaxPaid = 0;
        let yearsWithConversions = 0;

        for (let i = 0; i < years.length; i++) {
            const year = years[i];
            const income = ordinaryIncome[i] || 0;
            const balance = traditionalBalance[i] || 0;

            // Skip if no balance or outside conversion window
            if (balance <= 0 || year < RothConfig.startYear || year > RothConfig.endYear) {
                results.push({
                    year,
                    conversionAmount: 0,
                    income,
                    totalIncome: income,
                    marginalRate: this.getMarginalRate(income, filingStatus),
                    effectiveRate: this.getEffectiveRate(income, filingStatus),
                    taxOnConversion: 0,
                    remainingBalance: balance
                });
                continue;
            }

            // Calculate optimal conversion amount
            const optimal = this.findOptimalConversion({
                year,
                income,
                balance,
                filingStatus,
                targetBracket: validatedBracket,
                constraints
            });

            totalConverted += optimal.conversionAmount;
            totalTaxPaid += optimal.taxOnConversion;
            if (optimal.conversionAmount > 0) yearsWithConversions++;

            results.push(optimal);
        }

        return {
            results,
            summary: {
                totalConverted,
                totalTaxPaid,
                yearsWithConversions,
                averageAnnualConversion: yearsWithConversions > 0 ? totalConverted / yearsWithConversions : 0,
                effectiveTaxRate: totalConverted > 0 ? (totalTaxPaid / totalConverted) * 100 : 0
            }
        };
    }

    /**
     * Find optimal conversion amount for a single year
     */
    static findOptimalConversion(params) {
        const { year, income, balance, filingStatus, targetBracket, constraints } = params;

        // Get bracket limits
        const bracketLimit = this.getBracketLimit(targetBracket, filingStatus);
        const currentBracket = this.getCurrentBracket(income, filingStatus);

        // Calculate room in target bracket
        let roomInBracket = Math.max(0, bracketLimit - income);

        // Apply constraints
        if (constraints.maxAnnual) {
            roomInBracket = Math.min(roomInBracket, constraints.maxAnnual);
        }
        if (constraints.minAnnual && roomInBracket < constraints.minAnnual) {
            roomInBracket = 0; // Don't convert if below minimum
        }

        // Don't exceed available balance
        let conversionAmount = Math.min(roomInBracket, balance);

        // Apply Manual Overrides if present
        if (RothConfig.manualOverrides && RothConfig.manualOverrides[year] !== undefined) {
            conversionAmount = Math.min(RothConfig.manualOverrides[year], balance);
        }

        // Calculate tax impact
        const totalIncome = income + conversionAmount;
        const taxOnConversion = this.calculateTaxOnConversion(income, conversionAmount, filingStatus);
        const marginalRate = this.getMarginalRate(totalIncome, filingStatus);
        const effectiveRate = this.getEffectiveRate(totalIncome, filingStatus);

        // Advanced metrics: Net amount reaching the Roth bucket
        const payTaxesFrom = constraints.payTaxesFrom || 'brokerage';
        const netToRoth = payTaxesFrom === 'traditional' ? conversionAmount - taxOnConversion : conversionAmount;

        return {
            year,
            conversionAmount: Math.round(conversionAmount),
            netToRoth: Math.round(netToRoth),
            income,
            totalIncome,
            currentBracket,
            targetBracket,
            marginalRate,
            effectiveRate,
            taxOnConversion: Math.round(taxOnConversion),
            remainingBalance: balance - conversionAmount,
            bracketUtilization: (conversionAmount / roomInBracket) * 100,
            taxPaymentSource: payTaxesFrom
        };
    }

    /**
     * Calculate tax specifically on the conversion amount
     */
    static calculateTaxOnConversion(baseIncome, conversionAmount, filingStatus) {
        const taxWithConversion = this.calculateTotalTax(baseIncome + conversionAmount, filingStatus);
        const taxWithoutConversion = this.calculateTotalTax(baseIncome, filingStatus);
        return taxWithConversion - taxWithoutConversion;
    }

    /**
     * Calculate total federal income tax
     */
    static calculateTotalTax(income, filingStatus) {
        const brackets = this.getTaxBrackets(filingStatus);
        let tax = 0;
        let previousLimit = 0;

        for (const bracket of brackets) {
            const taxableInBracket = Math.min(
                Math.max(0, income - previousLimit),
                bracket.limit - previousLimit
            );

            if (taxableInBracket <= 0) break;

            tax += taxableInBracket * bracket.rate;
            previousLimit = bracket.limit;

            if (income <= bracket.limit) break;
        }

        return tax;
    }

    /**
     * Get marginal tax rate for given income
     */
    static getMarginalRate(income, filingStatus) {
        const brackets = this.getTaxBrackets(filingStatus);

        for (const bracket of brackets) {
            if (income <= bracket.limit) {
                return bracket.rate * 100;
            }
        }

        return brackets[brackets.length - 1].rate * 100;
    }

    /**
     * Get effective tax rate
     */
    static getEffectiveRate(income, filingStatus) {
        if (income === 0) return 0;
        const totalTax = this.calculateTotalTax(income, filingStatus);
        return (totalTax / income) * 100;
    }

    /**
     * Get current tax bracket
     */
    static getCurrentBracket(income, filingStatus) {
        return Math.round(this.getMarginalRate(income, filingStatus));
    }

    /**
     * Get upper limit of target bracket
     */
    static getBracketLimit(bracket, filingStatus) {
        const limits = {
            10: { single: 11600, joint: 23200, hoh: 16550 },
            12: { single: 47150, joint: 94300, hoh: 63100 },
            22: { single: 100525, joint: 201050, hoh: 100500 },
            24: { single: 191950, joint: 383900, hoh: 191950 },
            32: { single: 243725, joint: 487450, hoh: 243725 },
            35: { single: 609350, joint: 731200, hoh: 609350 },
            37: { single: Infinity, joint: Infinity, hoh: Infinity }
        };

        return limits[bracket]?.[filingStatus] || 0;
    }

    /**
     * Get tax brackets for filing status (2025)
     */
    static getTaxBrackets(filingStatus) {
        const brackets = {
            single: [
                { limit: 11600, rate: 0.10 },
                { limit: 47150, rate: 0.12 },
                { limit: 100525, rate: 0.22 },
                { limit: 191950, rate: 0.24 },
                { limit: 243725, rate: 0.32 },
                { limit: 609350, rate: 0.35 },
                { limit: Infinity, rate: 0.37 }
            ],
            joint: [
                { limit: 23200, rate: 0.10 },
                { limit: 94300, rate: 0.12 },
                { limit: 201050, rate: 0.22 },
                { limit: 383900, rate: 0.24 },
                { limit: 487450, rate: 0.32 },
                { limit: 731200, rate: 0.35 },
                { limit: Infinity, rate: 0.37 }
            ],
            hoh: [
                { limit: 16550, rate: 0.10 },
                { limit: 63100, rate: 0.12 },
                { limit: 100500, rate: 0.22 },
                { limit: 191950, rate: 0.24 },
                { limit: 243700, rate: 0.32 },
                { limit: 609350, rate: 0.35 },
                { limit: Infinity, rate: 0.37 }
            ]
        };

        return brackets[filingStatus] || brackets.joint;
    }

    /**
     * Validate and normalize tax bracket input
     */
    static validateBracket(inputBracket) {
        // defined keys in getBracketLimit are integers: 10, 12, 22, 24, 32, 35, 37
        const validBrackets = [10, 12, 22, 24, 32, 35, 37];

        // Handle percentage inputs (e.g. 0.22 -> 22)
        let bracket = Number(inputBracket);
        if (bracket < 1 && bracket > 0) {
            bracket = Math.round(bracket * 100);
        }

        // If valid, return it
        if (validBrackets.includes(bracket)) {
            return bracket;
        }

        // Find nearest valid bracket
        return validBrackets.reduce((prev, curr) => {
            return (Math.abs(curr - bracket) < Math.abs(prev - bracket) ? curr : prev);
        });
    }

    /**
     * Compare manual strategy vs optimized strategy
     */
    static compareStrategies(manualResults, optimizedResults) {
        const manualTotal = manualResults.summary.totalConverted;
        const optimizedTotal = optimizedResults.summary.totalConverted;
        const manualTax = manualResults.summary.totalTaxPaid;
        const optimizedTax = optimizedResults.summary.totalTaxPaid;

        return {
            conversionDifference: optimizedTotal - manualTotal,
            taxSavings: manualTax - optimizedTax,
            efficiencyGain: ((optimizedTotal - manualTotal) / manualTotal) * 100,
            taxEfficiencyGain: ((manualTax - optimizedTax) / manualTax) * 100,
            recommendation: optimizedTotal > manualTotal ? 'optimized' : 'manual'
        };
    }

    /**
     * Calculate future value of Roth conversions
     */
    static calculateFutureValue(convertedAmount, yearsToGrow, annualReturn = 0.06) {
        return convertedAmount * Math.pow(1 + annualReturn, yearsToGrow);
    }

    /**
     * Calculate tax-free legacy benefit
     */
    static calculateLegacyBenefit(optimizedResults, currentAge, lifeExpectancy, annualReturn = 0.06) {
        let totalBenefit = 0;
        const currentYear = new Date().getFullYear();

        for (const result of optimizedResults.results) {
            if (result.conversionAmount > 0) {
                // Calculate age at conversion
                const yearsFromNow = result.year - currentYear;
                const ageAtConversion = currentAge + yearsFromNow;

                // Years from conversion to end of life
                const yearsToGrow = lifeExpectancy - ageAtConversion;

                if (yearsToGrow > 0) {
                    const futureValue = this.calculateFutureValue(
                        result.conversionAmount,
                        yearsToGrow,
                        annualReturn
                    );
                    totalBenefit += futureValue - result.conversionAmount;
                }
            }
        }

        return totalBenefit;
    }

    /**
     * Generate optimization report
     */
    static generateReport(optimizedResults, comparison) {
        const { summary } = optimizedResults;

        return {
            headline: `Convert $${(summary.totalConverted / 1000).toFixed(0)}K over ${summary.yearsWithConversions} years`,
            metrics: {
                totalConverted: summary.totalConverted,
                totalTaxPaid: summary.totalTaxPaid,
                effectiveTaxRate: summary.effectiveTaxRate.toFixed(2),
                averageAnnual: summary.averageAnnualConversion,
                yearsActive: summary.yearsWithConversions
            },
            comparison: comparison ? {
                taxSavings: comparison.taxSavings,
                conversionIncrease: comparison.conversionDifference,
                recommendation: comparison.recommendation
            } : null,
            yearByYear: optimizedResults.results.filter(r => r.conversionAmount > 0)
        };
    }
}

export default RothOptimizer;
