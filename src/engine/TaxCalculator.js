export class TaxCalculator {
    static brackets = {
        single: [
            { limit: 11600, rate: 0.10 },
            { limit: 47150, rate: 0.12 },
            { limit: 100525, rate: 0.22 },
            { limit: 191950, rate: 0.24 },
            { limit: 243725, rate: 0.32 },
            { limit: 609350, rate: 0.35 },
            { limit: Infinity, rate: 0.37 }
        ],
        married: [
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

    static standardDeduction = {
        single: 14600,
        married: 29200,
        hoh: 21900
    };

    static ltcgBrackets = {
        single: [
            { limit: 47025, rate: 0.00 },
            { limit: 518950, rate: 0.15 },
            { limit: Infinity, rate: 0.20 }
        ],
        married: [
            { limit: 94050, rate: 0.00 },
            { limit: 583750, rate: 0.15 },
            { limit: Infinity, rate: 0.20 }
        ],
        hoh: [
            { limit: 63000, rate: 0.00 },
            { limit: 551350, rate: 0.15 },
            { limit: Infinity, rate: 0.20 }
        ]
    };

    static calculateProgressive(taxableIncome, brackets) {
        let tax = 0;
        let prevLimit = 0;

        for (const bracket of brackets) {
            if (taxableIncome > bracket.limit) {
                tax += (bracket.limit - prevLimit) * bracket.rate;
                prevLimit = bracket.limit;
            } else {
                tax += (taxableIncome - prevLimit) * bracket.rate;
                break;
            }
        }
        return tax;
    }

    static calculateFederalSocialSecurity(totalIncome, status) {
        const deduction = this.standardDeduction[status] || 14600;
        const taxableIncome = Math.max(0, totalIncome - deduction);
        const statusBrackets = this.brackets[status] || this.brackets.single;
        return this.calculateProgressive(taxableIncome, statusBrackets);
    }

    static calculateCombined(income, spouseIncome, status) {
        const total = (income || 0) + (spouseIncome || 0);
        return this.calculateFederalSocialSecurity(total, status);
    }

    /**
     * Calculates detailed tax breakdown
     * @param {number} wages - Earned income (wages, self-employment) subject to FICA
     * @param {number} otherOrdIncome - Other ordinary income (RMDs, Pensions, Interest) NOT subject to FICA
     * @param {number} capGains - Long term capital gains
     * @param {string} filingStatus - single, married, or hoh
     * @param {string} state - state code (e.g., 'CA', 'FL')
     * @returns {Object} Tax breakdown
     */
    static calculateTaxBreakdown(wages, otherOrdIncome, capGains, filingStatus, state, earlyWithdrawalPenalty = 0) {
        const totalOrdIncome = (wages || 0) + (otherOrdIncome || 0);
        const deduction = this.standardDeduction[filingStatus] || 14600;

        // 1. Ordinary Income Tax
        const taxableOrd = Math.max(0, totalOrdIncome - deduction);
        const ordBrackets = this.brackets[filingStatus] || this.brackets.single;
        const fedOrd = this.calculateProgressive(taxableOrd, ordBrackets);

        // 2. Capital Gains Tax
        // CG sits on top of ordinary income for bracket determination
        const totalTaxable = taxableOrd + (capGains || 0);
        const cgBrackets = this.ltcgBrackets[filingStatus] || this.ltcgBrackets.single;

        const totalCGTax = this.calculateProgressive(totalTaxable, cgBrackets);
        const ordCGTax = this.calculateProgressive(taxableOrd, cgBrackets);
        const fedCG = Math.max(0, totalCGTax - ordCGTax);

        // 3. FICA (Simplified)
        const ficaRate = 0.0765;
        const ficaCap = 176100;
        const fica = Math.min(wages || 0, ficaCap) * ficaRate;

        // 4. State Tax (Simplified)
        const stateRates = { 'CA': 0.093, 'NY': 0.065, 'FL': 0, 'TX': 0, 'IL': 0.0495, 'MA': 0.05 };
        const st = (taxableOrd + (capGains || 0)) * (stateRates[state] || 0);

        return {
            federalOrd: Math.round(fedOrd),
            federalCG: Math.round(fedCG),
            fica: Math.round(fica),
            state: Math.round(st),
            penalty: Math.round(earlyWithdrawalPenalty || 0),
            total: Math.round(fedOrd + fedCG + fica + st + (earlyWithdrawalPenalty || 0))
        };
    }

    static getTaxes(totalIncome, filingStatus, state) {
        // Default assume all is ordinary other, not wages for safety in getTaxes
        return this.calculateTaxBreakdown(0, totalIncome, 0, filingStatus, state);
    }
}
