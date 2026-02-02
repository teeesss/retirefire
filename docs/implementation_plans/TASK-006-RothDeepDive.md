# Implementation Plan: TASK-006 - Roth Conversion Deep-Dive

**Task ID**: TASK-006  
**Epic**: Advanced Financial Planning Tools  
**Priority**: P1 (High-Value Enhancement)  
**Estimated Effort**: 8-12 hours  
**Created**: 2026-02-02

---

## 📋 Overview

### Objective
Implement a comprehensive Roth conversion analysis and optimization tool that provides users with:
- Full transparency into which accounts fund conversions
- Break-even analysis to determine optimal conversion timing
- Comparison tools to evaluate different conversion strategies
- Respect for both tax bracket limits and absolute dollar caps
- Detailed yearly breakdown of conversion impacts

### Related Issues
- **ISSUE-029**: Roth Conversion uses same amount per year - unclear where configured
- **ISSUE-030**: Roth Conversion doesn't show which account money comes from
- **ISSUE-031**: Roth Conversion needs break-even analysis
- **ISSUE-045**: Roth Conversion needs comparison feature
- **ISSUE-053**: Detailed Data Tables need Roth Conversion table
- **ISSUE-062**: Roth Strategy needs combined bracket + max amount caps

### Success Criteria
- [ ] Users can see exactly which account(s) fund each year's conversion
- [ ] Break-even age calculator shows when tax savings offset conversion costs
- [ ] Side-by-side comparison of different conversion strategies
- [ ] Conversion logic respects both tax bracket filling AND user-defined max amounts
- [ ] Detailed data table shows yearly conversion breakdown with tax impacts
- [ ] All existing tests continue to pass
- [ ] New feature has comprehensive test coverage

---

## 🏗️ Architecture & Design

### Component Structure

```
src/roth/
├── RothOptimizer.js         (Enhanced)
├── RothUI.js                (Enhanced)
├── RothDeepDive.js          (New)
└── RothMetricsCalculator.js (Enhanced)

src/charts/
└── RothCharts.js            (Enhanced)

src/ui/
└── DashboardDetails.js      (Enhanced)

tests/unit/
└── RothDeepDive.test.js     (New)
```

---

## 📐 Implementation Phases

### Phase 1: Account Source Transparency (3-4 hours)

**Files**: `RothOptimizer.js`, `SimulationEngine.js`, `DashboardDetails.js`

**Changes**:
- Track which accounts fund conversions
- Return: `{ amount, fromRetirement, fromInvestments, taxCost, year }`
- Display in data table

### Phase 2: Break-Even Analysis (2-3 hours)

**Files**: `RothMetricsCalculator.js`, `RothUI.js`

**Changes**:
- Calculate break-even age
- Display with color coding (Green < 20yr, Yellow 20-30yr, Red > 30yr)

### Phase 3: Comparison Feature (3-4 hours)

**Files**: `RothDeepDive.js` (NEW), `RothUI.js`, `RothCharts.js`

**Changes**:
- Compare multiple strategies side-by-side
- Visualize results in bar chart

### Phase 4: Combined Caps (1-2 hours)

**Files**: `RothOptimizer.js`, `RothUI.js`

**Changes**:
- Enforce min(bracketLimit, userMaxAmount)
- Display both limits in UI

### Phase 5: Data Table (1 hour)

**Files**: `DashboardDetails.js`

**Changes**:
- Add Roth Conversions table with 8 columns

---

## 🧪 Testing Strategy

- **Unit Tests**: 8-10 tests
- **Integration Tests**: 4-5 tests  
- **E2E Tests**: 2-3 tests

---

## 🚀 Implementation Order

1. Phase 1: Account Source (Day 1, 3-4 hrs)
2. Phase 4: Combined Caps (Day 1, 1-2 hrs)
3. Phase 2: Break-Even (Day 2, 2-3 hrs)
4. Phase 3: Comparison (Day 2-3, 3-4 hrs)
5. Phase 5: Data Table (Day 3, 1 hr)
6. Testing & Polish (Day 3, 2-3 hrs)

**Total**: 12-17 hours

---

**Ready to begin implementation?**
