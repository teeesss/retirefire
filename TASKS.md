# Tasks & User Stories

**Last Updated**: 2026-02-02  
**Test Status**: ✅ 467/478 Tests Passing (97.7%)
**QA Status**: ✅ QA Passed. Ready for Documentation.
**Build Status**: ✅ Vite build passing
**Deployment**: ✅ Live at https://www.bmwseals.com/retirefire/

---

## 🚀 The Immediate Queue (Active Sprint)

### Priority 1: Financial Depth & Advanced Optimizers (P1)
1. **[TASK-001] Enhanced Withdrawal Strategy Display** 🟡  
   - Show account-by-account breakdown in stacked bars.
   - Visualize withdrawal order tax implications.
   - Files: [IncomeExpenseCharts.js](file:///x:/RetirementCalc-BasedOfBoldin/src/charts/IncomeExpenseCharts.js), [SimulationEngine.js](file:///x:/RetirementCalc-BasedOfBoldin/src/SimulationEngine.js)

2. **[TASK-002] Enhanced Social Security Display** 🟡  
   - Implement cumulative lifetime benefits toggle.
   - Support granular claiming age selection (62-70).
   - Files: [SocialSecurityCalculator.js](file:///x:/RetirementCalc-BasedOfBoldin/src/SocialSecurityCalculator.js), [ExplorerCharts.js](file:///x:/RetirementCalc-BasedOfBoldin/src/charts/ExplorerCharts.js)

3. **[TASK-003] Enhanced Data Tables (Tax Detail)** 🟡  
   - Add Roth Conversion yearly breakdown table.
   - Add source-specific tax columns (Federal, State, FICA, capGains).
   - Files: [DashboardDetails.js](file:///x:/RetirementCalc-BasedOfBoldin/src/ui/DashboardDetails.js)

4. **[TASK-004] Monte Carlo Parameters Expansion** 🟡  
   - Add spend rate % variability scenarios.
   - Add historical range selection (last 10/20/30 years).
   - Files: [SimulationEngine.js](file:///x:/RetirementCalc-BasedOfBoldin/src/SimulationEngine.js), [MonteCarloAnalysis.js](file:///x:/RetirementCalc-BasedOfBoldin/src/charts/MonteCarloAnalysis.js)

5. **[TASK-005] Gap Year logic Fix** 🔴  
   - Resolve withdrawal logic bugs for years with zero active income.
   - Files: [SimulationEngine.js](file:///x:/RetirementCalc-BasedOfBoldin/src/SimulationEngine.js)

---

### Priority 2: UI Polish & Enhanced Interactivity (P2)
1. **[TASK-006] "What You Need" Calculator Update** 🟢  
   - Update target age/year to use current user configuration instead of hardcoded Age 53.
   - Files: [GapCalculator.js](file:///x:/RetirementCalc-BasedOfBoldin/src/GapCalculator.js)

2. **[TASK-007] "Compare" Button Implementation** 🟢  
   - Implement multi-scenario side-by-side comparison or remove ineffective header button.
   - Files: [header.html](file:///x:/RetirementCalc-BasedOfBoldin/src/partials/header.html), [main.js](file:///x:/RetirementCalc-BasedOfBoldin/src/main.js)

3. **[TASK-008] Mobile Navigation (Sidebar Toggle)** 🟢  
   - Add responsive collapsed sidebar with mobile toggle.
   - Files: [sidebar.html](file:///x:/RetirementCalc-BasedOfBoldin/src/partials/sidebar.html), [layout.css](file:///x:/RetirementCalc-BasedOfBoldin/src/css/layout.css)

4. **[TASK-009] Tooltip Coverage Expansion** 🟢  
   - Add missing on-hover tooltips to Mortgage Payoff and Goal Tracking charts.
   - Files: [SummaryCharts.js](file:///x:/RetirementCalc-BasedOfBoldin/src/charts/SummaryCharts.js)

5. **[TASK-010] Roth Conversion Break-even Analysis** 🟢  
   - Add break-even year visualization to the Roth deep-dive.
   - Files: [RothDeepDive.js](file:///x:/RetirementCalc-BasedOfBoldin/src/roth/RothDeepDive.js)

---

### Priority 3: Housekeeping (P3)
1. **[TASK-011] Sidebar Highlight Sync** ⚪  
   - Fix "active" section highlighting for the Sidebar on scroll.
2. **[TASK-012] Scenario Switching Warnings** ⚪  
   - Clean up internal console warnings during scenario hot-swapping.

---

## 🎯 Completed Achievements (2026-02-02)
- [x] **SecureStorage**: Implemented AES-256 for local data persistence.
- [x] **P1 Visuals**: Dynamic SS Choice bar and cumulative tooltips.
- [x] **Data Depth**: Marginal tax leakage columns in data tables.
- [x] **Interactivity**: Clickable dashboard metrics for smooth scroll navigation.
- [x] **Optimization**: Code deduplication (-46% file size in engine).
- [x] **MC Growth**: Historical Stress Tests and Seeded PRNG.

## 🎯 Archive (Previous Achievements)
*(See ISSUES.md for full resolution history)*
- [x] Modular HTML architecture (Vite-injected).
- [x] Roth Conversion Center (manual/bracket/hybrid).
- [x] Mortgage Amortization & RMD logic.
- [x] Estate / Legacy value projections.
- [x] Digital Coach insight engine.

---

**Next Proposed Action**: Generate implementation plan for **[TASK-001] Enhanced Withdrawal Strategy Display**.
