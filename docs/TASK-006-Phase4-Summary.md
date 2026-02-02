# Implementation Plan Summary: TASK-006 Phase 4

**Generated**: 2026-02-02 12:24 PM  
**Plan Document**: `docs/implementation_plans/TASK-006-Phase4-Plan.md`

---

## 🎯 **What We're Building**

**Feature**: Combined Tax Bracket + Max Annual Amount Constraints for Roth Conversions

**User Story**: "I want to convert up to $50,000/year, but don't push me into the 32% tax bracket"

**Current Gap**: Optimizer respects EITHER bracket limits OR max amount, but not both intelligently

---

## 📊 **Implementation Breakdown**

### **5 Major Steps** (4-6 hours total)

| Step | Task | Effort | Files |
|------|------|--------|-------|
| **1** | Update core optimization logic | 1-2 hrs | `RothOptimizer.js` |
| **2** | Add UI controls for combined constraints | 1-2 hrs | `roth-deep-dive.html` |
| **3** | Update comparison view with limiting factors | 1 hr | `RothComparison.js` |
| **4** | Implement 2 TODOs (strategy details + sorting) | 1 hr | `RothComparison.js` |
| **5** | Write comprehensive test suite | 1 hr | `RothCombinedConstraints.test.js` |

---

## 🔑 **Key Technical Changes**

### **Before (Phase 3)**:
```javascript
conversionAmount = min(bracketRoom, balance)
```

### **After (Phase 4)**:
```javascript
conversionAmount = min(bracketRoom, maxAnnual, balance)
limitingFactor = which constraint won?
```

### **New Return Value**:
```javascript
{
    conversionAmount: 50000,
    constraints: {
        bracketRoom: 60000,      // Had $60k room
        maxAnnualCap: 50000,     // User capped at $50k
        effectiveLimit: 50000,   // Used $50k
        limitingFactor: 'maxAnnual' // Max annual was the constraint
    }
}
```

---

## 🎨 **UI Enhancements**

### **New Control**:
```
┌─────────────────────────────────────┐
│ Max Annual Conversion               │
│ ┌─────────────────────────────────┐ │
│ │ $  [50,000]          /year      │ │
│ └─────────────────────────────────┘ │
│ Leave blank to convert up to        │
│ bracket limit                       │
└─────────────────────────────────────┘
```

### **Strategy Explanation** (auto-updates):
```
Strategy: Convert up to $50,000 or 24% bracket limit (whichever is less) per year
Capped at $50,000/year, but won't exceed 24% bracket
```

### **Comparison Table** (shows limiting factor):
```
┌──────────────┬─────────────┬──────────┐
│ Amount/Year  │ Net Worth   │ Score    │
├──────────────┼─────────────┼──────────┤
│ $50k/year ⭐ │ $2.4M 🏆    │ 92/100   │
│ 💰 Cap       │             │          │
├──────────────┼─────────────┼──────────┤
│ $60k/year    │ $2.3M       │ 88/100   │
│ 📊 Bracket   │             │          │
└──────────────┴─────────────┴──────────┘
```

---

## ✅ **Test Coverage**

**6 Test Cases**:
1. ✅ No max annual → use bracket limit
2. ✅ Max annual < bracket → use max annual
3. ✅ Max annual > bracket → use bracket
4. ✅ Insufficient balance → use balance
5. ✅ Minimum threshold → skip if below
6. ✅ Constraint tracking → all values present

---

## 🐛 **Bugs Fixed**

### **TODO #1** (line 254): Load Strategy Details
- **Before**: Clicking "View Details" did nothing
- **After**: Switches to detailed view and loads year-by-year data

### **TODO #2** (line 260): Table Sorting
- **Before**: Column headers not clickable
- **After**: Click any header to sort (amount, net worth, tax, score, etc.)

---

## 📈 **Impact**

### **User Benefits**:
- 🎯 More control over conversion strategy
- 💰 Prevent accidentally converting too much
- 📊 Stay within desired tax bracket
- 🔍 See which constraint is limiting each year

### **Technical Benefits**:
- ✅ Resolves ISSUE-062
- ✅ Completes 2 code TODOs
- ✅ Adds robust test coverage
- ✅ Improves UX with clear explanations

---

## 🚀 **Next Actions**

### **Option 1: Implement Now** (4-6 hours)
Follow the detailed plan in `TASK-006-Phase4-Plan.md`

### **Option 2: Implement Later**
Move to Phase 5 (Enhanced Yearly Breakdown Table) or tackle TASK-014 (Gap Years Fix)

### **Option 3: Review & Refine**
Review the plan, suggest changes, then implement

---

## 📚 **Related Documents**

- **Full Plan**: `docs/implementation_plans/TASK-006-Phase4-Plan.md`
- **Previous Phases**: `docs/implementation_plans/TASK-006-Phase1-3-*.md`
- **Task List**: `TASKS.md` (lines 55-74)
- **Issues**: `ISSUES.md` (ISSUE-062)

---

**Status**: ✅ Plan complete, ready for implementation  
**Estimated Completion**: 4-6 hours of focused work  
**Priority**: HIGH (completes user-requested feature to 80%)
