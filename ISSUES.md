# Issues & Fixes Log

---

## Fixed Issues ✅

| Issue | Description | Fix Applied |
|-------|-------------|-------------|
| ISSUE-001 | Duplicate scenario controls confusing | Added "📊 View Scenario:" and "🔀 Compare:" labels |
| ISSUE-002 | Mortgage shows 15 years, should be 8 | Changed to 8 years, payoff at age 57-58 |
| ISSUE-003 | Roth conversion section confusing | Added toggle, tax savings, break-even age, comparison |
| ISSUE-004 | Some charts may not render | Verified all 25+ charts, created test suite |
| ISSUE-005 | Charts don't update on scenario change | Fixed chart update functions |
| ISSUE-006 | Data is Hardcoded - No Dynamic Recalculation | Implemented `SimulationEngine` for dynamic projections |
| ISSUE-007 | Missing Input Validation | Added `validateSettings` function with range checks |
| ISSUE-008 | SS Display Inconsistency | Unified SS display to show both Monthly and Yearly values |
| ISSUE-009 | Gap Calculator shows "$0 /mo" initially | Fixed - Now correctly calculates retired income from rawData |
| ISSUE-010 | Money Flow chart showing $0 | Fixed - Now displays actual income/expense breakdown |
| ISSUE-011 | Success Gauge broken calculation | Fixed - Now uses SimulationEngine.runMonteCarlo() directly |
| ISSUE-012 | Missing sidebar navigation | Added persistent left sidebar with section links |
| ISSUE-016 | Duplicate Social Security div broke settings panel | Fixed - Removed duplicate `<div class="settings-section" id="settings-socialsecurity">` on line 4637 |

---

## Known Issues / Future Improvements

| Issue | Description | Priority |
|-------|-------------|----------|
| ISSUE-013 | Sidebar active highlighting on scroll uses wrong container | Low - Navigation works, cosmetic issue |
| ISSUE-014 | Scenario switching triggers internal warning | Low - Functionality works, warning is benign |
| ISSUE-015 | Some charts use default 300x150 size | Medium - Consider responsive sizing |
| **ISSUE-017** | **Net Worth showing $0, Peak showing -$InfinityB, Age undefined** | **Critical - Dashboard broken** |
| **ISSUE-018** | **"Compare" button at top doesn't work / seems useless** | **High - Remove or fix** |
| **ISSUE-019** | **"What You Need" calculator outdated / only shows Age 53** | **High - Needs refresh logic** |
| **ISSUE-020** | **"What You Need" target income should be slider, not static** | **Medium - UX improvement** |

---

## Lessons Learned

### Design Principles
1. **Clear labels** - Each control should have descriptive label
2. **Show impact** - Financial features should display cost/benefit
3. **User control** - Allow users to toggle optional features on/off
4. **Consistent formatting** - Use same number format throughout

### Testing Guidelines
1. Test all charts render on page load
2. Test chart tooltips show correct values on hover
3. Test scenario switching updates all charts
4. Test interactive controls (sliders, toggles) work correctly

### Code Editing Principles
1. **Be careful with multi_replace_file_content** - When adding content to nested HTML, ensure you don't duplicate opening/closing tags
2. **Verify HTML structure** - After large edits, verify the DOM structure is valid (no duplicate IDs, proper nesting)
3. **Test settings panel** - After ANY settings-related change, open the settings panel and navigate through all sections
