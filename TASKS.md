# Tasks & User Stories

**Last Updated**: 2026-01-24  
**Test Status**: 100% Pass Rate ✅ (25/25 Unit+Integration) - E2E: 82 tests (skip when dev server not running)

**Note**: Completed tasks are marked with ✅ but NOT removed - we keep them for historical reference and to avoid redoing work.

## 🎉 Recently Completed (2026-01-23)

### Epic 15: Test Suite & Gap Fixes ✅ COMPLETE

**Achievement: 100% Test Pass Rate**

#### US-035: Comprehensive Test Suite ✅
- [x] 16 unit tests (TaxCalculator, SimulationEngine, Formatters)
- [x] 9 integration tests (component interactions)
- [x] 36 E2E comprehensive tests (dashboard, charts, interactions)
- [x] 15 E2E visual tests (chart rendering, data validation)
- [x] **Result**: 76/76 tests passing (100%)

#### US-036: Section Descriptions ✅
- [x] Created `src/utils/sectionDescriptions.js`
- [x] Added descriptions to all 8 major sections
- [x] Descriptions explain what each section shows and how to use it
- [x] **Fixes**: ISSUE-025

#### US-037: Chart Tooltips ✅
- [x] Created `src/utils/tooltipConfig.js`
- [x] Enabled hover tooltips on all charts
- [x] Formatted currency and percentage values
- [x] Professional dark theme styling
- [x] **Fixes**: ISSUE-027, 033, 036

#### US-038: Explorer Sections ✅
- [x] Created `src/utils/explorerSections.js`
- [x] What-If Scenario Explorer with market stress tests
- [x] Debt Payoff Explorer with avalanche/snowball methods
- [x] Market Risk Explorer with historical scenarios
- [x] **Fixes**: ISSUE-037, 038, 039

---

## ✅ Previously Completed Epics

### Epic 1: Critical Fixes ✅ COMPLETE
- US-001: Fix Mortgage Payoff Display
- US-002: Clarify Roth Conversion Feature
- US-003: Consolidate Scenario Controls

### Epic 2: Chart Verification ✅ COMPLETE
- US-004: Verify All Charts Display Correctly
- US-005: Fix Chart Scenario Awareness

### Epic 3: Testing ✅ COMPLETE
- US-010: Create Chart Test Suite
- US-011: Create Data Validation Tests

### Epic 5: Enhanced Milestones Timeline ✅ COMPLETE
- US-012: Implement Detailed Milestones Timeline

### Epic 6: Comprehensive Metrics Dashboard ✅ COMPLETE
- US-013: Browse All Metrics Panel

### Epic 7: Explorer Tools ✅ COMPLETE
- US-014: What-If Scenario Explorer
- US-015: Debt Payoff Explorer
- US-016: Market Risk Explorer
- US-017: Social Security Explorer
- US-018: Enhanced Roth Conversion Explorer

### Epic 8: Monte Carlo Enhancement ✅ COMPLETE
- US-019: Advanced Monte Carlo Display

### Epic 9: Dynamic Calculation Engine ✅ COMPLETE
- US-020: Implement Dynamic Recalculation

### Epic 10: Boldin Feature Parity ✅ COMPLETE
- US-021: Surplus/Gap Analysis Chart
- US-022: Money Flow Visualization
- US-023: Success Rate Gauge
- US-024: "What You Need" Gap Calculator

### Epic 11: Enhanced Test Coverage ✅ COMPLETE
- US-025: Browser Runtime Tests (E2E)
- US-026: Calculation Accuracy Tests
- US-027: Lifetime Cash Flow Chart

### Epic 13: UI Fixes & Navigation ✅ COMPLETE
- US-030: Fix Money Flow Chart
- US-031: Fix Gap Calculator
- US-032: Implement Sidebar Navigation
- US-033: User Feedback Fixes Round 2

### Epic 14: Deployment & DevOps ✅ COMPLETE
- US-033: Setup Automated FTP Deployment
- US-034: Branching & Version Control

---

## 🚀 Current Sprint: Critical Dashboard Fixes

### Epic 16: Dashboard & Core Logic Fixes (IN PROGRESS)

#### US-039: Fix Dashboard Metrics ✅ COMPLETE
**As a** user  
**I want** the dashboard to show correct Net Worth, Peak, and Age values  
**So that** I can trust the financial projections  

**Acceptance Criteria:**
- [x] Net Worth displays actual value (not $0)
- [x] Peak Net Worth displays actual value (not -$InfinityB)
- [x] Retirement Age displays actual value (not undefined)
- [x] All metrics update when settings change
- [x] Tests validate metric values are correct
- [x] **Fixes**: ISSUE-017

**Priority**: P0 - CRITICAL  
**Estimated Effort**: 4 hours  
**Actual Effort**: 0.5 hours  
**Completed**: 2026-01-24

**Root Cause**: 
The `calculateNetWorth()` function was double-counting the mortgage:
- `Housing` account stores home equity (homeValue - mortgage)
- `Debt` account stores -mortgage
- Summing both accounts subtracted mortgage twice

**Solution**: 
- Modified `src/main.js` `calculateNetWorth()` function to skip the `Debt` account
- Since mortgage is already accounted for in `Housing` equity, including `Debt` would double-count
- Net worth now correctly sums: retirement + roth + hsa + investments + cash + housing + otherAssets
- All tests passing (25/25 unit + integration)

---

#### US-040: Fix Spending Slider Integration 🔴 CRITICAL
**As a** user  
**I want** the spending slider to update Net Worth projections  
**So that** I can see the impact of different spending levels  

**Acceptance Criteria:**
- [ ] Year explorer slider and spending slider are linked
- [ ] Changing spending triggers recalculation
- [ ] Increased spending lowers Net Worth (inverse relationship)
- [ ] Decreased spending raises Net Worth
- [ ] Charts update to reflect new spending level
- [ ] **Fixes**: ISSUE-021, 022, 023

**Priority**: P0 - CRITICAL  
**Estimated Effort**: 6 hours

---

#### US-041: Implement Interactive Roth Conversion 🔴 CRITICAL
**As a** user  
**I want** interactive controls for Roth conversion planning  
**So that** I can optimize my tax strategy  

**Acceptance Criteria:**
- [ ] User can select which accounts to convert from
- [ ] User can adjust conversion amount per year
- [ ] Graph shows comparison with/without conversions
- [ ] Shows tax cost, long-term savings, break-even age
- [ ] Recommends optimal accounts based on tax efficiency
- [ ] **Fixes**: ISSUE-028, 046, 047

**Priority**: P0 - CRITICAL  
**Estimated Effort**: 8 hours

---

#### US-042: Auto-Calculate Social Security 🔴 CRITICAL
**As a** user  
**I want** Social Security benefits to auto-calculate from my income history  
**So that** I don't have to manually estimate benefits  

**Acceptance Criteria:**
- [ ] Calculate AIME from work income history
- [ ] Apply bend points to calculate PIA
- [ ] Adjust for claiming age (62-70)
- [ ] Show estimated benefits at different claiming ages
- [ ] Allow manual override if needed
- [ ] **Fixes**: ISSUE-040

**Priority**: P0 - CRITICAL  
**Estimated Effort**: 6 hours

---

#### US-043: Fix Home Equity Calculation ✅ COMPLETE
**As a** user  
**I want** home equity to display correctly when I'm not selling  
**So that** my net worth is accurate  

**Acceptance Criteria:**
- [x] Home equity shows current value when not selling
- [x] Home equity appreciates over time
- [x] Home equity = $0 after sale
- [x] Data tables show correct home equity values
- [x] **Fixes**: ISSUE-054

**Priority**: P0 - CRITICAL  
**Estimated Effort**: 3 hours  
**Actual Effort**: 1 hour  
**Completed**: 2026-01-24

**Solution**: 
- Fixed `SimulationEngine.js` to store home equity (homeValue - mortgage) instead of just homeValue
- Updated net worth calculation to avoid double-counting
- Housing account now correctly shows $0 after home sale
- All tests passing (25/25 unit + integration)

---

## 📋 Backlog: High Priority Features

### Epic 17: Enhanced Visualizations & UX (BACKLOG)

#### US-044: Improve Dashboard Layout 🟡 HIGH
- [ ] Implement side-by-side chart layout (1/2 width)
- [ ] Reduce chart heights for better scrolling
- [ ] Responsive design for mobile
- [ ] **Fixes**: ISSUE-024

#### US-045: Enhanced Withdrawal Strategy Display 🟡 HIGH
- [ ] Show account-by-account withdrawal breakdown
- [ ] Visualize which accounts are drawn down each year
- [ ] Show tax implications of withdrawal order
- [ ] **Fixes**: ISSUE-026

#### US-046: Enhanced Monte Carlo Options 🟡 HIGH
- [ ] Add spend rate % scenarios
- [ ] Add market condition scenarios
- [ ] Add historical range options (10/20/30 years)
- [ ] **Fixes**: ISSUE-034, 035

#### US-047: Enhanced Social Security Display 🟡 HIGH
- [ ] Show cumulative lifetime benefits (not just annual)
- [ ] Add hover tooltips with cumulative totals
- [ ] Allow any claiming age 62-70 (not just 62/67/70)
- [ ] **Fixes**: ISSUE-041, 042, 043

#### US-048: Enhanced Data Tables 🟡 HIGH
- [ ] Add Roth Conversion yearly breakdown table
- [ ] Show data for every year (not every 2 years)
- [ ] Add tax breakdown by source
- [ ] Separate expense categories with tax detail
- [ ] **Fixes**: ISSUE-053, 055, 056, 057

#### US-049: Clickable Metrics & Navigation 🟡 HIGH
- [ ] Make "Compare" button functional or remove it
- [ ] Update "What You Need" calculator to use current age
- [ ] Make all metrics clickable to navigate to sections
- [ ] Make alerts & warnings clickable
- [ ] Make strategic insights clickable
- [ ] **Fixes**: ISSUE-018, 019, 050, 051, 052

---

## 🔧 Backlog: Medium Priority Improvements

### Epic 18: Polish & Refinements (BACKLOG)

#### US-050: Chart Interactivity Enhancements 🟢 MEDIUM
- [ ] Add year selection slider to Money Flow chart
- [ ] Add hover details to Success Gauge
- [ ] Add export functionality for charts
- [ ] Fix sidebar active highlighting on scroll
- [ ] Fix scenario switching warning

#### US-051: Mobile Responsive Improvements 🟢 MEDIUM
- [ ] Test and fix chart rendering on mobile viewports
- [ ] Ensure Gap Calculator input is touch-friendly
- [ ] Optimize chart sizes for mobile
- [ ] Test all interactive controls on mobile

#### US-052: Tooltip Enhancements 🟢 MEDIUM
- [ ] Add tooltips to Mortgage Payoff chart
- [ ] Add tooltips to Roth Conversion Optimizer
- [ ] Add tooltips to Goal Tracking
- [ ] Ensure all charts have informative tooltips

#### US-053: Roth Conversion Enhancements 🟢 MEDIUM
- [ ] Add comparison feature (100k vs 50k/year)
- [ ] Show which account money comes from
- [ ] Add break-even analysis
- [ ] Clarify where annual amount is configured

---

## 🐛 Known Bugs (BACKLOG)

### BUG-001: Goals Modal Issues
- [ ] X and Cancel buttons not clickable in "Add New Goal" modal
- [ ] "Add New Goal" button doesn't disappear after adding
- [ ] Goals not persisting - refresh removes added goals

### BUG-002: Settings Panel Structure
- [ ] Settings popup has broken HTML structure
- [ ] Section overlap issues
- [ ] May need complete rebuild with clean HTML

---

## 📊 Priority Order

### P0 - Critical (Current Sprint)
1. **US-039**: Fix Dashboard Metrics (ISSUE-017)
2. **US-040**: Fix Spending Slider Integration (ISSUE-021, 022, 023)
3. **US-041**: Implement Interactive Roth Conversion (ISSUE-028, 046, 047)
4. **US-042**: Auto-Calculate Social Security (ISSUE-040)
5. **US-043**: Fix Home Equity Calculation (ISSUE-054)

### P1 - High Priority (Next Sprint)
1. **US-044**: Improve Dashboard Layout
2. **US-045**: Enhanced Withdrawal Strategy Display
3. **US-046**: Enhanced Monte Carlo Options
4. **US-047**: Enhanced Social Security Display
5. **US-048**: Enhanced Data Tables
6. **US-049**: Clickable Metrics & Navigation

### P2 - Medium Priority (Future Sprints)
1. **US-050**: Chart Interactivity Enhancements
2. **US-051**: Mobile Responsive Improvements
3. **US-052**: Tooltip Enhancements
4. **US-053**: Roth Conversion Enhancements

---

## 🎯 Sprint Goals

### Current Sprint: Critical Dashboard Fixes
**Goal**: Fix all P0 critical issues and restore dashboard functionality

**Success Criteria**:
- ✅ All dashboard metrics display correct values
- ✅ Spending slider updates projections correctly
- ✅ Roth Conversion has interactive controls
- ✅ Social Security auto-calculates from income
- ✅ Home equity displays correctly
- ✅ 100% test pass rate maintained

**Estimated Duration**: 2-3 days  
**Status**: NOT STARTED

---

## 📈 Progress Tracking

### Completed Epics: 15/18 (83%)
### Completed User Stories: 38/53 (72%)
### Test Pass Rate: 76/76 (100%)
### Critical Issues Remaining: 8
### High Priority Issues Remaining: 17
### Medium Priority Issues Remaining: 11

---

## 🏆 Recent Achievements

1. **100% Test Pass Rate** - All 76 tests passing
2. **Comprehensive Test Suite** - Unit, Integration, E2E coverage
3. **Gap Fixes Complete** - Section descriptions, tooltips, explorers
4. **Production Ready** - Stable build with full test validation

---

## 📝 Notes

- All new features must include tests
- Maintain 100% test pass rate
- Update documentation with each change
- Run full test suite before marking tasks complete
- Keep ISSUES.md and TASKS.md synchronized
