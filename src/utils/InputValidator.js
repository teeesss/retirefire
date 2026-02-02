/**
 * Input Validation Utility
 * Provides comprehensive validation for user inputs to prevent invalid data
 * from entering the simulation engine
 */

export class InputValidator {
    static schemas = {
        age: { min: 18, max: 100 },
        retireAge: { min: 50, max: 100 },
        salary: { min: 0, max: 10_000_000 },
        netWorth: { min: -10_000_000, max: 100_000_000 },
        percentage: { min: 0, max: 100 },
        years: { min: 1, max: 100 }
    };

    /**
     * Validate a single value against a schema type
     * @param {*} value - Value to validate
     * @param {string} type - Schema type (age, salary, etc.)
     * @returns {Object} { valid: boolean, value?: number, error?: string }
     */
    static validate(value, type) {
        const schema = this.schemas[type];
        if (!schema) {
            throw new Error(`Unknown validation type: ${type}`);
        }

        const num = parseFloat(value);
        if (isNaN(num)) {
            return {
                valid: false,
                error: `Invalid number: ${value}`
            };
        }

        if (num < schema.min || num > schema.max) {
            return {
                valid: false,
                error: `Value must be between ${schema.min.toLocaleString()} and ${schema.max.toLocaleString()}`
            };
        }

        return { valid: true, value: num };
    }

    /**
     * Validate entire settings object
     * @param {Object} settings - Settings object from config
     * @returns {Object} { valid: boolean, errors?: string[] }
     */
    static validateSettings(settings) {
        const errors = [];

        // Age validation
        const ageResult = this.validate(settings.personal?.age, 'age');
        if (!ageResult.valid) {
            errors.push(`Current Age: ${ageResult.error}`);
        }

        const retireAgeResult = this.validate(settings.personal?.retireAge, 'retireAge');
        if (!retireAgeResult.valid) {
            errors.push(`Retirement Age: ${retireAgeResult.error}`);
        }

        // Logical validation - retirement age must be after current age
        if (settings.personal?.retireAge && settings.personal?.age) {
            if (settings.personal.retireAge <= settings.personal.age) {
                errors.push('Retirement age must be greater than current age');
            }
        }

        // Financial validation
        if (settings.income?.salary !== undefined) {
            const salaryResult = this.validate(settings.income.salary, 'salary');
            if (!salaryResult.valid) {
                errors.push(`Salary: ${salaryResult.error}`);
            }
        }

        // Validate rates are percentages
        if (settings.rates) {
            ['optimistic', 'average', 'pessimistic', 'inflation'].forEach(rateType => {
                if (settings.rates[rateType] !== undefined) {
                    const rate = settings.rates[rateType] * 100; // Convert to percentage
                    if (rate < -50 || rate > 50) {
                        errors.push(`${rateType} rate must be between -50% and 50%`);
                    }
                }
            });
        }

        return errors.length > 0 ? { valid: false, errors } : { valid: true };
    }

    /**
     * Sanitize string input to prevent XSS
     * @param {string} input - User input string
     * @returns {string} Sanitized string
     */
    static sanitizeString(input) {
        if (typeof input !== 'string') return '';

        // Remove HTML tags and dangerous characters
        return input
            .replace(/[<>]/g, '') // Remove angle brackets
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .trim()
            .slice(0, 500); // Limit length
    }

    /**
     * Validate Monte Carlo iterations
     * @param {number} iterations - Number of iterations
     * @returns {Object} { valid: boolean, value?: number, error?: string }
     */
    static validateMonteCarloIterations(iterations) {
        const num = parseInt(iterations);

        if (isNaN(num)) {
            return { valid: false, error: 'Iterations must be a number' };
        }

        if (num < 1) {
            return { valid: false, error: 'Monte Carlo iterations must be >= 1' };
        }

        if (num > 100000) {
            return { valid: false, error: 'Monte Carlo iterations capped at 100,000 for performance' };
        }

        return { valid: true, value: num };
    }
}
