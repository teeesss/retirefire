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
    manualOverrides: {}, // { 2030: 50000, 2031: 75000 }

    // Bracket Settings (for bracket mode)
    targetBracket: 22, // 12, 22, 24, 32
    maxAnnualCap: null, // null = no cap, or number for hybrid mode

    // Advanced Strategy Settings
    payTaxesFrom: 'brokerage', // 'brokerage' (outside) or 'traditional' (withheld)
    sourceAccount: 'traditional_ira', // 'traditional_ira' or '401k'

    // Tax Brackets (2025 - Simplified)
    brackets: {
        10: { single: 11600, joint: 23200, hoh: 16550 },
        12: { single: 47150, joint: 94300, hoh: 63100 },
        22: { single: 100525, joint: 201050, hoh: 100500 },
        24: { single: 191950, joint: 383900, hoh: 191950 },
        32: { single: 243725, joint: 487450, hoh: 243725 },
        35: { single: 609350, joint: 731200, hoh: 609350 },
        37: { single: Infinity, joint: Infinity, hoh: Infinity }
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

    // If limit is Infinity (37% bracket), return 0 as we don't want to convert unlimited amounts
    if (!isFinite(limit) || limit === 0) {
        return 0;
    }

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

/**
 * Sync RothConfig with global config settings
 * @param {Object} globalConfig - The global config object
 */
export function syncWithGlobalConfig(globalConfig) {
    if (!globalConfig?.settings?.taxes) return;

    const taxes = globalConfig.settings.taxes;

    RothConfig.enabled = taxes.rothConversionEnabled ?? RothConfig.enabled;
    RothConfig.startYear = taxes.rothConvStart ?? RothConfig.startYear;
    RothConfig.endYear = taxes.rothConvEnd ?? RothConfig.endYear;
    RothConfig.manualAmount = taxes.rothConversion ?? RothConfig.manualAmount;
    RothConfig.targetBracket = taxes.rothConvBracket ?? RothConfig.targetBracket;

    // Sync mode if available
    if (taxes.rothConvMode) {
        RothConfig.mode = taxes.rothConvMode;
    }

    // Sync cap if available
    if (taxes.rothConvCap !== undefined) {
        RothConfig.maxAnnualCap = taxes.rothConvCap;
    }
}

/**
 * Update global config with RothConfig values
 * @param {Object} globalConfig - The global config object to update
 */
export function updateGlobalConfig(globalConfig) {
    if (!globalConfig?.settings?.taxes) return;

    const taxes = globalConfig.settings.taxes;

    taxes.rothConversionEnabled = RothConfig.enabled;
    taxes.rothConvStart = RothConfig.startYear;
    taxes.rothConvEnd = RothConfig.endYear;
    taxes.rothConversion = RothConfig.manualAmount;
    taxes.rothConvBracket = RothConfig.targetBracket;
    taxes.rothConvMode = RothConfig.mode;
    taxes.rothConvCap = RothConfig.maxAnnualCap;
}

export default RothConfig;
