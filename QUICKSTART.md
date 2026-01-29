# QuickStart Guide - P1 Optimization Phase

**Last Updated**: 2026-01-29  
**Current Status**: 100% Tests Passing (26/26 Unit/Logic) ✅  
**Current Sprint**: P1 - High-Fidelity Explorers & Quality of Life

---

## 🎯 Sprint Goal

**Enhance professional transparency and stress testing capabilities.**

**Duration**: Jan 29 - Feb 05  
**Team Size**: 1 developer (AI Augmented)  
**Success Criteria**: Monte Carlo Scenarios implemented, Withdrawal Strategy visualized, 100% tests passing.

---

## 📋 Ongoing Work (Prioritized)

### 1. Enhanced Monte Carlo Scenarios ✅ COMPLETE
**Objective**: Move beyond random Gaussian returns to historical stress testing.
- Added 100-year S&P 500 return data (`src/data/HistoricalData.js`)
- Implemented "1970s Stagflation", "2000s Dot-com", and "Great Depression" sequences.
- Added Historical Bootstrapping for fat-tail risk analysis.

### 2. ISSUE-026: Detailed Withdrawal Strategy 🟡 IN PROGRESS
**Objective**: Show account-by-account breakdown (Tax-Deferred vs. Roth vs. Taxable).
- Plan: Update `SimulationEngine` to track yearly account pull amounts.
- UI: Implement stacked bar chart in `withdrawal-strategy-charts.html`.

### 3. Social Security Explorer Sync ✅ COMPLETE
**Objective**: Align claiming age logic with lifetime value graphs.
- Fixed birth year offsets (ISSUE-074).
- Synchronized "Cumulative vs Annual" toggle.

---

## 🧪 Testing Strategy

### Automated Logic Verification (Vitest)
```bash
npx vitest run tests/unit/MonteCarlo.test.js  # MC Logic
npx vitest run tests/unit/Diagnostic.test.js  # Full Engine Scan
```

### Manual UI Verification
1. Run `npm run dev`
2. Open Chrome with Remote Debugging:
   `start chrome.exe --remote-debugging-port=9222 --user-data-dir="C:\temp\chrome-mcp-profile"`
3. Verify `mcScenario` dropdown in Monte Carlo section.
4. Verify colors in Net Cash Flow (Surplus vs Gap).

---

## 🔧 Development Environment

### MCP Tooling (Windows specific)
If `chrome-devtools` returns EOF, check `mcp_config.json`:
- Use direct `node.exe` path.
- Use absolute path to the global `node_modules` for `chrome-devtools-mcp`.
- Ensure `--autoConnect` flag is present.

### Deployment Workflow
```bash
# Don't use && in PowerShell; use ;
npm run build; npm run deploy
```

---

## 📚 Reference Documents
- `TASKS.md` - Sprint planning and user stories
- `ISSUES.md` - Bug tracking log  
- `PROJECT_STATUS.md` - Current health metrics
- `.cursorrules` - Persistent project rules and lessons learned

---

**Next Task**: Proceed to ISSUE-026: Withdrawal Strategy Breakdown Visualization.
