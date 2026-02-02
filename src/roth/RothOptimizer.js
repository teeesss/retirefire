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
     * Now includes account source tracking
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

        // NEW: Determine account sources for conversion
        // Priority: Traditional IRA/401k first (tax-deferred → tax-free is optimal)
        // If insufficient, pull from taxable investments
        const availableRetirement = params.retirementBalance || balance; // Traditional 401k/IRA
        const availableInvestments = params.investmentsBalance || 0;     // Taxable brokerage

        let fromRetirement = 0;
        let fromInvestments = 0;

        if (conversionAmount > 0) {
            // Try to fund entirely from retirement accounts first
            fromRetirement = Math.min(conversionAmount, availableRetirement);

            // If retirement accounts insufficient, pull remainder from taxable
            const remaining = conversionAmount - fromRetirement;
            if (remaining > 0) {
                fromInvestments = Math.min(remaining, availableInvestments);
            }

            // Adjust conversion amount if insufficient funds
            conversionAmount = fromRetirement + fromInvestments;
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
            // NEW: Account source breakdown
            sources: {
                retirement: Math.round(fromRetirement),
                investments: Math.round(fromInvestments)
            },
            income,
            totalIncome,
            currentBracket,
            targetBracket,
            marginalRate,
            effectiveRate,
            taxOnConversion: Math.round(taxOnConversion),
            remainingBalance: balance - conversionAmount,
            bracketUtilization: roomInBracket > 0 ? (conversionAmount / roomInBracket) * 100 : 0,
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
     * Get upper limit of target bracket (2025 tax brackets)
     */
    static getBracketLimit(bracket, filingStatus) {
        const limits = {
            10: { single: 11925, joint: 23850, hoh: 17000 },
            12: { single: 48475, joint: 96950, hoh: 64850 },
            22: { single: 103350, joint: 206700, hoh: 103350 },
            24: { single: 197300, joint: 394600, hoh: 197300 },
            32: { single: 250525, joint: 501050, hoh: 250525 },
            35: { single: 626350, joint: 751600, hoh: 626350 },
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

    /**
     * Compare multiple conversion strategies with different annual amounts
     * Uses dynamic range detection and $10k increments
     * 
     * @param {Object} params - Base parameters (same as optimize)
     * @param {Object} options - Comparison options
     * @param {number} options.minAmount - Minimum conversion amount (default: auto-detect)
     * @param {number} options.maxAmount - Maximum conversion amount (default: auto-detect)
     * @param {number} options.increment - Increment between amounts (default: 10000)
     * @returns {Object} Comparison results with scores and recommendations
     */
    static compareStrategies(params, options = {}) {
        const {
            years,
            ordinaryIncome,
            traditionalBalance,
            filingStatus = 'joint',
            targetBracket = 24,
            constraints = {}
        } = params;

        // Dynamic range detection (Option C)
        const avgIncome = ordinaryIncome.reduce((sum, inc) => sum + inc, 0) / ordinaryIncome.length;
        const avgBalance = traditionalBalance.reduce((sum, bal) => sum + bal, 0) / traditionalBalance.length;

        // Calculate bracket room for typical year
        const bracketLimit = this.getBracketLimit(targetBracket, filingStatus);
        const typicalRoom = Math.max(0, bracketLimit - avgIncome);

        // Auto-detect range if not provided
        const increment = options.increment || 10000;
        const minAmount = options.minAmount || Math.max(10000, Math.floor(typicalRoom * 0.1 / increment) * increment);
        const maxAmount = options.maxAmount || Math.min(
            Math.ceil(typicalRoom * 1.5 / increment) * increment,
            Math.ceil(avgBalance * 0.15 / increment) * increment, // Don't exceed 15% of balance per year
            250000 // Absolute cap
        );

        // Generate amounts array with $10k increments
        const amounts = [];
        for (let amt = minAmount; amt <= maxAmount; amt += increment) {
            amounts.push(amt);
        }

        console.log(`🔬 Comparing ${amounts.length} strategies from ${this.formatCurrency(minAmount)} to ${this.formatCurrency(maxAmount)}`);

        // Run optimization for each amount
        const strategies = amounts.map(amount => {
            // Create modified constraints with fixed annual amount
            const modifiedConstraints = {
                ...constraints,
                maxAnnual: amount
            };

            // Run optimization
            const result = this.optimize({
                years,
                ordinaryIncome,
                traditionalBalance,
                filingStatus,
                targetBracket,
                constraints: modifiedConstraints
            });

            return {
                amount,
                ...result.summary,
                results: result.results // Keep year-by-year for drill-down
            };
        });

        // Calculate scores for each strategy
        const scoredStrategies = this.scoreStrategies(strategies);

        // Find optimal strategy
        const optimal = scoredStrategies.reduce((best, curr) =>
            curr.score > best.score ? curr : best
        );

        return {
            strategies: scoredStrategies,
            optimal,
            range: { min: minAmount, max: maxAmount, increment },
            metadata: {
                avgIncome,
                avgBalance,
                bracketRoom: typicalRoom,
                strategiesCompared: amounts.length
            }
        };
    }

    /**
     * Score strategies based on multiple factors
     * Higher score = better strategy
     */
    static scoreStrategies(strategies) {
        // Find min/max for normalization
        const netWorths = strategies.map(s => s.finalNetWorth || 0);
        const taxes = strategies.map(s => s.totalTaxPaid || 0);
        const breakEvens = strategies.map(s => s.breakEvenAge || 999);
        const rothBalances = strategies.map(s => s.finalRothBalance || 0);

        const maxNW = Math.max(...netWorths);
        const minNW = Math.min(...netWorths);
        const maxTax = Math.max(...taxes);
        const minTax = Math.min(...taxes);
        const maxBreakEven = Math.max(...breakEvens.filter(b => b < 999));
        const minBreakEven = Math.min(...breakEvens.filter(b => b < 999));
        const maxRoth = Math.max(...rothBalances);
        const minRoth = Math.min(...rothBalances);

        return strategies.map(strategy => {
            const nw = strategy.finalNetWorth || 0;
            const tax = strategy.totalTaxPaid || 0;
            const breakEven = strategy.breakEvenAge || 999;
            const roth = strategy.finalRothBalance || 0;

            // Normalize to 0-1 scale
            const normalizedNW = maxNW > minNW ? (nw - minNW) / (maxNW - minNW) : 0.5;
            const normalizedTax = maxTax > minTax ? 1 - ((tax - minTax) / (maxTax - minTax)) : 0.5; // Lower tax is better
            const normalizedBreakEven = maxBreakEven > minBreakEven && breakEven < 999
                ? 1 - ((breakEven - minBreakEven) / (maxBreakEven - minBreakEven))
                : 0.5; // Earlier break-even is better
            const normalizedRoth = maxRoth > minRoth ? (roth - minRoth) / (maxRoth - minRoth) : 0.5;

            // Weighted score (out of 100)
            const score = Math.round(
                (0.40 * normalizedNW +       // 40% weight: Final wealth
                    0.30 * normalizedTax +      // 30% weight: Tax efficiency
                    0.20 * normalizedBreakEven + // 20% weight: Break-even speed
                    0.10 * normalizedRoth)      // 10% weight: Tax-free legacy
                * 100
            );

            return {
                ...strategy,
                score,
                indicators: {
                    isHighestNW: nw === maxNW,
                    isLowestTax: tax === minTax,
                    isFastestBreakEven: breakEven === minBreakEven && breakEven < 999,
                    breakEvenColor: breakEven < 999
                        ? (breakEven - (strategy.startAge || 53) < 20 ? 'green' :
                            breakEven - (strategy.startAge || 53) < 30 ? 'yellow' : 'red')
                        : 'red'
                }
            };
        }).sort((a, b) => b.score - a.score); // Sort by score descending
    }

}

export default RothOptimizer;
