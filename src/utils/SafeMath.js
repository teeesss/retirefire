/**
 * Safe mathematical operations to prevent NaN/Infinity errors
 */

/**
 * Safe division with fallback value
 * Prevents division by zero and NaN propagation
 * 
 * @param {number} numerator - The dividend
 * @param {number} denominator - The divisor
 * @param {number} fallback - Value to return if division is unsafe (default: 0)
 * @returns {number} Result of division or fallback value
 * 
 * @example
 * safeDiv(100, 0, 0) // returns 0 instead of Infinity
 * safeDiv(100, 5, 0) // returns 20
 * safeDiv(NaN, 5, 0) // returns 0
 */
export function safeDiv(numerator, denominator, fallback = 0) {
    // Type check
    if (typeof numerator !== 'number' || typeof denominator !== 'number') {
        return fallback;
    }

    // NaN check
    if (isNaN(numerator) || isNaN(denominator)) {
        return fallback;
    }

    // Division by zero check
    if (denominator === 0 || !isFinite(denominator)) {
        return fallback;
    }

    // Calculate and validate result
    const result = numerator / denominator;
    return isFinite(result) ? result : fallback;
}

/**
 * Safe percentage calculation
 * 
 * @param {number} part - The partial value
 * @param {number} whole - The total value
 * @returns {number} Percentage (0-100)
 * 
 * @example
 * safePercent(25, 100) // returns 25
 * safePercent(50, 0) // returns 0 instead of Infinity
 */
export function safePercent(part, whole) {
    return safeDiv(part, whole, 0) * 100;
}

/**
 * Clamp a value to a specified range
 * 
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} Clamped value
 * 
 * @example
 * clamp(150, 0, 100) // returns 100
 * clamp(-10, 0, 100) // returns 0
 * clamp(50, 0, 100) // returns 50
 */
export function clamp(value, min, max) {
    if (isNaN(value)) return min;
    return Math.max(min, Math.min(max, value));
}

/**
 * Safe number parsing with validation
 * 
 * @param {*} value - Value to parse
 * @param {number} min - Minimum allowed value (default: -Infinity)
 * @param {number} max - Maximum allowed value (default: Infinity)
 * @param {number} defaultValue - Default value if parsing fails (default: 0)
 * @returns {number} Parsed and validated number
 * 
 * @example
 * safeParseNumber("123", 0, 1000, 0) // returns 123
 * safeParseNumber("abc", 0, 1000, 0) // returns 0
 * safeParseNumber("5000", 0, 1000, 0) // returns 1000 (clamped)
 */
export function safeParseNumber(value, min = -Infinity, max = Infinity, defaultValue = 0) {
    const num = parseFloat(value);
    if (isNaN(num)) {
        return defaultValue;
    }
    return clamp(num, min, max);
}
