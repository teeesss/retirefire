# Roth Conversion Module

## Overview
This module provides a complete, self-contained system for managing Roth IRA conversion strategies in the RetireFire application.

## Architecture

### Files
```
src/roth/
├── RothConfig.js       - Configuration and settings
├── RothCalculator.js   - Calculation engine
├── RothUI.js           - UI interaction handler
└── README.md           - This file

src/partials/
└── roth-controls.html  - UI controls partial
```

## Features

### 1. Conversion Strategies
- **Manual**: Fixed annual amount
- **Bracket**: Fill to specific tax bracket
- **Hybrid**: Fill bracket with annual cap

### 2. Configuration (`RothConfig.js`)
```javascript
import RothConfig from './roth/RothConfig.js';

// Enable/disable conversions
RothConfig.enabled = true;

// Set strategy mode
RothConfig.mode = 'bracket'; // 'manual', 'bracket', 'hybrid'

// Set target bracket (for bracket/hybrid modes)
RothConfig.targetBracket = 22; // 12, 22, 24, 32

// Set manual amount (for manual mode)
RothConfig.manualAmount = 50000;

// Set hybrid cap (for hybrid mode)
RothConfig.maxAnnualCap = 100000;

// Set conversion period
RothConfig.startYear = 2026;
RothConfig.endYear = 2047;
```

### 3. Calculator (`RothCalculator.js`)
```javascript
import RothCalculator from './roth/RothCalculator.js';

// Calculate conversion for a specific year
const amount = RothCalculator.calculateYearlyConversion(
    2026,              // year
    500000,            // retirement balance
    80000,             // ordinary income
    'joint'            // filing status
);

// Calculate tax impact
const tax = RothCalculator.calculateTaxImpact(
    50000,             // conversion amount
    80000,             // ordinary income
    'joint'            // filing status
);

// Optimize strategy
const optimized = RothCalculator.optimizeStrategy(
    years,             // array of years
    incomes,           // array of incomes
    balances,          // array of balances
    15                 // target effective rate %
);
```

### 4. UI Handler (`RothUI.js`)
```javascript
import RothUI from './roth/RothUI.js';

// Initialize UI (call on page load)
RothUI.init();

// Update metrics display
RothUI.updateMetrics(
    5100000,           // total converted
    21,                // years
    1200000,           // tax savings
    4300000            // legacy boost
);
```

## Integration

### In `main.js`
```javascript
import RothUI from './roth/RothUI.js';
import RothConfig from './roth/RothConfig.js';
import RothCalculator from './roth/RothCalculator.js';

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    RothUI.init();
});

// Use in simulation engine
function calculateYearlyRothConversion(year, balance, income) {
    return RothCalculator.calculateYearlyConversion(
        year,
        balance,
        income,
        config.settings.taxSettings.filingStatus
    );
}
```

### In HTML
```html
<!-- Include Roth controls in your layout -->
<load src="src/partials/roth-controls.html" />
```

## Tax Brackets (2025)

### Married Filing Jointly
| Bracket | Income Range |
|---------|--------------|
| 12%     | Up to $94,050 |
| 22%     | $94,051 - $201,050 |
| 24%     | $201,051 - $383,900 |
| 32%     | $383,901 - $487,450 |
| 35%     | $487,451 - $731,200 |
| 37%     | $731,201+ |

### Single
| Bracket | Income Range |
|---------|--------------|
| 12%     | Up to $47,025 |
| 22%     | $47,026 - $100,525 |
| 24%     | $100,526 - $191,950 |
| 32%     | $191,951 - $243,725 |
| 35%     | $243,726 - $609,350 |
| 37%     | $609,351+ |

## Testing

### Unit Tests
```javascript
// Test conversion calculation
test('calculates bracket conversion correctly', () => {
    RothConfig.mode = 'bracket';
    RothConfig.targetBracket = 22;
    
    const amount = RothCalculator.calculateYearlyConversion(
        2026, 500000, 80000, 'joint'
    );
    
    expect(amount).toBe(121050); // 201050 - 80000
});
```

## Future Enhancements
- [ ] Multi-year optimization algorithm
- [ ] RMD consideration in bracket calculations
- [ ] Social Security income integration
- [ ] State tax consideration
- [ ] Roth conversion ladder planning
- [ ] Tax loss harvesting coordination

## Maintenance
- Update tax brackets annually (January)
- Review optimization algorithms quarterly
- Test with edge cases (high income, low balance, etc.)

---

**Last Updated**: 2026-01-24  
**Version**: 1.0.0  
**Maintainer**: RetireFire Team
