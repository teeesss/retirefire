# Test Guide

**Last Updated**: 2026-01-24

---

## Quick Start

### Run Tests (No Server Required)

```bash
npm test
```

**Result**: 25/25 tests pass ✅ (Unit + Integration)  
**Time**: ~10 seconds

---

### Run Full Suite with E2E

**Terminal 1** - Start dev server:
```bash
npm run dev
```

**Terminal 2** - Run tests:
```bash
npm test                          # Unit + Integration
npm run test:e2e:comprehensive    # E2E comprehensive
npm run test:e2e:visual           # E2E visual
```

**Result**: 107/107 tests pass ✅  
**Time**: ~25 seconds

---

## Test Suite Overview

### ✅ Unit Tests: 16/16 (100%)

**Location**: `tests/unit/`

- **TaxCalculator.test.js** (7 tests)
  - Federal tax brackets (single, married, HOH)
  - FICA calculations with wage base limits
  - State taxes (FL, CA, NY, TX)
  - Capital gains tax

- **SimulationEngine.test.js** (4 tests)
  - Net worth projections
  - Home sale proceeds
  - Withdrawal strategies
  - Staged spending multipliers

- **Formatters.test.js** (5 tests)
  - Currency, percentage, compact numbers
  - Age and year formatting

---

### ✅ Integration Tests: 9/9 (100%)

**Location**: `tests/integration/`

- SimulationEngine + TaxCalculator integration
- Tax calculations across scenarios
- Account balance tracking
- Net worth aggregation
- Monte Carlo success rate

---

### ⏭️ E2E Tests: 82 Tests

**Location**: `tests/e2e/`

- **comprehensive.test.js** (36 tests)
  - Dashboard metrics
  - Chart rendering
  - Interactive controls
  - Navigation

- **descriptions-tooltips.test.js** (31 tests)
  - Section descriptions
  - Chart tooltips

- **visual.test.js** (15 tests)
  - Visual regression
  - Chart screenshots
  - Accessibility

**Note**: E2E tests skip when dev server not running (expected behavior)

---

## Test Commands

```bash
# Quick validation
npm test

# Watch mode (during development)
npm run test:watch

# E2E tests (requires dev server)
npm run test:e2e:comprehensive
npm run test:e2e:visual

# Full suite (auto-starts server)
npm run test:all

# Coverage report
npm run test:coverage
```

---

## Writing Tests

### Unit Test Example

```javascript
// tests/unit/MyFeature.test.js
import { describe, it, expect } from 'vitest';
import { myFeature } from '../../src/utils/myFeature.js';

describe('MyFeature', () => {
    it('should calculate correctly', () => {
        const result = myFeature(100);
        expect(result).toBe(200);
    });
});
```

### Integration Test Example

```javascript
// tests/integration/MyIntegration.test.js
import { describe, it, expect } from 'vitest';
import { ComponentA } from '../../src/ComponentA.js';
import { ComponentB } from '../../src/ComponentB.js';

describe('ComponentA + ComponentB', () => {
    it('should work together', () => {
        const a = new ComponentA();
        const b = new ComponentB(a);
        expect(b.result()).toBe(expected);
    });
});
```

### E2E Test Example

```javascript
// tests/e2e/my-feature.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer from 'puppeteer';

describe('E2E: My Feature', () => {
    let browser, page;
    
    beforeAll(async () => {
        browser = await puppeteer.launch({ headless: 'new' });
        page = await browser.newPage();
        await page.goto('http://localhost:5173');
    });
    
    afterAll(async () => {
        await browser.close();
    });
    
    it('should display feature', async () => {
        const element = await page.$('#myFeature');
        expect(element).toBeTruthy();
    });
});
```

---

## Test Quality Standards

### All Tests Must:
- ✅ Have descriptive names
- ✅ Be independent (no shared state)
- ✅ Clean up after themselves
- ✅ Run quickly (< 1 second per test)
- ✅ Be deterministic (no flaky tests)

### Test Coverage Goals:
- ✅ 100% of core calculation engines
- ✅ 100% of critical user workflows
- ✅ 80%+ overall code coverage

---

## Troubleshooting

### E2E Tests Skipping?

**Cause**: Dev server not running on localhost:5173

**Solution**:
```bash
# Terminal 1
npm run dev

# Terminal 2 (wait for server to start)
npm run test:e2e:comprehensive
```

### Tests Failing After Code Changes?

1. Run tests: `npm test`
2. Check error messages
3. Update test expectations if behavior changed
4. Fix code if tests caught a bug

### Slow Tests?

1. Check for unnecessary waits
2. Mock external dependencies
3. Use smaller test datasets
4. Run tests in parallel

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run build
      - run: npm run test:all
```

---

## Test Results

See `TEST_RESULTS.md` for latest test run results.

---

**Last Updated**: 2026-01-24  
**Test Framework**: Vitest 4.0.18 + Puppeteer 21.0.0  
**Node Version**: 18.0.0+
