# TASK-008: Monte Carlo Enhancements - Implementation Plan

**Created**: 2026-02-02  
**Status**: In Progress  
**Priority**: MEDIUM  
**Estimated Effort**: 6-8 hours

---

## Overview

Expand Monte Carlo analysis with additional historical range options, enhanced visualizations, and better scenario controls. The UI already has infrastructure for historical scenarios, but we need to add "Last 30 years" option and improve the visualization of confidence intervals.

---

## Current State Analysis

### ✅ Already Implemented
- Monte Carlo simulation engine with seeded RNG
- Historical bootstrap (random year selection)
- Historical periods: Last 10 Years, Last 20 Years, 1970s, Dotcom, Depression
- Volatility controls (10%, 15%, 25%)
- Spending flexibility slider (50%-150%)
- Precision controls (100, 1000, 5000 iterations)
- Percentile calculations (10th, 25th, 50th, 75th, 90th)
- Success rate and legacy goal probability

### 🔧 Needs Enhancement
1. Add "Last 30 years" historical range option (ISSUE-035)
2. Improve confidence interval visualization
3. Add more granular spend rate scenarios
4. Enhance market condition descriptions

---

## Implementation Phases

### **Phase 1: Add "Last 30 Years" Historical Option** ⏱️ 1 hour

**Files to Modify:**
- `src/partials/charts/montecarlo-analysis.html` - Add UI option
- `src/engine/SimulationEngine.js` - Already supports it via `last-30` pattern

**Changes:**
1. Add `<option value="last-30">Last 30 Years (Full Cycle)</option>` to the dropdown
2. Test that the existing `last-` pattern matching works correctly
3. Verify historical data coverage (100 years of S&P 500 data available)

**Testing:**
- Verify "Last 30 years" option appears in dropdown
- Confirm simulation uses correct historical data range
- Check that results differ from "Last 10" and "Last 20" appropriately

---

### **Phase 2: Enhanced Confidence Interval Visualization** ⏱️ 3-4 hours

**Files to Modify:**
- `src/charts/MonteCarloCharts.js` - Enhance chart rendering
- `src/style.css` - Add styling for enhanced visualizations

**Changes:**
1. **Gradient Fill for Confidence Bands**
   - Add semi-transparent gradient between 10th-90th percentiles
   - Use color coding: green (good), amber (caution), red (risk)
   - Implement smooth transitions between bands

2. **Interactive Tooltips**
   - Show all percentiles on hover
   - Display success probability for that year
   - Show market scenario being simulated

3. **Percentile Lines Enhancement**
   - Make median line (50th) more prominent
   - Add subtle dashed lines for 25th and 75th percentiles
   - Improve legend clarity

**Design Decisions:**
- Use Chart.js plugins for custom rendering
- Maintain performance with large datasets (5000 iterations)
- Ensure accessibility (color-blind friendly palette)

---

### **Phase 3: Spend Rate Scenario Enhancements** ⏱️ 1-2 hours

**Files to Modify:**
- `src/partials/charts/montecarlo-analysis.html` - Add preset buttons
- `src/charts/MonteCarloCharts.js` - Add quick-select handlers

**Changes:**
1. Add preset spend rate buttons: 50%, 75%, 100%, 125%, 150%
2. Keep existing slider for fine-tuning
3. Add visual indicator of current selection
4. Show impact description (e.g., "Conservative: 50% spending reduces risk")

**UI Design:**
```html
<div class="spend-presets">
    <button class="preset-btn" data-value="0.5">50% (Conservative)</button>
    <button class="preset-btn active" data-value="1.0">100% (Planned)</button>
    <button class="preset-btn" data-value="1.5">150% (Aggressive)</button>
</div>
```

---

### **Phase 4: Market Condition Descriptions** ⏱️ 1 hour

**Files to Modify:**
- `src/partials/charts/montecarlo-analysis.html` - Add descriptions
- `src/style.css` - Style info tooltips

**Changes:**
1. Add descriptive text for each market scenario
2. Show expected characteristics (volatility, returns, duration)
3. Add historical context tooltips

**Example Descriptions:**
- **Last 30 Years**: "Full market cycle including 2000 Dotcom, 2008 GFC, and 2020 COVID recovery"
- **1970s Stagflation**: "High inflation (7-10%), oil crisis, poor stock returns"
- **Dotcom/GFC**: "Two major crashes within a decade, severe sequence risk"

---

### **Phase 5: Testing & Documentation** ⏱️ 1 hour

**Testing Requirements:**
1. **Unit Tests**
   - Test "Last 30 years" data range selection
   - Verify percentile calculations remain accurate
   - Test spend rate preset functionality

2. **Integration Tests**
   - Full Monte Carlo run with new scenarios
   - Chart rendering with enhanced visualizations
   - Performance testing with 5000 iterations

3. **Visual Testing**
   - Screenshot comparisons of confidence bands
   - Color accessibility checks
   - Mobile responsiveness

**Documentation:**
- Update TASKS.md with completion status
- Update ISSUES.md to mark ISSUE-034 and ISSUE-035 as fixed
- Add inline code comments for new visualization logic

---

## Success Criteria

✅ "Last 30 years" option available and functional  
✅ Enhanced confidence interval visualization with gradient fills  
✅ Spend rate preset buttons working correctly  
✅ Market scenario descriptions visible and helpful  
✅ All tests passing (unit + integration)  
✅ Performance maintained (<3s for 1000 iterations)  
✅ Documentation updated

---

## Risk Mitigation

**Risk**: Chart.js performance degradation with gradient fills  
**Mitigation**: Use canvas optimization, limit gradient complexity

**Risk**: Historical data accuracy for "Last 30 years"  
**Mitigation**: Verify against known S&P 500 returns, add data validation

**Risk**: UI clutter with additional controls  
**Mitigation**: Use collapsible sections, maintain clean hierarchy

---

## Next Steps After Completion

1. Consider adding custom scenario builder (user-defined return sequences)
2. Add downloadable Monte Carlo report (PDF/CSV)
3. Implement scenario comparison view (side-by-side)
4. Add inflation-adjusted results toggle
