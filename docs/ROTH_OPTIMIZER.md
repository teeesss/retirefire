# Roth Conversion Optimizer - Technical Documentation

## Overview

The Roth Conversion Optimizer is an intelligent tax optimization tool that automatically finds the ideal Roth conversion amount to maximize tax efficiency while minimizing lifetime tax burden.

## Architecture

### Core Components

1. **RothOptimizer.js** - Main optimization engine
2. **RothCalculator.js** - Conversion calculations
3. **RothConfig.js** - Configuration and settings
4. **RothUI.js** - User interface handler
5. **roth.html** - UI components

### File Structure

```
src/roth/
├── RothOptimizer.js      # 🎯 NEW: Advanced optimization engine
├── RothCalculator.js     # Conversion calculations
├── RothConfig.js         # Configuration
└── RothUI.js             # UI handler (enhanced)

src/partials/charts/
└── roth.html             # 🎯 REDESIGNED: New optimizer UI

tests/unit/
└── RothOptimizer.test.js # 🎯 NEW: 22 comprehensive tests
```

## Features

### 1. Intelligent Optimization Algorithm

**Multi-Year Tax Bracket Optimization:**
- Analyzes tax brackets across all conversion years
- Automatically finds optimal conversion amount for each year
- Considers future income, RMDs, and Social Security
- Uses binary search for precise bracket filling

**Tax Calculations:**
- Accurate 2025 federal tax brackets (single + joint filers)
- Marginal tax rate calculations
- Effective tax rate calculations
- Incremental tax-on-conversion (not total tax)

### 2. Three Conversion Strategies

#### Manual Mode
- User specifies fixed annual amount
- Simple and predictable
- Good for conservative planning

#### Bracket-Fill Mode
- Automatically fills target tax bracket
- Maximizes conversions while staying in bracket
- Ideal for tax-efficient optimization

#### Hybrid Mode
- Fills bracket up to annual cap
- Best of both worlds
- Provides safety limit

### 3. Optimization Engine

**Algorithm:**
```javascript
For each year:
  1. Calculate current tax bracket
  2. Determine room in target bracket
  3. Apply constraints (balance, caps)
  4. Calculate tax impact
  5. Optimize conversion amount
```

**Constraints Supported:**
- Maximum annual conversion cap
- Minimum annual conversion threshold
- Available traditional IRA balance
- Conversion period (start/end years)

### 4. Tax Impact Analysis

**Metrics Calculated:**
- Total converted amount
- Total tax paid on conversions
- Effective tax rate on conversions
- Marginal tax rate per year
- Bracket utilization percentage
- Years with active conversions

**Future Value Projections:**
- Tax-free growth calculations
- Legacy benefit estimates
- Compound growth modeling

### 5. Strategy Comparison

**Manual vs Optimized:**
- Conversion amount difference
- Tax savings/cost
- Efficiency gain percentage
- Recommendation engine

## Usage

### Basic Usage

1. **Open Roth Conversion Section**
   - Navigate to "Roth Conversion Optimizer" card

2. **Select Strategy**
   - Choose Manual, Bracket-Fill, or Hybrid mode
   - Set target bracket (12%, 22%, 24%, 32%)
   - Configure conversion period

3. **Click "Optimize Strategy"**
   - Engine analyzes your plan
   - Calculates optimal conversions
   - Displays detailed results

4. **Review & Apply**
   - Review optimization results in console
   - Confirm to apply optimized strategy
   - Charts update automatically

### Advanced Configuration

**RothConfig.js Settings:**
```javascript
{
  enabled: true,
  startYear: 2026,
  endYear: 2047,
  mode: 'bracket',        // 'manual', 'bracket', 'hybrid'
  targetBracket: 22,      // 12, 22, 24, 32
  maxAnnualCap: 100000,   // For hybrid mode
  manualAmount: 50000     // For manual mode
}
```

## API Reference

### RothOptimizer.optimize(params)

Optimizes Roth conversion strategy across multiple years.

**Parameters:**
```javascript
{
  years: Array<number>,              // Years to optimize
  ordinaryIncome: Array<number>,     // Income per year
  traditionalBalance: Array<number>, // IRA balance per year
  filingStatus: 'single' | 'joint',  // Tax filing status
  targetBracket: 12 | 22 | 24 | 32,  // Target tax bracket
  constraints: {
    maxAnnual?: number,              // Max conversion per year
    minAnnual?: number               // Min conversion per year
  }
}
```

**Returns:**
```javascript
{
  results: Array<{
    year: number,
    conversionAmount: number,
    income: number,
    totalIncome: number,
    marginalRate: number,
    effectiveRate: number,
    taxOnConversion: number,
    remainingBalance: number
  }>,
  summary: {
    totalConverted: number,
    totalTaxPaid: number,
    yearsWithConversions: number,
    averageAnnualConversion: number,
    effectiveTaxRate: number
  }
}
```

### RothOptimizer.findOptimalConversion(params)

Finds optimal conversion for a single year.

**Parameters:**
```javascript
{
  year: number,
  income: number,
  balance: number,
  filingStatus: 'single' | 'joint',
  targetBracket: number,
  constraints: Object
}
```

### RothOptimizer.calculateTaxImpact(income, conversion, filingStatus)

Calculates incremental tax on conversion.

**Returns:** Tax amount (number)

### RothOptimizer.compareStrategies(manual, optimized)

Compares two strategies.

**Returns:**
```javascript
{
  conversionDifference: number,
  taxSavings: number,
  efficiencyGain: number,
  taxEfficiencyGain: number,
  recommendation: 'manual' | 'optimized'
}
```

## Testing

### Test Coverage

**22 comprehensive test cases covering:**
- Tax calculations (marginal, effective, total)
- Bracket optimization
- Multi-year optimization
- Constraint handling
- Edge cases
- Future value calculations
- Report generation

**Run Tests:**
```bash
npm run test:unit -- tests/unit/RothOptimizer.test.js
```

**All Tests:**
```bash
npm run test:full  # 303/303 passing
```

## Tax Brackets (2025)

### Single Filers
| Bracket | Income Range | Rate |
|---------|--------------|------|
| 10% | $0 - $11,600 | 10% |
| 12% | $11,601 - $47,150 | 12% |
| 22% | $47,151 - $100,525 | 22% |
| 24% | $100,526 - $191,950 | 24% |
| 32% | $191,951 - $243,725 | 32% |
| 35% | $243,726 - $609,350 | 35% |
| 37% | $609,351+ | 37% |

### Married Filing Jointly
| Bracket | Income Range | Rate |
|---------|--------------|------|
| 10% | $0 - $23,200 | 10% |
| 12% | $23,201 - $94,300 | 12% |
| 22% | $94,301 - $201,050 | 22% |
| 24% | $201,051 - $383,900 | 24% |
| 32% | $383,901 - $487,450 | 32% |
| 35% | $487,451 - $731,200 | 35% |
| 37% | $731,201+ | 37% |

## Performance

- **Optimization Speed:** < 100ms for 50 years
- **Memory Usage:** Minimal (< 1MB)
- **Browser Compatibility:** All modern browsers
- **Bundle Size:** 3.85 KB (gzipped: 1.51 KB)

## Future Enhancements

### Planned Features
- [ ] State tax integration
- [ ] IRMAA threshold awareness
- [ ] ACA subsidy cliff avoidance
- [ ] Multi-scenario comparison
- [ ] PDF report generation
- [ ] Historical tax bracket data
- [ ] Inflation adjustment

### Optimization Improvements
- [ ] Machine learning for pattern recognition
- [ ] Monte Carlo simulation integration
- [ ] Dynamic bracket targeting
- [ ] Risk-adjusted optimization

## Troubleshooting

### Common Issues

**Optimizer not finding conversions:**
- Check that conversion period includes valid years
- Verify traditional IRA balance > 0
- Ensure income is below target bracket

**Unexpected tax calculations:**
- Verify filing status is correct
- Check for state tax considerations
- Review ordinary income inputs

**UI not updating:**
- Check browser console for errors
- Verify RothUI.init() was called
- Refresh page and try again

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Review test cases for usage examples
3. Examine RothOptimizer.js source code
4. Contact development team

## License

Proprietary - RetireFire Application

---

**Last Updated:** 2026-01-29  
**Version:** 1.0.0  
**Author:** RetireFire Development Team
