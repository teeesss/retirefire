# Implementation Plan: Code Quality & Performance Improvements

**Date**: 2026-02-01  
**Priority**: Medium  
**Estimated Total Effort**: 12-16 hours  
**Status**: Ready for Implementation

---

## Overview

This plan addresses the medium-priority improvements identified in the Comprehensive Audit Report. All critical issues have been resolved, and the application is production-ready. These enhancements will improve maintainability, debuggability, and performance.

---

## Phase 1: Code Deduplication (Priority: HIGH)

### Goal
Eliminate ~400 lines of duplicated logic between `project()` and `_projectWithVariableReturns()` methods.

### Current State
Both methods contain identical annual calculation logic:
- Income calculations (Work, SS, RMD)
- Expense calculations (General, Housing, Medical, LTC)
- Tax calculations (Federal, State, FICA, Capital Gains)
- Roth conversion processing
- Drawdown logic
- Account balance updates

### Proposed Solution

#### Step 1: Extract Pure Function
Create `_processYear()` method that encapsulates all annual logic:

```javascript
/**
 * Process a single year of financial projections
 * @param {Object} state - Current account balances
 * @param {Object} config - Configuration object
 * @param {number} currentYear - Year being processed
 * @param {number} currentAge - Age in this year
 * @param {number} marketReturn - Market return rate for this year
 * @param {number} inflationRate - Inflation rate for this year
 * @returns {Object} { newState, yearResults }
 */
static _processYear(state, config, currentYear, currentAge, marketReturn, inflationRate) {
    // All calculation logic here
    // Returns updated state and results for this year
}
```

#### Step 2: Refactor `project()`
```javascript
static project(config, scenario) {
    const years = config.endYear - config.startYear + 1;
    const results = this._initializeResults(years);
    
    let state = this._initializeState(config);
    const rates = this._getRates(config, scenario);
    
    for (let i = 0; i < years; i++) {
        const currentYear = config.startYear + i;
        const currentAge = config.startAge + i;
        const marketReturn = rates.return;
        const inflationRate = rates.inflation;
        
        const { newState, yearResults } = this._processYear(
            state, config, currentYear, currentAge, marketReturn, inflationRate
        );
        
        state = newState;
        this._appendResults(results, yearResults, i);
    }
    
    return results;
}
```

#### Step 3: Refactor `_projectWithVariableReturns()`
```javascript
static _projectWithVariableReturns(config, scenario, returnSequence) {
    const years = config.endYear - config.startYear + 1;
    const results = this._initializeResults(years);
    
    let state = this._initializeState(config);
    const inflationRate = this._getInflationRate(config, scenario);
    
    for (let i = 0; i < years; i++) {
        const currentYear = config.startYear + i;
        const currentAge = config.startAge + i;
        const marketReturn = returnSequence[i] / 100; // Use variable return
        
        const { newState, yearResults } = this._processYear(
            state, config, currentYear, currentAge, marketReturn, inflationRate
        );
        
        state = newState;
        this._appendResults(results, yearResults, i);
    }
    
    return results;
}
```

### Files to Modify
- `src/engine/SimulationEngine.js`

### Testing Strategy
1. Run existing unit tests - all should pass
2. Add consistency test to verify refactored methods produce identical results
3. Manual verification in browser

### Success Criteria
- ✅ All 231 tests passing
- ✅ Code reduced from ~800 lines to ~500 lines
- ✅ Single source of truth for annual calculations
- ✅ No behavioral changes

### Estimated Effort: 4-6 hours

---

## Phase 2: Seeded Random Number Generator (Priority: MEDIUM)

### Goal
Replace `Math.random()` with seeded PRNG for reproducible Monte Carlo simulations.

### Current State
```javascript
// Line 479 of SimulationEngine.js
r = baseRate + ((Math.random() + Math.random() + ... - 3) / 3) * volatility;
```

### Proposed Solution

#### Step 1: Create SeededRandom Class
```javascript
/**
 * Mulberry32 Seeded Pseudo-Random Number Generator
 * Fast, high-quality PRNG suitable for Monte Carlo simulations
 */
class SeededRandom {
    constructor(seed = Date.now()) {
        this.seed = seed >>> 0; // Ensure 32-bit unsigned integer
    }
    
    /**
     * Generate next random number in [0, 1)
     */
    next() {
        this.seed = (this.seed + 0x6D2B79F5) | 0;
        let t = Math.imul(this.seed ^ (this.seed >>> 15), 1 | this.seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    
    /**
     * Generate Gaussian random number using Box-Muller transform
     */
    nextGaussian(mean = 0, stdDev = 1) {
        const u1 = this.next();
        const u2 = this.next();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return mean + z0 * stdDev;
    }
}
```

#### Step 2: Update SimulationEngine
```javascript
static runMonteCarlo(iterations = 1000, volatility = 0.15, spendMultiplier = 1.0, marketScenario = 'monte-carlo', seed = null) {
    const runs = [];
    const rng = new SeededRandom(seed); // Use provided seed or default to Date.now()
    
    for (let i = 0; i < iterations; i++) {
        runs.push(this.projectPath(config, volatility, spendMultiplier, marketScenario, rng));
    }
    // ... rest of method
}

static projectPath(config, volatility = 0.15, spendMultiplier = 1.0, marketScenario = 'monte-carlo', rng = null) {
    if (!rng) rng = new SeededRandom();
    
    // ...
    if (marketScenario === 'monte-carlo') {
        // Use rng.nextGaussian() instead of Math.random()
        r = baseRate + rng.nextGaussian(0, volatility);
    }
    // ...
}
```

#### Step 3: Add UI Control (Optional)
```html
<label>
    <span>Monte Carlo Seed (for reproducibility):</span>
    <input type="number" id="mcSeed" placeholder="Leave blank for random">
</label>
```

### Files to Modify
- `src/engine/SimulationEngine.js` (add SeededRandom class)
- `src/main.js` (pass seed from UI if provided)

### Testing Strategy
1. Verify same seed produces identical results across multiple runs
2. Verify different seeds produce different distributions
3. Verify unseeded runs still work (use Date.now() as default)

### Success Criteria
- ✅ Reproducible Monte Carlo results with same seed
- ✅ Statistical distribution unchanged
- ✅ All tests passing
- ✅ Backward compatible (seed optional)

### Estimated Effort: 2-3 hours

---

## Phase 3: Enhanced Test Coverage (Priority: MEDIUM)

### Goal
Add consistency and safety tests to catch regressions and edge cases.

### Test 1: Consistency Test
**File**: `tests/unit/Consistency.test.js`

```javascript
import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../../src/engine/SimulationEngine.js';
import { config } from '../../src/data/Config.js';

describe('Simulation Engine Consistency', () => {
    it('should produce identical results when volatility is 0', () => {
        const standardResult = SimulationEngine.project(config, 'average');
        const mcResult = SimulationEngine.projectPath(config, 0, 1.0, 'monte-carlo');
        
        // Compare net worth arrays
        for (let i = 0; i < standardResult.netWorth.length; i++) {
            expect(mcResult[i]).toBeCloseTo(standardResult.netWorth[i], 0);
        }
    });
    
    it('should match baseline when Roth conversions disabled', () => {
        const testConfig = JSON.parse(JSON.stringify(config));
        testConfig.settings.taxes.rothConversionEnabled = false;
        
        const result1 = SimulationEngine.project(testConfig, 'average');
        const result2 = SimulationEngine.project(config, 'average');
        
        // Baseline should have no Roth conversions
        const baseline = result2.baseline || result2;
        expect(baseline.rothConversions.amounts.every(a => a === 0)).toBe(true);
    });
});
```

### Test 2: NaN Safety Test
**File**: `tests/unit/NaNSafety.test.js`

```javascript
import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../../src/engine/SimulationEngine.js';

describe('NaN Safety', () => {
    it('should handle minimal config without NaN', () => {
        const minimalConfig = {
            startYear: 2026,
            endYear: 2071,
            startAge: 50,
            settings: {
                assets: {},
                income: {},
                expenses: {},
                taxSettings: { filingStatus: 'joint', state: 'none' }
            }
        };
        
        const result = SimulationEngine.project(minimalConfig, 'average');
        
        result.netWorth.forEach((nw, i) => {
            expect(isNaN(nw)).toBe(false);
            expect(isFinite(nw)).toBe(true);
        });
    });
    
    it('should handle missing nested properties', () => {
        const partialConfig = {
            startYear: 2026,
            endYear: 2071,
            startAge: 50,
            settings: {
                // Missing many nested properties
                taxSettings: { filingStatus: 'joint' }
            }
        };
        
        expect(() => {
            SimulationEngine.project(partialConfig, 'average');
        }).not.toThrow();
    });
});
```

### Test 3: Performance Benchmark
**File**: `tests/unit/Performance.test.js`

```javascript
import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../../src/engine/SimulationEngine.js';
import { config } from '../../src/data/Config.js';

describe('Performance Benchmarks', () => {
    it('should complete 1000 Monte Carlo iterations in under 3 seconds', () => {
        const start = performance.now();
        SimulationEngine.runMonteCarlo(1000, 0.15, 1.0, 'monte-carlo');
        const duration = performance.now() - start;
        
        expect(duration).toBeLessThan(3000);
        console.log(`Monte Carlo (1000 iterations): ${duration.toFixed(0)}ms`);
    });
    
    it('should complete single projection in under 50ms', () => {
        const start = performance.now();
        SimulationEngine.project(config, 'average');
        const duration = performance.now() - start;
        
        expect(duration).toBeLessThan(50);
        console.log(`Single projection: ${duration.toFixed(2)}ms`);
    });
});
```

### Files to Create
- `tests/unit/Consistency.test.js`
- `tests/unit/NaNSafety.test.js`
- `tests/unit/Performance.test.js`

### Success Criteria
- ✅ All new tests passing
- ✅ Consistency verified between engines
- ✅ NaN safety confirmed
- ✅ Performance benchmarks established

### Estimated Effort: 3-4 hours

---

## Phase 4: DevOps Improvements (Priority: LOW)

### Goal
Add standard development tooling for code quality.

### Task 1: Add ESLint Script
**File**: `package.json`

```json
{
  "scripts": {
    "lint": "eslint src tests --ext .js",
    "lint:fix": "eslint src tests --ext .js --fix"
  },
  "devDependencies": {
    "eslint": "^8.0.0"
  }
}
```

### Task 2: Add Pre-Commit Hooks
**File**: `.husky/pre-commit`

```bash
#!/bin/sh
npm run lint
npm test
```

### Task 3: Update Documentation
Update `README.md` with new scripts:

```markdown
## Development

### Running Tests
```bash
npm test              # Run all tests
npm run test:unit     # Unit tests only
npm run lint          # Check code quality
npm run lint:fix      # Auto-fix linting issues
```
```

### Estimated Effort: 1-2 hours

---

## Implementation Schedule

### Week 1: Core Improvements
- **Day 1-2**: Phase 1 - Code Deduplication (4-6 hours)
- **Day 3**: Phase 2 - Seeded PRNG (2-3 hours)

### Week 2: Testing & DevOps
- **Day 1**: Phase 3 - Enhanced Test Coverage (3-4 hours)
- **Day 2**: Phase 4 - DevOps Improvements (1-2 hours)
- **Day 3**: Documentation updates and final verification

---

## Risk Assessment

### Low Risk
- All changes are internal refactoring
- Comprehensive test suite catches regressions
- No user-facing changes (except optional seed input)

### Mitigation Strategies
1. Implement changes in feature branch
2. Run full test suite after each phase
3. Manual browser testing before merge
4. Deploy to staging before production

---

## Success Metrics

### Quantitative
- ✅ All 231+ tests passing
- ✅ Code reduced by ~300 lines
- ✅ Monte Carlo reproducibility: 100%
- ✅ Performance: No degradation

### Qualitative
- ✅ Improved code maintainability
- ✅ Better debugging capabilities
- ✅ Enhanced developer experience
- ✅ Future-proof architecture

---

## Post-Implementation

### Documentation Updates
1. Update `AUDIT_REPORT.md` with completion status
2. Update `TASKS.md` with completed items
3. Update `PROJECT_STATUS.md` with new capabilities
4. Create `/docs/guides/Monte_Carlo_Seeding.md` (if Phase 2 implemented)

### Deployment
1. Run `/build` workflow
2. Verify on staging
3. Deploy to production
4. Monitor for 24 hours

---

**Plan Created**: 2026-02-01 23:05 CST  
**Approved By**: [Pending User Approval]  
**Implementation Start**: [TBD]
