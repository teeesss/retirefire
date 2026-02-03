# Tasks

**Last Updated**: 2026-02-02 6:35 PM  
**Status**: Workflow Infrastructure Complete ✅ | Tests: 522/525 Passing (99.4%)
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

### **[TASK-006]** Roth Conversion Deep-Dive ✅
- **Description**: Complete the final phase of Roth conversion analysis
- **Status**: **COMPLETE** (2026-02-02)
- **Files**: 
  - `src/roth/RothComparison.js`
  - `src/partials/modals/roth-deep-dive.html`
- **Related Issues**: ISSUE-029, ISSUE-053
- **Priority**: **HIGH**

### **[TASK-007]** Advanced Cash Flow Explorer ✅
- **Description**: Modernize "What You Need" calculator with interactive controls
- **Status**: **COMPLETE** (2026-02-02)
- **Files**:
  - `src/explorers/CashFlowExplorer.js` (created)
  - `src/ui/GapCalculator.js` (updated)
  - `src/partials/charts/gap-calculator.html` (updated)
  - `tests/unit/CashFlowExplorer.test.js` (created - 9 tests passing)
  - `tests/unit/GapCalculator.test.js` (updated - 6 tests passing)
- **Features Completed**:
  - [x] Fix hardcoded age 53 → use current age (ISSUE-019) - Enhanced subtitle shows dynamic age
  - [x] Convert target income to interactive slider (ISSUE-020) - Bidirectional sync implemented
  - [x] Add spend rate % scenarios - 5 buttons (3%, 3.5%, 4%, 4.5%, 5%)
  - [x] Implement portfolio calculation - Shows required portfolio based on spend rate
  - [x] Enhanced visualization - Progress bar and surplus/deficit display
  - [x] Comprehensive testing - 15 unit tests passing
- **Related Issues**: ISSUE-019 ✅, ISSUE-020 ✅
- **Actual Effort**: 4 hours
- **Priority**: **MEDIUM-HIGH**

### **[TASK-008]** Monte Carlo Enhancements
- **Description**: Expand Monte Carlo analysis with more scenarios and visualizations
- **Files**: 
  - `src/engine/SimulationEngine.js`
  - `src/charts/AnalysisCharts.js`
- **Features Needed**:
  - [x] Add "Last 30 years" historical range option (ISSUE-035)
  - [x] Implement spend rate % variations (ISSUE-034)
  - [x] Add market condition scenarios (ISSUE-034)
  - [x] Enhance visualization of confidence intervals
  - [x] Add market scenario descriptions and tooltips
- **Related Issues**: ISSUE-034, ISSUE-035
- **Status**: **COMPLETED (2026-02-02)**
- **Priority**: **MEDIUM**

### **[TASK-014]** Gap Years Withdrawal Logic Fix ✅
- **Description**: Fix withdrawal logic when there's no income (gap years before retirement)
- **Status**: **COMPLETE** (2026-02-02)
- **Files**: `src/engine/SimulationEngine.js`
- **Features Completed**:
  - [x] Implement iterative drawdown loop to fund taxes/penalties (gross-up)
  - [x] Fix withdrawal exclusion in `getTotalIncome`
  - [x] Verify $0 gap in early retirement scenarios
- **Related Issues**: ISSUE-063 ✅
- **Actual Effort**: 3 hours
- **Priority**: **HIGH**

### **[TASK-015]** UI Layout Optimization ✅
- **Description**: Optimize dashboard for space and side-by-side viewing
- **Status**: **COMPLETE** (2026-02-02)
- **Files**: `src/partials/charts/year-explorer.html`, `src/partials/dashboard-metrics.html`, `src/style.css`
- **Features Completed**:
  - [x] Side-by-side Account Breakdown & Cash Flow details
  - [x] Multi-column grid for Coach Insights
- **Related Issues**: ISSUE-077 ✅
- **Actual Effort**: 2 hours
- **Priority**: **MEDIUM**

### **[TASK-016]** Grid Layout & Alignment Fix ✅
- **Description**: Fix analysis row 3+1 layout and rebalance grid spans
- **Status**: **COMPLETE** (2026-02-02)
- **Files**: `src/partials/charts/networth-charts.html`, `src/partials/charts/roth.html`, `src/partials/charts/legacy.html`
- **Features Completed**:
  - [x] Rebalanced Row 2 (Net Worth) and Row 7 (Roth) to 50/50 split
  - [x] Set Analysis row to 3-across (What-If, Stress, Sequence)
  - [x] Set Legacy chart to solo row (full width)
- **Actual Effort**: 1.5 hours
- **Priority**: **MEDIUM**

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
- ✅ **[TASK-007] Advanced Cash Flow Explorer**: Interactive slider controls, spend rate scenarios (3-5%), portfolio calculation, enhanced age display - 100% complete
- ✅ **[TASK-014] Gap Years Logic Fix**: Iterative gross-up loop ensures funded taxes/shortfalls - 100% complete
- ✅ **[TASK-015] UI Optimization**: Side-by-side explorer sections and multi-column coach grid - 100% complete
- ✅ **[TASK-016] Grid Rebalancing**: Balanced 6-column rows and 3+1 analysis layout - 100% complete

---

## 🚀 Immediate Action Queue (Top 3)

### 1. **[TASK-008] Monte Carlo Enhancements**
   - **Why**: Expand analysis with more scenarios and visualizations
   - **Effort**: 6-8 hours
   - **Blockers**: None
   - **Impact**: Better risk assessment and confidence intervals
   - **Next Step**: Add "Last 30 years" historical range option
   - **Files**: `src/engine/SimulationEngine.js`, `src/charts/MonteCarloCharts.js`

### 1. **[TASK-014]** Gap Years Withdrawal Logic Fix
   - **Why**: Fix withdrawal logic when there's no income (gap years before retirement)
   - **Effort**: 3-4 hours
   - **Impact**: Critical for early retirees with gap years
   - **Next Step**: Implement smart withdrawal order for gap years
   - **Files**: `src/engine/SimulationEngine.js`

### 2. **[TASK-017]** Roth Account Source Transparency
   - **Why**: Users need to know which accounts fund Roth conversions
   - **Effort**: 2-3 hours
   - **Impact**: Improves transparency and planning
   - **Next Step**: Display account source breakdown
   - **Files**: `src/roth/RothOptimizer.js`, `src/roth/RothDeepDive.js`

### 3. **[TASK-015]** Compare Button Implementation
   - **Why**: Fix or remove the "Compare" button at top of dashboard
   - **Effort**: 2-3 hours
   - **Impact**: Better multi-scenario comparison view
   - **Next Step**: Implement multi-scenario comparison engine
   - **Files**: `src/main.js`, `src/ui/DashboardMetrics.js`

---

## 🎯 Current Sprint Status

**Sprint**: Financial Depth & UX Enhancements
**Progress**: 100% Complete ✅
**Next Milestone**: Fix Early Retirement Gap Year Logic (TASK-014)

---

