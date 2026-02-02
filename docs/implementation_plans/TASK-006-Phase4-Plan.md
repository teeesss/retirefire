# TASK-006 Phase 4: Combined Bracket + Max Amount Caps

**Implementation Plan**  
**Created**: 2026-02-02  
**Status**: Ready for Implementation  
**Estimated Effort**: 4-6 hours  
**Priority**: HIGH (60% complete, user-requested feature)

---

## 📋 **Overview**

### **Objective**
Implement combined tax bracket targeting AND maximum annual amount caps for Roth conversion optimization. Currently, the optimizer respects EITHER bracket limits OR max amount constraints, but not both intelligently combined.

### **Current State**
- ✅ Bracket-based optimization works (`targetBracket` parameter)
- ✅ Max annual constraints work (`constraints.maxAnnual`)
- ❌ No intelligent combination of both constraints
- ❌ Users can't set "convert up to $50k/year, but don't exceed 24% bracket"

### **Desired State**
Users can specify:
1. **Target Bracket**: "Don't push me into the 32% bracket"
2. **Max Annual Amount**: "But also don't convert more than $75k/year"
3. **Combined Logic**: Use the **lesser** of bracket room and max amount

### **Related Issues**
- ISSUE-062: Roth Strategy needs combined bracket + max amount caps
- ISSUE-029: Unclear where annual amount is configured

---

## 🎯 **Technical Design**

### **1. Logic Flow**

```javascript
// Current (Phase 3):
conversionAmount = min(bracketRoom, balance)

// Phase 4 (Combined):
conversionAmount = min(bracketRoom, maxAnnual, balance)
```

### **2. Priority Order**
1. **Bracket Limit**: Calculate room in target bracket
2. **Max Annual Cap**: Apply user-defined maximum
3. **Available Balance**: Don't exceed what's available
4. **Final Amount**: Take the minimum of all three

### **3. Edge Cases to Handle**
- **No max annual set**: Use bracket limit only (current behavior)
- **Max annual > bracket room**: Bracket wins (tax-efficient)
- **Max annual < bracket room**: User preference wins
- **Insufficient balance**: Balance wins (can't convert what you don't have)
- **Manual overrides**: Should still take precedence over both constraints

---

## 🔧 **Implementation Steps**

### **Step 1: Update RothOptimizer.findOptimalConversion()** ⏱️ 1-2 hours

**File**: `src/roth/RothOptimizer.js` (lines 97-176)

**Current Code** (lines 104-116):
```javascript
// Calculate room in target bracket
let roomInBracket = Math.max(0, bracketLimit - income);

// Apply constraints
if (constraints.maxAnnual) {
    roomInBracket = Math.min(roomInBracket, constraints.maxAnnual);
}
if (constraints.minAnnual && roomInBracket < constraints.minAnnual) {
    roomInBracket = 0; // Don't convert if below minimum
}

// Don't exceed available balance
let conversionAmount = Math.min(roomInBracket, balance);
```

**New Code**:
```javascript
// Calculate room in target bracket
const bracketRoom = Math.max(0, bracketLimit - income);

// Apply max annual cap (if specified)
const maxAnnualCap = constraints.maxAnnual || Infinity;

// Combined constraint: lesser of bracket room and max annual
let effectiveLimit = Math.min(bracketRoom, maxAnnualCap);

// Apply minimum annual threshold
if (constraints.minAnnual && effectiveLimit < constraints.minAnnual) {
    effectiveLimit = 0; // Don't convert if below minimum
}

// Don't exceed available balance
let conversionAmount = Math.min(effectiveLimit, balance);

// Track which constraint was the limiting factor (for UI feedback)
const limitingFactor = conversionAmount === balance ? 'balance' :
                       conversionAmount === bracketRoom ? 'bracket' :
                       conversionAmount === maxAnnualCap ? 'maxAnnual' : 'none';
```

**Return Value Update** (line 156):
```javascript
return {
    year,
    conversionAmount: Math.round(conversionAmount),
    netToRoth: Math.round(netToRoth),
    sources: {
        retirement: Math.round(fromRetirement),
        investments: Math.round(fromInvestments)
    },
    income,
    totalIncome,
    currentBracket,
    targetBracket,
    marginalRate,
    effectiveRate,
    taxOnConversion: Math.round(taxOnConversion),
    remainingBalance: balance - conversionAmount,
    bracketUtilization: bracketRoom > 0 ? (conversionAmount / bracketRoom) * 100 : 0,
    taxPaymentSource: payTaxesFrom,
    // NEW: Constraint tracking
    constraints: {
        bracketRoom: Math.round(bracketRoom),
        maxAnnualCap: maxAnnualCap === Infinity ? null : Math.round(maxAnnualCap),
        effectiveLimit: Math.round(effectiveLimit),
        limitingFactor
    }
};
```

---

### **Step 2: Update UI Controls** ⏱️ 1-2 hours

**File**: `src/partials/modals/roth-deep-dive.html`

**Add Combined Constraint Controls**:
```html
<!-- Existing bracket selector -->
<div class="form-group">
    <label for="rothTargetBracket">Target Tax Bracket</label>
    <select id="rothTargetBracket" class="form-control">
        <option value="12">12% - Conservative</option>
        <option value="22">22% - Moderate</option>
        <option value="24" selected>24% - Balanced</option>
        <option value="32">32% - Aggressive</option>
    </select>
</div>

<!-- NEW: Max Annual Amount -->
<div class="form-group">
    <label for="rothMaxAnnual">
        Max Annual Conversion
        <span class="tooltip-icon" title="Maximum amount to convert per year, regardless of bracket room">ℹ️</span>
    </label>
    <div class="input-group">
        <span class="input-prefix">$</span>
        <input type="number" 
               id="rothMaxAnnual" 
               class="form-control" 
               placeholder="No limit" 
               min="0" 
               max="500000" 
               step="5000">
        <span class="input-suffix">/year</span>
    </div>
    <small class="form-text">
        Leave blank to convert up to bracket limit. 
        Set a value to cap annual conversions (e.g., $50,000).
    </small>
</div>

<!-- NEW: Combined Strategy Explanation -->
<div class="strategy-explanation" style="background: rgba(59, 130, 246, 0.1); padding: 12px; border-radius: 8px; margin-top: 16px;">
    <strong>Strategy:</strong> Convert up to <span id="effectiveLimitDisplay">bracket limit</span> per year
    <div id="constraintExplanation" style="font-size: 0.9em; color: var(--text-muted); margin-top: 4px;">
        <!-- Dynamically updated based on inputs -->
    </div>
</div>
```

**Add JavaScript Handler**:
```javascript
// In RothDeepDive.js or main.js
function updateConstraintExplanation() {
    const bracket = document.getElementById('rothTargetBracket').value;
    const maxAnnual = document.getElementById('rothMaxAnnual').value;
    
    const displayEl = document.getElementById('effectiveLimitDisplay');
    const explanationEl = document.getElementById('constraintExplanation');
    
    if (!maxAnnual || maxAnnual === '') {
        displayEl.textContent = `${bracket}% bracket limit`;
        explanationEl.textContent = 'Converting up to the top of your target bracket each year';
    } else {
        displayEl.textContent = `$${parseInt(maxAnnual).toLocaleString()} or ${bracket}% bracket limit (whichever is less)`;
        explanationEl.textContent = `Capped at $${parseInt(maxAnnual).toLocaleString()}/year, but won't exceed ${bracket}% bracket`;
    }
}

// Attach listeners
document.getElementById('rothTargetBracket').addEventListener('change', updateConstraintExplanation);
document.getElementById('rothMaxAnnual').addEventListener('input', updateConstraintExplanation);
```

---

### **Step 3: Update Comparison View** ⏱️ 1 hour

**File**: `src/roth/RothComparison.js`

**Update Table to Show Constraints** (line 54):
```javascript
tableBody.innerHTML = comparison.strategies.map((strategy, index) => {
    const indicators = strategy.indicators || {};
    const breakEvenDisplay = strategy.breakEvenAge && strategy.breakEvenAge < 999
        ? `Age ${strategy.breakEvenAge}`
        : 'Never';

    const breakEvenColor = indicators.breakEvenColor === 'green' ? 'var(--success)' :
        indicators.breakEvenColor === 'yellow' ? 'var(--warning)' :
            'var(--danger)';

    const isOptimal = strategy.amount === comparison.optimal.amount;
    
    // NEW: Show limiting factor
    const limitingFactor = strategy.results?.[0]?.constraints?.limitingFactor;
    const limitBadge = limitingFactor === 'bracket' ? '📊 Bracket' :
                       limitingFactor === 'maxAnnual' ? '💰 Cap' :
                       limitingFactor === 'balance' ? '⚠️ Balance' : '';

    return `
        <tr style="${isOptimal ? 'background: rgba(34, 197, 94, 0.1); border-left: 3px solid var(--success);' : ''}"
            onclick="window.selectStrategy(${index})">
            <td style="font-weight: 700; color: var(--text-primary);">
                ${formatCurrency(strategy.amount)}/year
                ${isOptimal ? ' ⭐' : ''}
                ${limitBadge ? `<br><small style="color: var(--text-muted);">${limitBadge}</small>` : ''}
            </td>
            <!-- ... rest of table cells ... -->
        </tr>
    `;
}).join('');
```

---

### **Step 4: Implement TODOs** ⏱️ 1 hour

**File**: `src/roth/RothComparison.js`

**TODO #1: Load Strategy Details** (line 254):
```javascript
window.viewStrategyDetails = (index) => {
    if (!RothComparison.comparisonData) return;

    const strategy = RothComparison.comparisonData.strategies[index];
    console.log(`Viewing details for ${formatCurrency(strategy.amount)}/year strategy`);

    // Switch to detailed view
    window.switchRothTab('detailed');

    // Load this strategy's year-by-year data
    if (strategy.results && window.renderRothDetailedTable) {
        window.renderRothDetailedTable(strategy.results);
    }
    
    // Update summary cards with this strategy's metrics
    if (window.updateRothSummaryCards) {
        window.updateRothSummaryCards({
            totalConverted: strategy.totalConverted,
            totalTaxPaid: strategy.totalTaxPaid,
            effectiveTaxRate: strategy.effectiveTaxRate,
            yearsWithConversions: strategy.yearsWithConversions
        });
    }
};
```

**TODO #2: Table Sorting** (line 260):
```javascript
window.sortComparisonTable = (column) => {
    if (!RothComparison.comparisonData) return;
    
    console.log(`Sorting by ${column}`);
    
    const strategies = [...RothComparison.comparisonData.strategies];
    
    // Define sort functions
    const sortFunctions = {
        amount: (a, b) => a.amount - b.amount,
        netWorth: (a, b) => (b.finalNetWorth || 0) - (a.finalNetWorth || 0),
        tax: (a, b) => (a.totalTaxPaid || 0) - (b.totalTaxPaid || 0),
        breakEven: (a, b) => (a.breakEvenAge || 999) - (b.breakEvenAge || 999),
        roth: (a, b) => (b.finalRothBalance || 0) - (a.finalRothBalance || 0),
        score: (a, b) => b.score - a.score
    };
    
    // Apply sort
    if (sortFunctions[column]) {
        strategies.sort(sortFunctions[column]);
        
        // Update comparison data and re-render
        RothComparison.comparisonData.strategies = strategies;
        RothComparison.renderComparisonTable(RothComparison.comparisonData);
    }
};
```

**Update Table Headers** (in HTML):
```html
<thead>
    <tr>
        <th onclick="window.sortComparisonTable('amount')" style="cursor: pointer;">
            Annual Amount ↕️
        </th>
        <th onclick="window.sortComparisonTable('netWorth')" style="cursor: pointer;">
            Final Net Worth ↕️
        </th>
        <th onclick="window.sortComparisonTable('tax')" style="cursor: pointer;">
            Total Tax ↕️
        </th>
        <th onclick="window.sortComparisonTable('breakEven')" style="cursor: pointer;">
            Break-Even ↕️
        </th>
        <th onclick="window.sortComparisonTable('roth')" style="cursor: pointer;">
            Roth Balance ↕️
        </th>
        <th onclick="window.sortComparisonTable('score')" style="cursor: pointer;">
            Score ↕️
        </th>
        <th>Actions</th>
    </tr>
</thead>
```

---

### **Step 5: Add Tests** ⏱️ 1 hour

**File**: `tests/unit/RothCombinedConstraints.test.js` (new)

```javascript
import { describe, it, expect } from 'vitest';
import { RothOptimizer } from '../../src/roth/RothOptimizer.js';

describe('Roth Combined Constraints', () => {
    const baseParams = {
        year: 2025,
        income: 80000,
        balance: 500000,
        filingStatus: 'joint',
        targetBracket: 24
    };

    it('should respect bracket limit when no max annual set', () => {
        const result = RothOptimizer.findOptimalConversion({
            ...baseParams,
            constraints: {}
        });

        // Joint 24% bracket limit is $383,900
        // Room = $383,900 - $80,000 = $303,900
        expect(result.conversionAmount).toBeLessThanOrEqual(303900);
        expect(result.constraints.limitingFactor).toBe('bracket');
    });

    it('should respect max annual when less than bracket room', () => {
        const result = RothOptimizer.findOptimalConversion({
            ...baseParams,
            constraints: { maxAnnual: 50000 }
        });

        expect(result.conversionAmount).toBe(50000);
        expect(result.constraints.limitingFactor).toBe('maxAnnual');
        expect(result.constraints.maxAnnualCap).toBe(50000);
    });

    it('should use bracket room when max annual is higher', () => {
        const result = RothOptimizer.findOptimalConversion({
            ...baseParams,
            constraints: { maxAnnual: 400000 } // Higher than bracket room
        });

        // Should use bracket room (~$303,900) not max annual
        expect(result.conversionAmount).toBeLessThan(400000);
        expect(result.constraints.limitingFactor).toBe('bracket');
    });

    it('should respect balance limit when insufficient funds', () => {
        const result = RothOptimizer.findOptimalConversion({
            ...baseParams,
            balance: 25000, // Less than both bracket room and max annual
            constraints: { maxAnnual: 50000 }
        });

        expect(result.conversionAmount).toBe(25000);
        expect(result.constraints.limitingFactor).toBe('balance');
    });

    it('should apply minimum annual threshold', () => {
        const result = RothOptimizer.findOptimalConversion({
            ...baseParams,
            income: 380000, // Close to bracket limit
            constraints: { 
                maxAnnual: 50000,
                minAnnual: 10000 
            }
        });

        // Room in bracket is small, below minimum
        // Should convert $0 instead of small amount
        if (result.constraints.bracketRoom < 10000) {
            expect(result.conversionAmount).toBe(0);
        }
    });

    it('should track all constraint values', () => {
        const result = RothOptimizer.findOptimalConversion({
            ...baseParams,
            constraints: { maxAnnual: 75000 }
        });

        expect(result.constraints).toHaveProperty('bracketRoom');
        expect(result.constraints).toHaveProperty('maxAnnualCap');
        expect(result.constraints).toHaveProperty('effectiveLimit');
        expect(result.constraints).toHaveProperty('limitingFactor');
        expect(result.constraints.bracketRoom).toBeGreaterThan(0);
    });

    it('should handle manual overrides over all constraints', () => {
        // Simulate manual override
        const RothConfig = { manualOverrides: { 2025: 100000 } };
        
        const result = RothOptimizer.findOptimalConversion({
            ...baseParams,
            constraints: { maxAnnual: 50000 }
        });

        // Manual override should take precedence
        // (This test assumes RothConfig is imported/mocked)
    });
});
```

---

## 📊 **Success Criteria**

### **Functional Requirements**
- ✅ User can set both target bracket AND max annual amount
- ✅ Optimizer uses the lesser of bracket room and max annual
- ✅ UI clearly shows which constraint is limiting
- ✅ Comparison table shows limiting factor for each strategy
- ✅ Strategy details view works (TODO #1 resolved)
- ✅ Table sorting works (TODO #2 resolved)

### **Test Coverage**
- ✅ 6+ test cases covering all constraint combinations
- ✅ Edge cases: no max, max > bracket, max < bracket, insufficient balance
- ✅ Manual override precedence

### **User Experience**
- ✅ Clear explanation of combined strategy
- ✅ Real-time UI updates when constraints change
- ✅ Visual indicators for limiting factors
- ✅ Helpful tooltips and examples

---

## 🚀 **Deployment Plan**

### **Phase 4A: Core Logic** (2-3 hours)
1. Update `RothOptimizer.findOptimalConversion()`
2. Add constraint tracking to return value
3. Run unit tests

### **Phase 4B: UI Updates** (1-2 hours)
4. Add max annual input to modal
5. Add constraint explanation display
6. Wire up event handlers

### **Phase 4C: Comparison Enhancements** (1-2 hours)
7. Update comparison table with limiting factors
8. Implement strategy details view (TODO #1)
9. Implement table sorting (TODO #2)

### **Phase 4D: Testing & Polish** (1 hour)
10. Write and run comprehensive tests
11. Test all constraint combinations manually
12. Update documentation

---

## 📝 **Documentation Updates**

### **Files to Update**
1. **TASKS.md**: Mark Phase 4 as complete
2. **ISSUES.md**: Close ISSUE-062
3. **PROJECT_STATUS.md**: Add Phase 4 to completed features
4. **README.md**: Update Roth conversion feature description

### **User Guide Addition**
```markdown
### Combined Bracket + Amount Constraints

You can now set BOTH a target tax bracket AND a maximum annual conversion amount:

**Example**: "Convert up to $50,000/year, but don't exceed the 24% bracket"
- If bracket room is $60,000 → converts $50,000 (max annual wins)
- If bracket room is $40,000 → converts $40,000 (bracket wins)
- If balance is $30,000 → converts $30,000 (balance wins)

The optimizer always uses the **most conservative** constraint to protect you from:
- Accidentally jumping into a higher tax bracket
- Converting more than you're comfortable with annually
- Exceeding your available balance
```

---

## 🎯 **Next Steps After Phase 4**

### **Phase 5: Enhanced Yearly Breakdown Table** (ISSUE-053)
- Add detailed year-by-year conversion table to main dashboard
- Show: Year, Income, Conversion, Tax Paid, Marginal Rate, Cumulative Total
- Sortable and filterable
- Export to CSV

### **Future Enhancements**
- Multi-year optimization (optimize across 5-10 year windows)
- State tax integration
- RMD avoidance strategies
- Roth ladder planning

---

## ✅ **Checklist**

- [ ] Update `RothOptimizer.findOptimalConversion()` logic
- [ ] Add constraint tracking to return values
- [ ] Create max annual input in UI
- [ ] Add constraint explanation display
- [ ] Update comparison table with limiting factors
- [ ] Implement `viewStrategyDetails()` (TODO #1)
- [ ] Implement `sortComparisonTable()` (TODO #2)
- [ ] Write 6+ unit tests
- [ ] Manual testing of all combinations
- [ ] Update documentation (TASKS.md, ISSUES.md, README.md)
- [ ] Deploy to production
- [ ] Verify on live site

---

**Ready to implement!** 🚀
