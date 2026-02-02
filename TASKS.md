# Tasks

**Last Updated**: 2026-02-02 1:13 PM  
**Status**: Workflow Infrastructure Complete ✅ | Tests: 544/548 Passing (99.3%)
**Total Pending**: 30 tasks across 4 priority levels

---

## 🔴 Priority 0: Critical Issues (BLOCKERS)

**Status**: ✅ **No critical issues**

All critical security and logic issues have been resolved:
- ✅ CRIT-001: LocalStorage encryption (AES-256)
- ✅ CRIT-002: Content Security Policy headers
- ✅ LOGIC-001: SafeMath NaN validation
- ✅ LOGIC-002: Auto-save race condition

---

## 🟡 Priority 1: High-Value Enhancements (ACTIVE SPRINT)

**Focus**: Complete Roth Conversion Deep-Dive (TASK-006) and enhance core financial tools

### **[TASK-006]** Roth Conversion Deep-Dive - **Phase 5** 🚧
- **Description**: Complete the final phase of Roth conversion analysis
- **Status**: 80% complete (Phases 1-4 done)
- **Files**: 
  - `src/roth/RothComparison.js` (lines 301, 307)
  - `src/partials/modals/roth-deep-dive.html`
- **Features Remaining**:
  - [ ] **Phase 5a**: Load specific strategy's year-by-year data into detailed view (ISSUE-053)
    - File: `src/roth/RothComparison.js` line 301
    - Code TODO: "Load the specific strategy's year-by-year data into the detailed view"
  - [ ] **Phase 5b**: Implement table sorting for conversion breakdown
    - File: `src/roth/RothComparison.js` line 307
    - Code TODO: "Implement table sorting"
- **Related Issues**: ISSUE-029, ISSUE-053
- **Estimated Effort**: 2-3 hours
- **Priority**: **HIGH** (User-requested feature, 80% complete)

### **[TASK-007]** Advanced Cash Flow Explorer
- **Description**: Modernize "What You Need" calculator with interactive controls
- **Files**:
  - `src/explorers/CashFlowExplorer.js` (to create)
  - `src/partials/charts/cashflow-explorer.html` (to create)
  - `src/utils/GapCalculator.js` (to update)
- **Features Needed**:
  - [ ] Fix hardcoded age 53 → use current age (ISSUE-019)
  - [ ] Convert target income to interactive slider (ISSUE-020)
  - [ ] Add spend rate % scenarios
  - [ ] Implement deficit/surplus visualization
- **Related Issues**: ISSUE-019, ISSUE-020
- **Estimated Effort**: 4-6 hours
- **Priority**: **MEDIUM-HIGH**

### **[TASK-008]** Monte Carlo Enhancements
- **Description**: Expand Monte Carlo analysis with more scenarios and visualizations
- **Files**: 
  - `src/engine/SimulationEngine.js`
  - `src/charts/MonteCarloCharts.js`
- **Features Needed**:
  - [ ] Add "Last 30 years" historical range option (ISSUE-035)
  - [ ] Implement spend rate % variations (ISSUE-034)
  - [ ] Add market condition scenarios (ISSUE-034)
  - [ ] Enhance visualization of confidence intervals
- **Related Issues**: ISSUE-034, ISSUE-035
- **Estimated Effort**: 6-8 hours
- **Priority**: **MEDIUM**

### **[TASK-014]** Gap Years Withdrawal Logic Fix
- **Description**: Fix withdrawal logic when there's no income (gap years before retirement)
- **Files**: `src/engine/SimulationEngine.js`
- **Features Needed**:
  - [ ] Implement smart withdrawal order for gap years (ISSUE-063)
  - [ ] Ensure 10% penalty avoidance logic works correctly
  - [ ] Add tests for gap year scenarios
- **Related Issues**: ISSUE-063
- **Estimated Effort**: 3-4 hours
- **Priority**: **MEDIUM-HIGH**

### **[TASK-015]** Compare Button Implementation
- **Description**: Fix or remove the "Compare" button at top of dashboard
- **Files**: `src/main.js`, `src/ui/DashboardMetrics.js`
- **Features Needed**:
  - [ ] Implement multi-scenario comparison view (ISSUE-018)
  - [ ] OR remove button if not needed
- **Related Issues**: ISSUE-018
- **Estimated Effort**: 2-3 hours
- **Priority**: **LOW-MEDIUM**

### **[TASK-017]** Roth Account Source Transparency
- **Description**: Show which accounts fund Roth conversions
- **Files**: `src/roth/RothOptimizer.js`, `src/roth/RothDeepDive.js`
- **Features Needed**:
  - [ ] Display account source breakdown (ISSUE-029, ISSUE-030)
  - [ ] Show conversion amounts per account
- **Related Issues**: ISSUE-029, ISSUE-030
- **Estimated Effort**: 2-3 hours
- **Priority**: **MEDIUM**

---

## 🟢 Priority 2: UX Polish & Refinements

**Focus**: Improve user experience with tooltips, hover states, and interactive elements

### **[TASK-009]** Interactive Tooltips & Hover States
- **Description**: Add hover tooltips across all interactive elements
- **Files**: Various chart files
- **Features Needed**:
  - [ ] Roth Conversion Optimizer hover tooltips (ISSUE-044)
  - [ ] Goal Tracking hover tooltips (ISSUE-048)
  - [ ] Mortgage Payoff chart hover info (ISSUE-032)
- **Estimated Effort**: 2-3 hours
- **Priority**: **LOW**

### **[TASK-010]** Clickable Insights & Alerts
- **Description**: Make strategic insights and alerts actionable with click handlers
- **Files**: `src/ui/DashboardMetrics.js`, `src/ui/CoachInsights.js`
- **Features Needed**:
  - [ ] Alerts & Warnings clickable links (ISSUE-050)
  - [ ] Strategic Insights clickable links (ISSUE-051)
  - [ ] Smooth scroll to relevant sections
- **Estimated Effort**: 2-3 hours
- **Priority**: **LOW**

### **[TASK-011]** Social Security Age Flexibility
- **Description**: Allow any claiming age between 62-70 (not just 62, 67, 70)
- **Files**: 
  - `src/utils/SocialSecurityCalculator.js`
  - `src/partials/settings-and-modals.html`
- **Features Needed**:
  - [ ] Update UI to support ages 62-70 (ISSUE-043)
  - [ ] Implement interpolation for intermediate ages
- **Related Issues**: ISSUE-043
- **Estimated Effort**: 2-3 hours
- **Priority**: **LOW**

---

## 🔧 Priority 3: Technical Debt & Housekeeping

**Focus**: Code quality, linting, and test coverage improvements

### **[TASK-012]** Code Quality Improvements
- **Description**: Address remaining linting warnings and code smells
- **Files**: Various (see linting report)
- **Items**:
  - [ ] Fix 34 linting errors (mostly no-undef, no-case-declarations)
    - `src/ui/EventsHandler.js`: 'recalculate' is not defined (lines 54, 61)
    - `src/ui/ExplorerHandler.js`: Unexpected lexical declarations in case blocks (lines 153, 207, 224, 225, 237)
    - `src/ui/SettingsHandler.js`: 'recalculate' is not defined (line 241)
    - `src/utils/ErrorBoundary.js`: Parsing error (line 8)
    - `src/utils/InputValidator.js`: Parsing error (line 8)
    - E2E tests: 'Chart' is not defined, 'setScenario' is not defined
  - [ ] Fix 58 linting warnings (mostly unused vars in tests)
  - [ ] Fix sidebar active highlighting on scroll (ISSUE-013)
  - [ ] Resolve scenario switching internal warning (ISSUE-014)
  - [ ] Standardize chart sizing (ISSUE-015)
- **Estimated Effort**: 4-6 hours
- **Priority**: **MEDIUM** (34 errors should be addressed)

### **[TASK-013]** Test Coverage Expansion
- **Description**: Add tests for edge cases and new features
- **Files**: `tests/`
- **Items**:
  - [ ] Add Playwright tests for settings modal
  - [ ] Add integration tests for Roth optimization (TASK-006)
  - [ ] Add E2E tests for Gap Year scenarios (TASK-014)
  - [ ] Improve test coverage for edge cases
- **Estimated Effort**: 4-6 hours
- **Priority**: **LOW**

---

## 📊 Summary Statistics

- **Total Pending**: 30 tasks
- **P0 (Critical)**: 0 tasks ✅
- **P1 (Active Sprint)**: 6 tasks (17 sub-items)
- **P2 (UX Polish)**: 3 tasks (9 sub-items)
- **P3 (Housekeeping)**: 2 tasks (8 sub-items)

**Estimated Total Effort**: 35-50 hours

---

## 💎 Recently Completed (Last 7 Days)

- ✅ **Workflow Infrastructure**: Created and refined `/all`, `/qa`, `/update`, `/build`, `/deploy`, `/kill` workflows
  - Added dev server lifecycle management to `/qa` workflow
  - Implemented `// turbo-all` auto-run capability
  - Full CI/CD pipeline: QA → Update → Build → Git → Deploy
- ✅ **WSL Git Fix**: Resolved UNC path issues, using native Windows git
- ✅ **Security Hardening**: AES-256 encryption, CSP headers, error boundary
- ✅ **Advanced Social Security**: Dynamic comparison bar, cumulative/annual toggle
- ✅ **Data Table Granularity**: Yearly breakdown with tax detail columns
- ✅ **Interactive Metrics**: Clickable dashboard metrics with smooth scroll
- ✅ **Monte Carlo Expansion**: Historical scenarios, spending variability
- ✅ **Gap Year Logic**: Smart penalty-avoiding drawdown order
- ✅ **Roth Deep-Dive Phases 1-4**: Account transparency, break-even, strategy comparison, combined constraints
- ✅ **[TASK-012] Critical Linting Fixes**: Fixed 34 errors (undefined vars, parsing, case declarations) - 0 errors remaining
- ✅ **[TASK-006] Roth Deep-Dive Phase 5**: Year-by-year detail view, 6-column table sorting with indicators - 100% complete

---

## 🚀 Immediate Action Queue (Top 3)

### 1. **[TASK-007] Modernize Cash Flow Explorer**
   - **Why**: Fixes outdated "What You Need" calculator (hardcoded age 53)
   - **Effort**: 4-6 hours
   - **Blockers**: None
   - **Impact**: Critical for users with different ages, improves UX
   - **Next Step**: Update `GapCalculator.js` to use dynamic age
   - **Files**: `src/utils/GapCalculator.js`, `src/explorers/CashFlowExplorer.js`

### 3. **[TASK-008] Enhance Withdrawal Strategy Visualization**
   - **Why**: Users need account-by-account breakdown for tax planning
   - **Effort**: 3-4 hours
   - **Blockers**: None
   - **Impact**: Improves transparency and tax efficiency understanding
   - **Next Step**: Design data structure for account-level tracking

---

## 🎯 Current Sprint Status

**Sprint**: Financial Depth & UX Enhancements
**Progress**: 95% Complete
**Next Milestone**: Modernize Cash Flow Explorer (TASK-007)

---

