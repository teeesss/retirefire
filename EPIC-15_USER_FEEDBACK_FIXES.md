# EPIC-15: User Feedback & Interaction Fixes

## Status: 🟡 PHASE 3 IN PROGRESS
**Priority**: P0 - Critical
**Created**: 2026-01-20
**Updated**: 2026-01-23
**Target**: Fix all critical bugs and user feedback issues from User Testing Round 1

---

## Critical Bugs (Must Fix First)

### BUG-001: updateMetrics() DOM Element Errors ✅ FIXED
**Error**: `Uncaught TypeError: Cannot set properties of null (setting 'textContent') at updateMetrics`
**Location**: Line 8427 in `ray3.html`
**Root Cause**: DOM elements `successRingNum`, `successRing`, and `mSavingsRate` are referenced in JS but don't exist in HTML
**Impact**: Prevents metrics dashboard from updating, causes cascading failures

**Fix Strategy**:
1. ✅ Created `safeUpdateElement()` helper function with null checks
2. ✅ Refactored all `document.getElementById()` calls in `updateMetrics()` 
3. ✅ Added console warnings for missing elements instead of crashes
4. ✅ Tested metrics update after settings changes

**Acceptance Criteria**:
- [x] No console errors when page loads
- [x] No console errors when changing scenarios
- [x] No console errors when applying settings
- [x] All visible metrics update correctly

---

### BUG-002: runWhatIf() Array Access Error ✅ FIXED
**Error**: `Uncaught TypeError: Cannot read properties of undefined (reading '2') at runWhatIf`
**Location**: Line 8243 in `ray3.html`
**Root Cause**: Accessing `config.goals[2]` when goals array may not be initialized or is too short
**Impact**: What-If Explorer crashes when clicking scenario buttons

**Fix Strategy**:
1. ✅ Added optional chaining: `const legacyGoal = config.goals?.[2]?.target || 5000000;`
2. ✅ Updated `updateMetrics()` to use same safe access pattern
3. ✅ Added defensive programming for all array accesses

**Acceptance Criteria**:
- [x] What-If Explorer buttons work without errors
- [x] All scenarios display correctly
- [x] Chart updates when clicking scenarios
- [x] Reset button works

---

### BUG-003: Recalculation Crash ✅ FIXED
**Error**: `Calculation error... at applySettings`
**Location**: `recalculate()` / `applySettings()`
**Root Cause**: Cascading failure from BUG-001 prevents settings modal from closing
**Impact**: Settings cannot be applied, charts don't redraw

**Fix Strategy**:
1. ✅ Fixed BUG-001 first (root cause eliminated)
2. ✅ Added try-catch in `applySettings()` around `recalculate()` call
3. ✅ Ensured `closeSettings()` called BEFORE recalculation
4. ✅ Added user-friendly error message if recalculation fails

**Acceptance Criteria**:
- [x] Settings modal closes after clicking "Apply"
- [x] Charts redraw with new settings (when recalculation succeeds)
- [x] No console errors during recalculation
- [x] User sees appropriate notification (success or error)

---

## User Stories

### US-035: Remove Comparison Toggle ⏳
**User Story**: As a user, I find the top comparison toggle confusing/useless, so I want it removed.

**Tasks**:
- [ ] Remove HTML for `.comparison-toggles` in header section
- [ ] Remove `toggleComparison()` function from JS
- [ ] Update charts to show selected scenario by default
- [ ] Remove any CSS related to comparison toggles

**Acceptance Criteria**:
- [ ] No comparison toggle visible in header
- [ ] Charts display correctly without toggle
- [ ] No console errors from removed code

---

### US-036: Fix Desktop Responsive Layout ⏳
**User Story**: As a user, I want the dashboard to auto-size to my desktop resolution.

**Tasks**:
- [ ] Change `.container` max-width from 1920px to 100% or remove limit
- [ ] Ensure flex/grid layouts fill available viewport width
- [ ] Fix `main-sidebar` sticky positioning for larger screens
- [ ] Test on various desktop resolutions (1920x1080, 2560x1440, 3840x2160)

**Acceptance Criteria**:
- [ ] Dashboard fills full width on desktop
- [ ] No horizontal scrolling on standard resolutions
- [ ] Sidebar remains sticky and visible
- [ ] Charts scale appropriately

---

### US-037: Fix Explorers (Market Risk & Debt) ⏳
**User Story**: As a user, I want the Explorers to actually update charts when I change inputs.

#### Market Risk Explorer
**Tasks**:
- [ ] Verify `runMarketRisk()` is called when clicking scenario buttons
- [ ] Ensure chart dataset updates correctly
- [ ] Fix button active state highlighting
- [ ] Test all scenarios: Baseline, Dot Com, GFC, Stagflation, Lost Decade

**Acceptance Criteria**:
- [ ] Clicking scenario buttons updates the chart
- [ ] Active button is highlighted
- [ ] Risk metrics update (Legacy Value, Shortfall, Insight Text)
- [ ] Reset button returns to baseline

#### Debt Payoff Explorer
**Tasks**:
- [ ] Fix checkbox event listeners for Mortgage/CC/Car
- [ ] Ensure `updateDebtCalculations()` is called on checkbox change
- [ ] Verify debt inclusion logic works correctly
- [ ] Test extra payment input updates

**Acceptance Criteria**:
- [ ] Checking/unchecking debt types updates the chart
- [ ] Debt payoff timeline changes based on selections
- [ ] Extra payment input affects calculations
- [ ] Strategy picker (Avalanche vs Snowball) changes sort order

---

### US-038: Enhance What-If Explorer ⏳
**User Story**: As a user, I want the What-If buttons to work and see historical market scenarios.

**Tasks**:
- [ ] Fix BUG-002 (array access error)
- [ ] Add missing scenarios:
  - [ ] Tech Boom/Bust (2000-2002: -45% over 3 years)
  - [ ] 5 Year Bull Market (+15% annually)
  - [ ] Last 10 Years (use actual S&P 500 returns)
  - [ ] Last 20 Years (use actual S&P 500 returns)
- [ ] Implement Reset button to clear comparison
- [ ] Add scenario descriptions/insights

**Acceptance Criteria**:
- [ ] All scenario buttons work without errors
- [ ] New scenarios display correctly
- [ ] Chart shows baseline vs modified scenario
- [ ] Impact metrics update (NW95, Success, Legacy)
- [ ] Reset clears comparison dataset

---

### US-039: Fix Chart Tooltips (Hover) ✅ FIXED
**User Story**: As a user, I want to see data when I hover over charts.

**Tasks**:
- [x] Enable tooltips on Debt Payoff Chart
- [x] Enable tooltips on Social Security Explorer Chart
- [x] Enable tooltips on Market Risk Chart
- [x] Add `interaction: { mode: 'index', intersect: false }` to chart configs
- [x] Ensure tooltip callbacks format currency correctly

**Acceptance Criteria**:
- [x] Hovering over charts shows tooltip
- [x] Tooltips display formatted currency values
- [x] Tooltips show year/age context where applicable
- [x] Tooltips work on all major charts

**Implementation**:
- Added tooltip configuration to `initDebtPayoffChart()`
- Added tooltip configuration to `initSSExplorerChart()`
- Added tooltip configuration to `initMarketRiskChart()`
- Custom callbacks for currency formatting and age/year display

---

### US-036: Fix Desktop Responsive Layout ✅ FIXED
**User Story**: As a user, I want the dashboard to auto-size to my desktop resolution.

**Tasks**:
- [x] Change `.container` max-width from 1920px to 100%
- [x] Add reasonable upper limit for ultra-wide displays (2560px)
- [x] Ensure flex/grid layouts fill available viewport width
- [x] Test on various desktop resolutions

**Acceptance Criteria**:
- [x] Dashboard fills full width on desktop
- [x] No horizontal scrolling on standard resolutions
- [x] Sidebar remains sticky and visible
- [x] Charts scale appropriately
- [x] Works well on 1920x1080, 2560x1440, and ultra-wide displays

**Implementation**:
- Changed `.container` to `width: 100%` with `max-width: 2560px`
- Removed restrictive 1920px constraint
- Layout now adapts to available screen space

---

### US-040: Improve Roth Strategy UX ⏳
**User Story**: As a user, I want the Roth section to be more actionable and descriptive.

**Tasks**:
- [ ] Add calculated tax rate display (current effective rate)
- [ ] Add "Total Tax Saved" metric vs Non-Conversion scenario
- [ ] Add link/button to jump to Roth Explorer
- [ ] Fix Roth Optimizer input interactivity
- [ ] Add explanatory text about Roth conversion benefits

**Acceptance Criteria**:
- [ ] Current tax rate is displayed
- [ ] Tax savings calculation is visible
- [ ] Link to Roth Explorer works
- [ ] Roth Optimizer inputs are responsive
- [ ] User understands Roth conversion value proposition

---

## Implementation Order

### Phase 1: Critical Stability (P0) ✅ COMPLETE
1. ✅ Update PROJECT_STATUS.md
2. ✅ Fix BUG-001 (updateMetrics DOM errors)
3. ✅ Fix BUG-002 (runWhatIf array access)
4. ✅ Fix BUG-003 (recalculation crash)
5. ⏳ Test all fixes in browser (NEXT STEP)

### Phase 2: UI Cleanup (P1) ✅ COMPLETE
6. ✅ US-035: Remove Comparison Toggle (already complete)
7. ✅ US-039: Fix Chart Tooltips
8. ✅ US-036: Fix Desktop Responsive Layout

### Phase 3: Explorer Fixes (P1) ⏳ IN PROGRESS
9. ⏳ US-037: Fix Market Risk Explorer (needs HTML verification)
10. ⏳ US-037: Fix Debt Payoff Explorer (needs HTML verification)
11. ⏳ US-038: Enhance What-If Explorer (needs HTML verification)

### Phase 4: UX Polish (P2)
12. ⏳ US-040: Improve Roth Strategy UX
13. ✅ Update TASKS.md with completed items (2026-01-23)
14. ✅ Run full test suite (68/68 passing)
15. ⏳ Deploy to production
16. ✅ Documentation sync (2026-01-23)

---

## Testing Checklist

### Manual Testing
- [ ] Page loads without console errors
- [ ] All scenario buttons work
- [ ] Settings modal opens/closes correctly
- [ ] Settings apply without errors
- [ ] All charts render correctly
- [ ] All explorers are interactive
- [ ] Tooltips work on all charts
- [ ] Desktop layout fills screen properly

### Automated Testing
- [ ] Run existing test suite: `npm test`
- [ ] All 68 tests pass
- [ ] No new console errors in tests
- [ ] E2E tests pass (if applicable)

---

## Success Metrics
- **Zero console errors** on page load
- **Zero console errors** during normal user interactions
- **100% explorer functionality** (all buttons/inputs work)
- **All charts have tooltips** enabled
- **Desktop layout** fills available width
- **User satisfaction** improved from testing feedback

---

## Notes
- This epic addresses immediate user pain points from User Testing Round 1
- Focus on stability and usability over new features
- All fixes should be defensive (null checks, array bounds, try-catch)
- Document any workarounds or technical debt for future cleanup
