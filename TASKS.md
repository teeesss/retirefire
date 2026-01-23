# Tasks & User Stories

**Last Updated**: 2026-01-23  
**Test Status**: 68/68 Passing ✅

## Epic 1: Critical Fixes ✅ COMPLETE

### US-001: Fix Mortgage Payoff Display ✅
### US-002: Clarify Roth Conversion Feature ✅
### US-003: Consolidate Scenario Controls ✅

## Epic 2: Chart Verification ✅ COMPLETE

### US-004: Verify All Charts Display Correctly ✅
### US-005: Fix Chart Scenario Awareness ✅

## Epic 3: Testing ✅ COMPLETE

### US-010: Create Chart Test Suite ✅
### US-011: Create Data Validation Tests ✅

## Epic 5: Enhanced Milestones Timeline ✅ COMPLETE

### US-012: Implement Detailed Milestones Timeline ✅

## Epic 6: Comprehensive Metrics Dashboard ✅ COMPLETE

### US-013: Browse All Metrics Panel ✅

## Epic 7: Explorer Tools ✅ COMPLETE

### US-014: What-If Scenario Explorer ✅
### US-015: Debt Payoff Explorer ✅
### US-016: Market Risk Explorer ✅
### US-017: Social Security Explorer ✅
### US-018: Enhanced Roth Conversion Explorer ✅

## Epic 8: Monte Carlo Enhancement ✅ COMPLETE

### US-019: Advanced Monte Carlo Display ✅

---

## Epic 10: Boldin Feature Parity ✅ COMPLETE

### US-021: Surplus/Gap Analysis Chart ✅
- [x] Implement `initSurplusGapChart()` showing annual income vs expenses

### US-022: Money Flow Visualization ✅
- [x] Implement `initMoneyFlowChart()` showing cash flow breakdown

### US-023: Success Rate Gauge ✅
- [x] Implement `initSuccessGauge()` with doughnut chart in header

### US-024: "What You Need" Gap Calculator ✅
- [x] Implement `initGapCalculator()` with target vs projected income

---

## Epic 11: Enhanced Test Coverage ✅ COMPLETE

### US-025: Browser Runtime Tests (E2E) ✅
**As a** developer  
**I want** automated browser tests that load the page  
**So that** I can verify charts actually render in a real browser  

**Acceptance Criteria:**
- [x] Create `tests/e2e_tests.js` with Puppeteer
- [x] Test all canvas elements render (non-zero dimensions)
- [x] Test scenario switching updates charts
- [x] Test slider interactions work
- [x] Test key metric values are valid numbers

### US-026: Calculation Accuracy Tests ✅
**As a** developer  
**I want** unit tests that verify calculation outputs  
**So that** I can catch math errors before they reach users  

**Acceptance Criteria:**
- [x] Test `getTotalIncome()` returns expected sums
- [x] Test `getTotalExpenses()` returns expected sums
- [x] Test `calculateMonteCarlo()` returns valid percentages
- [x] Test `calculateNetWorth()` returns expected values

### US-027: Lifetime Cash Flow Chart
**As a** user  
**I want** to see cumulative cash flow over my lifetime  
**So that** I understand my overall financial trajectory  

**Acceptance Criteria:**
- [ ] Create `initLifetimeCashFlowChart()`
- [ ] Show cumulative surplus/deficit over years
- [ ] Add to dashboard and test suite

---

## Epic 12: UI/UX Refinements (Backlog)

### US-028: Chart Interactivity Enhancements
- [ ] Add year selection slider to Money Flow chart
- [ ] Add hover details to Success Gauge
- [ ] Add export functionality for charts

### US-029: Mobile Responsive Improvements
- [ ] Test and fix chart rendering on mobile viewports
- [ ] Ensure Gap Calculator input is touch-friendly

---

## Epic 13: UI Fixes & Navigation ✅ COMPLETE

### US-030: Fix Money Flow Chart ✅
**As a** user  
**I want** the Annual Money Flow chart to display actual data  
**So that** I can see my income breakdown correctly  

**Acceptance Criteria:**
- [x] Chart displays non-zero income values
- [x] Shows Taxes, Living Expenses, and Savings/Surplus breakdown
- [x] E2E test validates chart has real data (ISSUE-010 fix)

### US-031: Fix Gap Calculator ✅
**As a** user  
**I want** the Gap Calculator to show my projected retirement income  
**So that** I can plan my savings needs  

**Acceptance Criteria:**
- [x] Projected Monthly Income shows actual value (not $0)
- [x] Uses rawData for retired years (year index 6+)
- [x] E2E test fails if value is $0 (ISSUE-009 fix)

### US-032: Implement Sidebar Navigation ✅
- [x] Add persistent left sidebar with section links
- [x] All major sections have anchor IDs
- [x] Smooth scroll on navigation click
- [x] E2E test verifies sidebar exists with 11 nav items
- [x] E2E test verifies all 9 section anchors exist

### US-033: User Feedback Fixes Round 2 (Active)
**As a** user
**I want** the settings panel to be clearer and "Apply" to give feedback without closing
**So that** I understand what I am changing and can tweak values easily

**Acceptance Criteria:**
- [x] **Docs**: Update all .md files and tracking. (2026-01-23)
- [ ] **Nav**: Add Descriptions to ALL settings sections.
- [ ] **Nav**: Add "Back" / "Next" buttons or clear navigation flow.
- [ ] **SS**: Fix Social Security section (add description, ensure fields match request).
- [ ] **Assets**: Clarify "Asset Allocation" vs "Glide Path".
- [ ] **UX**: "Apply" button should NOT close modal, just recalculate & notify.
- [ ] **Housing**: Default "Plan to Sell" = NO.
- [ ] **Healthcare**: Set defaults (Curr: $5k, Pre-Med: $5k, Med: $6k).
- [ ] **Taxes**: Add description.
- [ ] **Events**: detailed separation of One-Time vs Recurring.
- [ ] **Events**: Add Start/End Age to Recurring Events.
- [ ] **Scenarios**: Add description explaining "Custom Scenarios".

---

# BACKLOG - Future Enhancements

## BUG: Goals Modal Issues 🐛
- [ ] X and Cancel buttons not clickable in "Add New Goal" modal
- [ ] "Add New Goal" button doesn't disappear after adding a goal
- [ ] Goals not persisting - refresh removes added goals (localStorage not implemented)

## BUG: Settings Panel Rebuild Required 🐛
- [ ] Settings popup has deeply broken HTML structure causing section overlap
- [ ] Need complete rebuild with clean, properly-nested HTML structure

## Epic 9: Dynamic Calculation Engine ✅ COMPLETE

### US-020: Implement Dynamic Recalculation ✅
- [x] Changing age updates projection years
- [x] Changing assets updates starting balances
- [x] Changing return rates affects growth
- [x] Changing expenses affects cash flow
- [x] All charts update when settings applied

---

## Epic 14: Deployment & DevOps ✅ COMPLETE

### US-033: Setup Automated FTP Deployment ✅
- [x] Create `scripts/deploy.js` using `basic-ftp`
- [x] Add `build` and `deploy` scripts to `package.json`
- [x] Configure `deploy_creds.json` and `.credentials` for `retirefire` path

### US-034: Branching & Version Control ✅ COMPLETE
- [x] Create and switch to `retirefire` branch
- [x] review and push `.pre-commit-config.yaml`, `.prettierrc`, and `.prettierignore`
- [x] Push all changes to remote repository

---

## Priority Order (Active)

### P0 - Critical (Next Sprint)
1. **US-034**: Boldin Gap Analysis & Feature Parity Check (Active)
   - [x] Crawl/Review public feature docs (PlannerPlus)
   - [x] Create `BOLDIN_GAP_ANALYSIS.md` report
   - [ ] **Story A**: Tax Logic (Separate Ord Income/Cap Gains/FICA)
   - [ ] **Story B**: Real Estate (Buy/Sell/Downsize logic)
   - [ ] **Story C**: Withdrawal Strategy Toggle (Tax Deferred vs Tax Free first)
   - [ ] **Story D**: Tax Visualization Chart (Stacked Area)
   - [ ] **Story E**: Scenario Comparison Modal
   - [ ] **Story F**: Wellness Score Metrics
   - [ ] **Story G**: Advanced Roth Optimizer (Algo)
2. **US-025**: Browser Runtime Tests - Validate charts render
3. **US-026**: Calculation Accuracy Tests - Verify math

### P1 - High Priority
1. **US-027**: Lifetime Cash Flow Chart

### P2 - Medium Priority
1. **US-028**: Chart Interactivity Enhancements
2. **US-029**: Mobile Responsive Improvements
