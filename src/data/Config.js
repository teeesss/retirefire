export let config = {
    startYear: 2026,
    startAge: 50,
    endYear: 2071,
    endAge: 95,
    currentScenario: 'optimistic',
    currentYear: 0,
    theme: 'dark',
    comparisonEnabled: { optimistic: true, average: true, pessimistic: true },

    // User settings - will be updated from inputs
    settings: {
        personal: {
            name: '',
            age: 50,
            retireAge: 53,
            longevity: 95
        },
        spouse: {
            enabled: false,
            name: '',
            age: 48,
            retireAge: 55,
            longevity: 97,
            income: 75000,
            retirement: 500000,
            roth: 100000,
            ss62: 1800
        },
        assets: {
            retirement: 3000000,
            roth: 311000,
            hsa: 250000,
            investments: 67000,
            cash: 10000,
            crypto: 293500,
            btc: 4.5,
            eth: 4.0,
            sol: 14.2,
            otherAssets: 517000,
            debt: 4583
        },
        glidePath: {
            stocks: 90,
            bonds: 0,
            cash: 3,
            crypto: 7
        },
        housing: {
            homeValue: 675000,
            appreciation: 3.5,
            mortgageBalance: 250000,
            mortgageRate: 3.5,
            mortgagePayment: 2600,
            mortgageYears: 8,
            propertyTax: 8000,
            maintenance: 5000,
            insurance: 2400,
            sellHome: 'no',
            sellYear: 2032,
            saleCosts: 6,
            futureRent: 3000,
            rentInflation: 3,
            buyNewHome: 'no',
            buyYear: 2033,
            newHomeValue: 400000,
            newMortgageAmount: 0,
            newMortgageRate: 6.5,
            newMortgageYears: 30
        },
        income: {
            work: 150000,
            growth: 3.5,
            contribution401k: 23000,
            employerMatch: 11000,
            rothContrib: 3000,
            hsaContrib: 5000,
            rental: 0,
            dividend: 0,
            pension: 0,
            sideIncome: 0
        },
        socialSecurity: {
            ss62: 2739,
            ss67: 3913,
            ss70: 4857,
            claimAge: 62,
            cola: 2.0
        },
        taxSettings: {
            filingStatus: 'hoh',
            state: 'FL',
            fedBracket: 24,
            tcjaSunset: true
        },
        expenses: {
            general: 60000,
            utilities: 6000,
            insurance: 4000,
            travel: 12000,
            gifts: 5000,
            misc: 3000,
            retireReduction: 10,
            age75Reduction: 15,
            annualSpending: 90000,
            phases: [
                { startAge: 53, endAge: 60, multiplier: 1.2, description: 'Active Retirement' },
                { startAge: 60, endAge: 70, multiplier: 0.9, description: 'Slow Down' }
            ]
        },
        healthcare: {
            current: 5000,
            preMedicare: 5000,
            medicare: 10000,
            outOfPocket: 5000,
            inflation: 5,
            ltcAge: 93,
            ltcCost: 100000,
            ltcInflation: 4
        },
        rates: {
            optimistic: 10.52,
            average: 8.77,
            pessimistic: 7.02,
            bonds: 4.0,
            cash: 2.0
        },
        inflation: {
            optimistic: 2.03,
            average: 2.54,
            pessimistic: 3.05
        },
        taxes: {
            rothConversion: 240808,
            rothConvStart: 2030,
            rothConvEnd: 2050,
            rothConversionEnabled: true,
            withdrawalStrategy: 'grow_tax_deferred' // options: 'grow_tax_deferred', 'minimize_rmds'
        },
        goals: {
            retirementNW: 4000000,
            age70NW: 10000000,
            legacy: 5000000,
            retireIncome: 120000
        }
    },

    events: [
        { year: 2032, description: 'Home Sale Proceeds', amount: 827420, type: 'income' }
    ],

    goals: [
        { name: 'Early Retirement at 53', target: 4000000, year: 2029, current: 4240000 },
        { name: '$10M by Age 70', target: 10000000, year: 2046, current: 4240000 },
        { name: 'Leave $5M Legacy', target: 5000000, year: 2071, current: 4240000 }
    ],
    cryptoPrices: { BTC: 93000, ETH: 3200, SOL: 130 },
    recurringEvents: []
};
