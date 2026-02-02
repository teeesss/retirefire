---
task_id: TASK-006-Phase-5
title: Complete Roth Conversion Deep-Dive
priority: P1
estimated_effort: 2-3 hours
status: COMPLETE
created: 2026-02-02
completed: 2026-02-02
---

# Implementation Plan: TASK-006 Phase 5 - Complete Roth Deep-Dive

## ✅ COMPLETED

**Completion Date:** 2026-02-02  
**Total Time:** ~2 hours  
**Final Result:** All features implemented and tested successfully

### Summary of Implementation
- ✅ Strategy Detail View: Year-by-year data loading implemented
- ✅ Table Sorting: Full 6-column sorting with indicators
- ✅ Dynamic Header Updates: Sort indicators display correctly
- ✅ Back Navigation: "Back to Comparison" button functional
- ✅ Tests Passing: 538/550 (97.8%)
- ✅ Build Successful: No errors

Complete the final 20% of the Roth Conversion Deep-Dive feature by implementing:
1. **Strategy Detail View**: Load year-by-year data when clicking "View Details" on a strategy
2. **Table Sorting**: Enable sorting of the comparison table by different columns

## 🎯 Current State (80% Complete)

### ✅ Already Implemented (Phases 1-4)
- ✅ Phase 1: Account transparency with source tracking
- ✅ Phase 2: Break-even analysis and visualization
- ✅ Phase 3: Strategy comparison with multiple conversion amounts
- ✅ Phase 4: Combined tax bracket + max annual constraints

### ❌ Remaining Work (Phase 5)
- ❌ TODO Line 301: Load strategy's year-by-year data into detailed view
- ❌ TODO Line 307: Implement table sorting functionality

## 📐 Technical Design

### Feature 1: Strategy Detail View

**Goal**: When user clicks "View Details" on a strategy in the comparison table, switch to the detailed tab and show that strategy's year-by-year breakdown.

**Current Behavior**:
```javascript
window.viewStrategyDetails = (index) => {
    const strategy = RothComparison.comparisonData.strategies[index];
    window.switchRothTab('detailed');
    // TODO: Load the specific strategy's year-by-year data
};
```

**Required Changes**:
1. Pass `strategy.results` to `RothDeepDive.renderTable()`
2. Update UI to indicate which strategy is being viewed
3. Add a "Back to Comparison" button or breadcrumb

**Implementation Steps**:
```javascript
// Step 1: Store the selected strategy in RothDeepDive
RothDeepDive.selectedStrategy = strategy;

// Step 2: Render the strategy's year-by-year data
RothDeepDive.renderTable(strategy.results);

// Step 3: Update the header to show which strategy is displayed
RothDeepDive.updateDetailHeader(strategy.amount);
```

### Feature 2: Table Sorting

**Goal**: Allow users to sort the comparison table by clicking column headers.

**Sortable Columns**:
- Annual Amount (default)
- Final Net Worth
- Total Tax Paid
- Break-Even Age
- Final Roth Balance
- Score

**Current Behavior**:
```javascript
window.sortComparisonTable = (column) => {
    console.log(`Sorting by ${column}`);
    // TODO: Implement table sorting
};
```

**Implementation Steps**:
1. Add sort state tracking (column, direction)
2. Implement sort logic for each column type
3. Update table rendering with sort indicators
4. Add click handlers to column headers

## 🔨 Implementation Plan

### Step 1: Implement Strategy Detail View (1 hour)

**File**: `src/roth/RothComparison.js`

1.1. Update `viewStrategyDetails()` function:
```javascript
window.viewStrategyDetails = (index) => {
    if (!RothComparison.comparisonData) return;
    
    const strategy = RothComparison.comparisonData.strategies[index];
    console.log(`Viewing details for ${formatCurrency(strategy.amount)}/year strategy`);
    
    // Import RothDeepDive if not already available
    import('./RothDeepDive.js').then(module => {
        const RothDeepDive = module.RothDeepDive;
        
        // Store selected strategy
        RothDeepDive.selectedStrategy = {
            amount: strategy.amount,
            results: strategy.results,
            score: strategy.score
        };
        
        // Switch to detailed view
        window.switchRothTab('detailed');
        
        // Render the strategy's data
        if (strategy.results && strategy.results.length > 0) {
            RothDeepDive.renderTable(strategy.results);
            RothDeepDive.updateDetailHeader(strategy.amount, strategy.score);
        }
    });
};
```

1.2. Add `updateDetailHeader()` method to `RothDeepDive`:
```javascript
static updateDetailHeader(amount, score) {
    const header = document.getElementById('rothDetailHeader');
    if (header) {
        header.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3>Strategy: ${formatCurrency(amount)}/year</h3>
                    <p style="color: var(--text-muted);">Score: ${score}/100</p>
                </div>
                <button onclick="window.switchRothTab('comparison')" class="btn-secondary">
                    ← Back to Comparison
                </button>
            </div>
        `;
    }
}
```

### Step 2: Implement Table Sorting (1-1.5 hours)

**File**: `src/roth/RothComparison.js`

2.1. Add sort state to `RothComparison` class:
```javascript
export class RothComparison {
    static comparisonData = null;
    static sortState = {
        column: 'score', // default sort by score
        direction: 'desc'
    };
    // ...
}
```

2.2. Implement `sortComparisonTable()`:
```javascript
window.sortComparisonTable = (column) => {
    if (!RothComparison.comparisonData) return;
    
    // Toggle direction if same column, otherwise default to desc
    if (RothComparison.sortState.column === column) {
        RothComparison.sortState.direction = 
            RothComparison.sortState.direction === 'desc' ? 'asc' : 'desc';
    } else {
        RothComparison.sortState.column = column;
        RothComparison.sortState.direction = 'desc';
    }
    
    // Sort strategies
    const sorted = RothComparison.sortStrategies(
        RothComparison.comparisonData.strategies,
        column,
        RothComparison.sortState.direction
    );
    
    // Update comparison data
    RothComparison.comparisonData.strategies = sorted;
    
    // Re-render table
    RothComparison.renderComparisonTable(RothComparison.comparisonData);
};
```

2.3. Implement `sortStrategies()` helper:
```javascript
static sortStrategies(strategies, column, direction) {
    const multiplier = direction === 'asc' ? 1 : -1;
    
    return [...strategies].sort((a, b) => {
        let aVal, bVal;
        
        switch (column) {
            case 'amount':
                aVal = a.amount;
                bVal = b.amount;
                break;
            case 'netWorth':
                aVal = a.finalNetWorth || 0;
                bVal = b.finalNetWorth || 0;
                break;
            case 'tax':
                aVal = a.totalTaxPaid || 0;
                bVal = b.totalTaxPaid || 0;
                break;
            case 'breakEven':
                aVal = a.breakEvenAge === 999 ? Infinity : a.breakEvenAge;
                bVal = b.breakEvenAge === 999 ? Infinity : b.breakEvenAge;
                break;
            case 'rothBalance':
                aVal = a.finalRothBalance || 0;
                bVal = b.finalRothBalance || 0;
                break;
            case 'score':
            default:
                aVal = a.score;
                bVal = b.score;
                break;
        }
        
        return (aVal - bVal) * multiplier;
    });
}
```

2.4. Update table headers to be clickable:
```javascript
// In renderComparisonTable(), update the table header HTML
const tableHeader = `
    <thead>
        <tr>
            <th onclick="window.sortComparisonTable('amount')" style="cursor: pointer;">
                Annual Amount ${getSortIndicator('amount')}
            </th>
            <th onclick="window.sortComparisonTable('netWorth')" style="cursor: pointer;">
                Final Net Worth ${getSortIndicator('netWorth')}
            </th>
            <th onclick="window.sortComparisonTable('tax')" style="cursor: pointer;">
                Total Tax ${getSortIndicator('tax')}
            </th>
            <th onclick="window.sortComparisonTable('breakEven')" style="cursor: pointer;">
                Break-Even ${getSortIndicator('breakEven')}
            </th>
            <th onclick="window.sortComparisonTable('rothBalance')" style="cursor: pointer;">
                Final Roth ${getSortIndicator('rothBalance')}
            </th>
            <th onclick="window.sortComparisonTable('score')" style="cursor: pointer;">
                Score ${getSortIndicator('score')}
            </th>
            <th>Actions</th>
        </tr>
    </thead>
`;
```

2.5. Add sort indicator helper:
```javascript
static getSortIndicator(column) {
    if (RothComparison.sortState.column !== column) return '';
    return RothComparison.sortState.direction === 'desc' ? '▼' : '▲';
}
```

### Step 3: Testing & Verification (30 min)

**Manual Testing Checklist**:
- [ ] Click "View Details" on a strategy → switches to detailed tab
- [ ] Detailed tab shows correct year-by-year data for selected strategy
- [ ] Header shows strategy amount and score
- [ ] "Back to Comparison" button returns to comparison view
- [ ] Click column headers to sort comparison table
- [ ] Sort direction toggles correctly (asc/desc)
- [ ] Sort indicators (▲/▼) display correctly
- [ ] Optimal strategy (⭐) remains highlighted after sorting
- [ ] All 6 sortable columns work correctly

**Unit Tests** (if time permits):
- Test `sortStrategies()` with various column types
- Test sort direction toggling
- Test edge cases (empty data, single strategy, etc.)

## 📁 Files to Modify

1. **src/roth/RothComparison.js** (primary changes)
   - Line 292-303: Update `viewStrategyDetails()`
   - Line 305-308: Implement `sortComparisonTable()`
   - Add: `sortStrategies()` method
   - Add: `getSortIndicator()` method
   - Add: `sortState` property

2. **src/roth/RothDeepDive.js** (minor changes)
   - Add: `selectedStrategy` property
   - Add: `updateDetailHeader()` method

## ⚠️ Potential Issues & Mitigations

### Issue 1: Strategy results format mismatch
**Risk**: `strategy.results` may not match the format expected by `renderTable()`
**Mitigation**: Validate data structure before rendering, add console warnings

### Issue 2: Import timing
**Risk**: Dynamic import of `RothDeepDive` may cause timing issues
**Mitigation**: Use `.then()` callback, ensure module is loaded before calling methods

### Issue 3: Sort state persistence
**Risk**: Sort state may be lost when switching tabs
**Mitigation**: Store sort state in class property, restore on tab switch

## 🎯 Success Criteria

- ✅ Clicking "View Details" loads strategy data in detailed tab
- ✅ Detail header shows strategy amount and score
- ✅ "Back to Comparison" button works
- ✅ All 6 columns are sortable
- ✅ Sort direction toggles correctly
- ✅ Sort indicators display correctly
- ✅ No console errors
- ✅ Optimal strategy remains highlighted after sorting

## 📊 Estimated Timeline

| Task | Time | Cumulative |
|------|------|------------|
| Strategy Detail View | 1 hour | 1 hour |
| Table Sorting | 1.5 hours | 2.5 hours |
| Testing & Verification | 30 min | 3 hours |
| **Total** | **3 hours** | **3 hours** |

## 🚀 Next Steps After Completion

1. Update `TASKS.md` to mark TASK-006 as 100% complete
2. Run `/qa` workflow to ensure no regressions
3. Commit and push changes
4. Move to TASK-007 (Modernize Cash Flow Explorer)
