/**
 * Roth Conversion Calculator
 * Handles all Roth conversion calculations and optimization
 */

import RothConfig, { calculateBracketAmount, validateConversionAmount } from './RothConfig.js';

export class RothCalculator {
    /**
     * Calculate optimal conversion amount for a given year
     */
    static calculateYearlyConversion(year, retirementBalance, ordinaryIncome, filingStatus = 'joint') {
        if (!RothConfig.enabled) return 0;
        if (year < RothConfig.startYear || year > RothConfig.endYear) return 0;
        if (retirementBalance <= 0) return 0;

        let amount = 0;

        switch (RothConfig.mode) {
            case 'bracket':
                amount = calculateBracketAmount(RothConfig.targetBracket, filingStatus, ordinaryIncome);
                break;

            case 'hybrid':
                const bracketAmount = calculateBracketAmount(RothConfig.targetBracket, filingStatus, ordinaryIncome);
                amount = Math.min(bracketAmount, RothConfig.maxAnnualCap || Infinity);
                break;

            case 'manual':
            default:
                amount = RothConfig.manualAmount;
                break;
        }

        return validateConversionAmount(amount, retirementBalance);
    }

    /**
     * Calculate total conversions over lifetime
     */
    static calculateLifetimeConversions(startYear, endYear, yearlyAmounts) {
        let total = 0;
        let years = 0;

        for (let year = startYear; year <= endYear; year++) {
            const amount = yearlyAmounts[year - startYear] || 0;
            if (amount > 0) {
                total += amount;
                years++;
            }
        }

        return { total, years };
    }

    /**
     * Calculate tax impact of conversion
     */
    static calculateTaxImpact(conversionAmount, ordinaryIncome, filingStatus = 'joint') {
        // Simplified marginal tax calculation
        const totalIncome = ordinaryIncome + conversionAmount;

        // 2025 tax brackets (simplified)
        const brackets = [
            { limit: filingStatus === 'joint' ? 23200 : 11600, rate: 0.10 },
            { limit: filingStatus === 'joint' ? 94300 : 47150, rate: 0.12 },
            { limit: filingStatus === 'joint' ? 201050 : 100525, rate: 0.22 },
            { limit: filingStatus === 'joint' ? 383900 : 191950, rate: 0.24 },
            { limit: filingStatus === 'joint' ? 487450 : 243725, rate: 0.32 },
            { limit: filingStatus === 'joint' ? 731200 : 609350, rate: 0.35 },
            { limit: Infinity, rate: 0.37 }
        ];

        let tax = 0;
        let remaining = totalIncome;
        let prevLimit = 0;

        for (const bracket of brackets) {
            const taxableInBracket = Math.min(remaining, bracket.limit - prevLimit);
            if (taxableInBracket <= 0) break;

            tax += taxableInBracket * bracket.rate;
            remaining -= taxableInBracket;
            prevLimit = bracket.limit;
        }

        return Math.round(tax);
    }

    /**
     * Calculate effective tax rate
     */
    static calculateEffectiveRate(totalTax, totalIncome) {
        if (totalIncome === 0) return 0;
        return (totalTax / totalIncome) * 100;
    }

    /**
     * Optimize conversion strategy
     */
    static optimizeStrategy(years, incomes, retirementBalances, targetRate = 15) {
        const optimized = [];

        for (let i = 0; i < years.length; i++) {
            const year = years[i];
            const income = incomes[i];
            const balance = retirementBalances[i];

            // Binary search for optimal amount
            let low = 0;
            let high = balance;
            let bestAmount = 0;

            while (low <= high) {
                const mid = Math.floor((low + high) / 2);
                const tax = this.calculateTaxImpact(mid, income);
                const effectiveRate = this.calculateEffectiveRate(tax, income + mid);

                if (Math.abs(effectiveRate - targetRate) < 0.5) {
                    bestAmount = mid;
                    break;
                } else if (effectiveRate < targetRate) {
                    bestAmount = mid;
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }
            }

            optimized.push({
                year,
                amount: bestAmount,
                income,
                balance
            });
        }

        return optimized;
    }

    /**
     * Calculate legacy impact (tax-free growth)
     */
    static calculateLegacyImpact(convertedAmount, yearsToGrow, annualReturn = 0.06) {
        return convertedAmount * Math.pow(1 + annualReturn, yearsToGrow);
    }
}

export default RothCalculator;
