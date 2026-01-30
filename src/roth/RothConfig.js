/**
 * Roth Conversion Configuration
 * Centralized settings for Roth conversion strategy
 */

export const RothConfig = {
    // Conversion Settings
    enabled: true,
    startYear: 2026,
    endYear: 2047,

    // Amount Settings
    mode: 'manual', // 'manual', 'bracket', 'hybrid'
    manualAmount: 240808,

    // Bracket Settings (for bracket mode)
    targetBracket: 22, // 12, 22, 24, 32
    maxAnnualCap: null, // null = no cap, or number for hybrid mode

    // Tax Brackets (2025 - Married Filing Jointly)
    brackets: {
        12: { single: 47025, joint: 94050 },
        22: { single: 100525, joint: 201050 },
        24: { single: 191950, joint: 383900 },
        32: { single: 243725, joint: 487450 },
        35: { single: 609350, joint: 731200 },
        37: { single: Infinity, joint: Infinity }
    },

    // Optimization Settings
    optimization: {
        enabled: false,
        targetEffectiveRate: 15, // Target effective tax rate %
        considerRMDs: true,
        considerSSIncome: true,
        yearlyRebalance: true
    },

    // Display Settings
    showChart: true,
    showMetrics: true,
    showOptimizationButton: true
};

/**
 * Validate and snap bracket to nearest valid key
 */
function validateBracket(bracket) {
    const validBrackets = [12, 22, 24, 32, 35, 37]; // 10 is technically possible but usually 12 is minimum for meaningful strategy
    // Or better, use keys from object
    const keys = Object.keys(RothConfig.brackets).map(Number);

    let b = Number(bracket);
    // Handle percentage inputs (e.g. 0.22 -> 22)
    if (b < 1 && b > 0) b = Math.round(b * 100);

    if (keys.includes(b)) return b;

    // Find nearest
    return keys.reduce((prev, curr) => {
        return (Math.abs(curr - b) < Math.abs(prev - b) ? curr : prev);
    });
}

/**
 * Calculate target conversion amount based on bracket
 */
export function calculateBracketAmount(bracket, filingStatus, currentIncome) {
    const validBracket = validateBracket(bracket);
    const limit = RothConfig.brackets[validBracket]?.[filingStatus] || 0;
    const availableRoom = Math.max(0, limit - currentIncome);

    // Apply cap if in hybrid mode
    if (RothConfig.maxAnnualCap) {
        return Math.min(availableRoom, RothConfig.maxAnnualCap);
    }

    return availableRoom;
}

/**
 * Validate conversion amount
 */
export function validateConversionAmount(amount, retirementBalance) {
    if (amount < 0) return 0;
    if (amount > retirementBalance) return retirementBalance;
    return amount;
}

/**
 * Get conversion strategy description
 */
export function getStrategyDescription() {
    switch (RothConfig.mode) {
        case 'bracket':
            return `Fill ${RothConfig.targetBracket}% tax bracket`;
        case 'hybrid':
            return `Fill ${RothConfig.targetBracket}% bracket (max $${RothConfig.maxAnnualCap?.toLocaleString()}/year)`;
        case 'manual':
        default:
            return `Fixed $${RothConfig.manualAmount.toLocaleString()}/year`;
    }
}

export default RothConfig;
