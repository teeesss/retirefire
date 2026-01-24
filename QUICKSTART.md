# QuickStart Guide - Next Sprint

**Last Updated**: 2026-01-23  
**Current Status**: 100% Tests Passing ✅  
**Next Sprint**: Critical Dashboard Fixes

---

## 🎯 Sprint Goal

**Fix all P0 critical dashboard issues to restore full functionality**

**Duration**: 2-3 days  
**Team Size**: 1 developer  
**Success Criteria**: All P0 issues resolved, 100% tests passing

---

## 📋 Sprint Backlog (Prioritized)

### 1. ISSUE-017: Fix Dashboard Metrics 🔴
**Effort**: 4 hours | **Priority**: P0 - CRITICAL

**Problem**:
- Net Worth showing $0
- Peak showing -$InfinityB  
- Age showing undefined

**Root Cause**: Dashboard metric calculation logic broken

**Fix Steps**:
1. Open `src/main.js`
2. Find `updateDashboard()` function
3. Debug metric calculations:
   - `metricCurrentNW` - should use `calculateNetWorth()`
   - `metricPeakNW` - should find max net worth across years
   - `metricRetireAge` - should use `config.settings.personal.retireAge`
4. Add null checks and default values
5. Test with `npm run dev` and verify dashboard
6. Add E2E test to validate metrics
7. Run `npm test` to ensure 100% passing

**Files to Modify**:
- `src/main.js` (updateDashboard function)
- `tests/e2e/comprehensive.test.js` (add validation)

---

### 2. ISSUE-021-023: Fix Spending Slider Integration 🔴
**Effort**: 6 hours | **Priority**: P0 - CRITICAL

**Problem**:
- Year slider not tied to spending slider
- Changing spending doesn't update projections
- Inverse relationship broken (more spending should = lower NW)

**Fix Steps**:
1. Open `src/main.js`
2. Find `updateSpendingSlider()` function
3. Link to `recalculate()` to trigger full recalculation
4. Ensure spending changes update `config.settings.expenses.annualSpending`
5. Verify SimulationEngine uses updated spending value
6. Test inverse relationship (increase spending = lower NW)
7. Add E2E test for slider interaction
8. Run `npm test` to ensure 100% passing

**Files to Modify**:
- `src/main.js` (updateSpendingSlider, recalculate)
- `src/engine/SimulationEngine.js` (verify spending usage)
- `tests/e2e/comprehensive.test.js` (add slider test)

---

### 3. ISSUE-054: Fix Home Equity Calculation 🔴
**Effort**: 3 hours | **Priority**: P0 - CRITICAL

**Problem**:
- Home equity shows $0 at age 56 when house not sold

**Fix Steps**:
1. Open `src/engine/SimulationEngine.js`
2. Find home equity calculation logic
3. Ensure home value appreciates when not selling
4. Home equity = home value - mortgage balance
5. Only set to $0 after sale year
6. Add test for home equity calculation
7. Run `npm test` to ensure 100% passing

**Files to Modify**:
- `src/engine/SimulationEngine.js` (home equity logic)
- `tests/unit/SimulationEngine.test.js` (add home equity test)

---

### 4. ISSUE-040: Auto-Calculate Social Security 🔴
**Effort**: 6 hours | **Priority**: P0 - CRITICAL

**Problem**:
- SS benefits should auto-calculate from income history
- Currently requires manual input

**Fix Steps**:
1. Create `src/engine/SocialSecurityCalculator.js`
2. Implement AIME calculation from work income
3. Implement PIA calculation with bend points
4. Adjust for claiming age (62-70)
5. Integrate with SimulationEngine
6. Add UI toggle for auto vs manual
7. Add unit tests for SS calculations
8. Run `npm test` to ensure 100% passing

**Files to Create**:
- `src/engine/SocialSecurityCalculator.js`

**Files to Modify**:
- `src/engine/SimulationEngine.js` (integrate SS calc)
- `src/main.js` (add UI toggle)
- `tests/unit/SocialSecurityCalculator.test.js` (new test file)

---

### 5. ISSUE-028 & 046: Interactive Roth Conversion 🔴
**Effort**: 8 hours | **Priority**: P0 - CRITICAL

**Problem**:
- Roth conversion graph not useful without controls
- User can't select which accounts to convert from
- No comparison feature

**Fix Steps**:
1. Create `src/components/RothConversionControls.js`
2. Add account selection UI (checkboxes for each account)
3. Add conversion amount slider
4. Add comparison toggle (with/without conversions)
5. Update graph to show comparison
6. Show tax cost, savings, break-even age
7. Add tests for Roth conversion logic
8. Run `npm test` to ensure 100% passing

**Files to Create**:
- `src/components/RothConversionControls.js`

**Files to Modify**:
- `src/main.js` (integrate controls)
- `index.html` (add controls to Roth section)
- `tests/e2e/comprehensive.test.js` (add Roth tests)

---

## 🧪 Testing Strategy

### Before Starting
```bash
npm test  # Verify 100% passing (76/76)
```

### During Development
```bash
npm run dev  # Start dev server
# Test changes in browser
npm test     # Run tests after each fix
```

### After Each Fix
1. Verify fix in browser
2. Run relevant tests
3. Ensure 100% pass rate maintained
4. Update documentation

### Before Completing Sprint
```bash
npm test              # All tests must pass
npm run build         # Verify build succeeds
npm run deploy        # Deploy to production
```

---

## 📝 Documentation Updates

### After Each Fix
1. Update `ISSUES.md` - Mark issue as ✅ FIXED
2. Update `TASKS.md` - Mark user story as complete
3. Update `PROJECT_STATUS.md` - Update progress metrics
4. Commit with descriptive message

### Sprint Completion
1. Create sprint summary document
2. Update all MD files with final status
3. Document lessons learned
4. Plan next sprint

---

## 🔧 Development Environment

### Required Tools
- Node.js 18+
- npm
- Code editor (VS Code recommended)
- Chrome/Firefox for testing

### Setup
```bash
cd c:/projects/RetireFire/retirefire
npm install
npm run dev  # Start dev server on http://localhost:5173
```

### Useful Commands
```bash
npm test                      # Run all tests
npm run test:watch            # Watch mode
npm run test:e2e:comprehensive # E2E tests only
npm run lint                  # Check code quality
npm run build                 # Build for production
npm run deploy                # Deploy to server
```

---

## 🎯 Success Metrics

### Sprint Goals
- [ ] All 6 P0 issues resolved
- [ ] 100% test pass rate maintained (76/76)
- [ ] Dashboard displays correct values
- [ ] Spending slider updates projections
- [ ] Home equity calculates correctly
- [ ] Social Security auto-calculates
- [ ] Roth conversion has interactive controls

### Quality Gates
- ✅ All tests passing
- ✅ No console errors
- ✅ No regressions
- ✅ Documentation updated
- ✅ Code reviewed
- ✅ Deployed successfully

---

## 📚 Reference Documents

### Primary Docs
- `TASKS.md` - User stories and sprint planning
- `ISSUES.md` - Bug tracking and priorities  
- `PROJECT_STATUS.md` - Overall project status

### Technical Docs
- `tests/README.md` - Test suite guide
- `COMPREHENSIVE_TEST_REPORT.md` - Test details
- `100_PERCENT_ACHIEVEMENT.md` - Test achievement

### Feature Docs
- `GAP_FIXES_REPORT.md` - Recent gap fixes
- `BOLDIN_GAP_ANALYSIS.md` - Feature parity analysis

---

## 🚀 Getting Started

### Step 1: Review Current State
```bash
npm test  # Verify 100% passing
npm run dev  # Start dev server
# Open http://localhost:5173
# Review dashboard - note broken metrics
```

### Step 2: Pick First Issue
Start with **ISSUE-017** (Fix Dashboard Metrics)
- Smallest scope (4 hours)
- Highest visibility
- Unblocks other work

### Step 3: Make Changes
1. Create feature branch (optional)
2. Make code changes
3. Test in browser
4. Run tests
5. Update docs

### Step 4: Verify & Deploy
```bash
npm test  # Must be 100% passing
npm run build
npm run deploy
```

### Step 5: Move to Next Issue
Repeat for remaining P0 issues

---

## 💡 Tips for Success

### Development
- Test frequently in browser
- Run tests after each change
- Keep changes small and focused
- Commit often with clear messages

### Testing
- Maintain 100% pass rate
- Add tests for new features
- Fix failing tests immediately
- Don't skip test runs

### Documentation
- Update docs as you go
- Don't wait until end of sprint
- Be specific in commit messages
- Keep ISSUES.md and TASKS.md in sync

### Quality
- No regressions allowed
- Fix root causes, not symptoms
- Follow existing code patterns
- Ask for help if stuck

---

## 🎉 Sprint Completion Checklist

- [ ] All P0 issues resolved
- [ ] 100% test pass rate (76/76)
- [ ] Dashboard metrics correct
- [ ] Spending slider integrated
- [ ] Home equity fixed
- [ ] Social Security auto-calculates
- [ ] Roth conversion interactive
- [ ] All documentation updated
- [ ] Code committed and pushed
- [ ] Deployed to production
- [ ] Sprint summary created

---

**Ready to Start?** Begin with ISSUE-017 (Fix Dashboard Metrics)

**Questions?** Review `PROJECT_STATUS.md` for context

**Need Help?** Check existing code patterns in `src/main.js`

**Good Luck!** 🚀
