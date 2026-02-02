# TASK-006 Phase 1: Account Source Transparency - Implementation Notes

## Current State Analysis

**Findings**:
1. ✅ `RothDeepDive.js` exists with modal UI and visualization
2. ✅ `RothOptimizer.js` has conversion calculation logic
3. ⚠️ `SimulationEngine.js` does NOT currently track Roth conversions
4. ⚠️ No account source tracking exists

## Implementation Strategy

### Step 1: Add Account Source Tracking to RothOptimizer
- Modify `findOptimalConversion()` to return source breakdown
- Add logic to determine which accounts fund conversions
- Priority: Traditional 401k/IRA first, then taxable if needed

### Step 2: Integrate into SimulationEngine
- Add Roth conversion processing to `_processYear()`
- Track conversion sources in year results
- Update account balances accordingly

### Step 3: Update RothDeepDive UI
- Add "Source Accounts" column to table
- Display breakdown: "401k: $X | Taxable: $Y"
- Update waterfall chart to show source split

### Step 4: Create Tests
- Unit tests for source tracking logic
- Integration tests with SimulationEngine
- Verify account balance updates

## Files to Modify

1. `src/roth/RothOptimizer.js` - Add source tracking
2. `src/engine/SimulationEngine.js` - Integrate conversions
3. `src/roth/RothDeepDive.js` - Display sources in UI
4. `tests/unit/RothDeepDive.test.js` - Create test suite

## Next Action

Begin with RothOptimizer enhancement to add account source tracking.
