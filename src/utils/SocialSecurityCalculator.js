/**
 * Social Security Calculator
 * Estimates Primary Insurance Amount (PIA) and age-based benefits
 * based on current income and career earning profile.
 * 
 * Logic based on 2025/2026 SSA formulas.
 */

export const SocialSecurityCalculator = {
    // 2025 Bend Points
    bendPoints: [1226, 7391],

    // 2025 Max Taxable Earnings
    maxTaxableEarnings: 176100,

    /**
     * Calculate estimated monthly benefit at Full Retirement Age (PIA)
     * @param {number} currentIncome - Annual income
     * @param {string} earningProfile - 'low', 'medium', 'high', 'max'
     * @returns {number} Monthly PIA
     */
    calculatePIA(currentIncome, earningProfile = 'high') {
        let aime = 0;

        // Simplify AIME calculation based on profile
        // AIME = Average Indexed Monthly Earnings over top 35 years
        switch (earningProfile) {
            case 'max':
                // Assumes hitting max taxable wage base consistently
                aime = 14000; // Approx max AIME for 2025 retiree
                break;
            case 'high':
                // ~75% of max or current income if lower
                aime = Math.min(currentIncome / 12, 10500);
                break;
            case 'medium':
                // ~50% of max or current income if lower
                aime = Math.min(currentIncome / 12, 7000);
                break;
            case 'low':
                // ~25% of max or current income if lower
                aime = Math.min(currentIncome / 12, 3500);
                break;
            default:
                // Custom approximation: Take 90% of current monthly income (capped at max)
                // assuming current income is peak and past was lower
                aime = Math.min((currentIncome / 12) * 0.9, 14000);
        }

        // Apply Bend Points (2025 Formula)
        let pia = 0;

        // First Bend Point (90%)
        const firstChunk = Math.min(aime, this.bendPoints[0]);
        pia += firstChunk * 0.90;

        // Second Bend Point (32%)
        if (aime > this.bendPoints[0]) {
            const secondChunk = Math.min(aime, this.bendPoints[1]) - this.bendPoints[0];
            pia += secondChunk * 0.32;
        }

        // Third Bend Point (15%)
        if (aime > this.bendPoints[1]) {
            const thirdChunk = aime - this.bendPoints[1];
            pia += thirdChunk * 0.15;
        }

        return Math.floor(pia);
    },

    /**
     * Calculate benefits for key ages
     * @param {number} pia - Primary Insurance Amount (monthly)
     * @returns {object} { ss62, ss67, ss70 }
     */
    calculateBenefits(pia) {
        // Full Retirement Age (FRA) assumed 67
        // Age 62: 70% of PIA (30% reduction)
        const ss62 = Math.floor(pia * 0.70);

        // Age 67: 100% of PIA
        const ss67 = Math.floor(pia * 1.0);

        // Age 70: 124% of PIA (8% credit for 3 years)
        const ss70 = Math.floor(pia * 1.24);

        return { ss62, ss67, ss70 };
    }
};
