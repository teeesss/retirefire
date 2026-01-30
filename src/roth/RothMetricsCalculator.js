/**
 * Roth Conversion Metrics Calculator
 * Calculates comprehensive metrics from simulation results
 */

import RothConfig from './RothConfig.js';

export class RothMetricsCalculator {
    /**
     * Calculate comprehensive Roth conversion metrics
     * @param {Object} rothData - Simulation results WITH Roth conversions
     * @param {Object} baselineData - Simulation results WITHOUT Roth conversions
     * @param {Object} config - Configuration object
     * @returns {Object} Metrics object
     */
    static calculateMetrics(rothData, baselineData, config) {
        if (!rothData || !baselineData) {
            console.warn('RothMetricsCalculator: Missing data');
            return this.getEmptyMetrics();
        }

        // Calculate total converted from rothConversions tracking
        const conversions = rothData.rothConversions || { amounts: [], taxPaid: [], cumulativeConverted: [] };
        const totalConverted = conversions.amounts.reduce((sum, amt) => sum + amt, 0);
        const conversionYears = conversions.amounts.filter(amt => amt > 0).length;
        const totalConversionTax = conversions.taxPaid.reduce((sum, tax) => sum + tax, 0);

        // Calculate lifetime tax comparison
        const baselineTotalTax = baselineData.expenses?.Taxes?.reduce((sum, tax) => sum + tax, 0) || 0;
        const rothTotalTax = rothData.expenses?.Taxes?.reduce((sum, tax) => sum + tax, 0) || 0;

        // Tax savings is baseline minus roth (negative means we paid more with Roth, which is expected during conversion years)
        // But over lifetime, we should save due to tax-free growth
        const taxDifference = baselineTotalTax - rothTotalTax;

        // Calculate net worth boost (final year comparison)
        const baselineFinalNW = baselineData.netWorth?.[baselineData.netWorth.length - 1] || 0;
        const rothFinalNW = rothData.netWorth?.[rothData.netWorth.length - 1] || 0;
        const nwBoost = rothFinalNW - baselineFinalNW;

        // Calculate average annual conversion
        const avgAnnualConversion = conversionYears > 0 ? totalConverted / conversionYears : 0;

        // Calculate Roth IRA growth benefit
        const baselineRothBalance = baselineData.accounts?.RothIRA?.[baselineData.accounts.RothIRA.length - 1] || 0;
        const finalRothBalance = rothData.accounts?.RothIRA?.[rothData.accounts.RothIRA.length - 1] || 0;
        const rothGrowthBenefit = finalRothBalance - baselineRothBalance;

        return {
            totalConverted: Math.round(totalConverted),
            conversionYears,
            totalConversionTax: Math.round(totalConversionTax),
            taxDifference: Math.round(taxDifference),
            nwBoost: Math.round(nwBoost),
            avgAnnualConversion: Math.round(avgAnnualConversion),
            rothGrowthBenefit: Math.round(rothGrowthBenefit),
            baselineFinalNW: Math.round(baselineFinalNW),
            rothFinalNW: Math.round(rothFinalNW)
        };
    }

    /**
     * Get yearly conversion amounts from simulation results
     * @param {Object} rothData - Simulation results
     * @returns {Array} Array of conversion amounts by year
     */
    static getYearlyConversions(rothData) {
        if (!rothData || !rothData.rothConversions) {
            return [];
        }
        return rothData.rothConversions.amounts || [];
    }

    /**
     * Get cumulative conversions over time
     * @param {Object} rothData - Simulation results
     * @returns {Array} Array of cumulative conversion amounts
     */
    static getCumulativeConversions(rothData) {
        if (!rothData || !rothData.rothConversions) {
            return [];
        }
        return rothData.rothConversions.cumulativeConverted || [];
    }

    /**
     * Calculate conversion efficiency (NW boost per dollar converted)
     * @param {Object} metrics - Metrics from calculateMetrics
     * @returns {number} Efficiency ratio
     */
    static calculateEfficiency(metrics) {
        if (metrics.totalConverted === 0) return 0;
        return metrics.nwBoost / metrics.totalConverted;
    }

    /**
     * Return empty metrics object
     * @returns {Object} Empty metrics
     */
    static getEmptyMetrics() {
        return {
            totalConverted: 0,
            conversionYears: 0,
            totalConversionTax: 0,
            taxDifference: 0,
            nwBoost: 0,
            avgAnnualConversion: 0,
            rothGrowthBenefit: 0,
            baselineFinalNW: 0,
            rothFinalNW: 0
        };
    }

    /**
     * Validate metrics calculation
     * @param {Object} metrics - Metrics to validate
     * @returns {boolean} True if valid
     */
    static validateMetrics(metrics) {
        if (!metrics) return false;

        // Check for NaN values
        const values = Object.values(metrics);
        if (values.some(v => typeof v === 'number' && isNaN(v))) {
            console.warn('RothMetricsCalculator: NaN detected in metrics');
            return false;
        }

        return true;
    }
}

export default RothMetricsCalculator;
