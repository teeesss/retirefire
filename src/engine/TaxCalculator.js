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

    static calculateFederalSocialSecurity(totalIncome, status) {
        const deduction = this.standardDeduction[status] || 14600;
        let taxableIncome = Math.max(0, totalIncome - deduction);
        let tax = 0;
        let prevLimit = 0;

        const statusBrackets = this.brackets[status] || this.brackets.single;

        for (const bracket of statusBrackets) {
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

    static calculateCombined(income, spouseIncome, status) {
        const total = (income || 0) + (spouseIncome || 0);
        return this.calculateFederalSocialSecurity(total, status);
    }

    static getTaxes(income, filingStatus, state, isEarned = true) {
        const deduction = this.standardDeduction[filingStatus] || 14600;
        const taxable = Math.max(0, income - deduction);
        const fed = this.calculateFederalSocialSecurity(income, filingStatus); // Re-use our progressive logic

        // Mock state tax for now
        const stateRates = { 'CA': 0.093, 'NY': 0.065, 'FL': 0, 'TX': 0 };
        const st = taxable * (stateRates[state] || 0);

        // FICA
        const ficaRate = 0.0765;
        const ficaCap = 176100;
        const fi = isEarned ? Math.min(income, ficaCap) * ficaRate : 0;

        return { federal: fed, state: st, fica: fi, total: fed + st + fi };
    }
}
