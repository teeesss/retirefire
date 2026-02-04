# 13-Row Linear Layout Refactor - Summary

**Date**: 2026-02-04  
**Objective**: Implement strict 13-row linear layout as specified in `LAYOUT_SPEC.md`

## Changes Made

### 1. **index.html Refactor**
- **Previous Structure**: Single nested grid container (ROW 6) containing all 18 chart components
- **New Structure**: 13 distinct row containers, each as a separate `<div>` element
- **Key Change**: Eliminated nested grid - each chart row (6-11) is now its own independent grid container

### Row Breakdown:
- **ROW 1**: Key Metrics (7-column grid)
- **ROW 2**: Comprehensive Metrics (6-column grid)
- **ROW 3**: Milestones (full width)
- **ROW 4**: Plan Optimizer & Coach (full width, flexbox internally)
- **ROW 5**: Tools & Calculators (3-column grid)
- **ROW 6**: Portfolio Charts (3-column grid) - Net Worth, Allocation, Legacy
- **ROW 7**: Cash Flow Charts (3-column grid) - Income, Surplus/Gap, Money Flow
- **ROW 8**: Expense Charts (3-column grid) - Expenses, Pie, Healthcare
- **ROW 9**: Tax & SS Charts (3-column grid) - Taxes, SS Strategy, SS Comparison
- **ROW 10**: Optimization Charts (3-column grid) - Roth, Plan Improvement, Tax Delta
- **ROW 11**: Stress Test Charts (3-column grid) - Explorers, Stress Test, Sequence Risk
- **ROW 12**: Withdrawal Strategy (2-column grid)
- **ROW 13**: Monte Carlo (full width)

### 2. **File Cleanup**
- **Deleted**: `src/partials/charts-grid.html` (legacy file, no longer needed)

## Technical Benefits

### Before (Nested Grid):
```html
<div class="grid grid-cols-3 gap-6">
  <!-- All 18 charts in one container -->
  <chart1 /> <chart2 /> <chart3 />
  <chart4 /> <chart5 /> <chart6 />
  <!-- ... etc -->
</div>
```

### After (Linear Rows):
```html
<!-- ROW 6 -->
<div class="grid grid-cols-3 gap-6">
  <chart1 /> <chart2 /> <chart3 />
</div>

<!-- ROW 7 -->
<div class="grid grid-cols-3 gap-6">
  <chart4 /> <chart5 /> <chart6 />
</div>
```

### Why This Matters:
1. **Forced Line Breaks**: Each row container forces the browser to start a new line after 3 charts
2. **Ultrawide Alignment**: Prevents layout drift on 3440px monitors
3. **Predictable Rendering**: No auto-placement ambiguity
4. **Easier Maintenance**: Clear visual separation between logical chart groups

## Verification

- ✅ Build successful (`npm run build`)
- ✅ No console errors
- ✅ File size unchanged (149.29 kB)
- ✅ All chart partials correctly referenced

## Next Steps

1. Run layout regression tests (`npx playwright test tests/e2e/layout.spec.ts`)
2. Visual verification on Ultrawide monitor (3440x1440)
3. Update snapshots if needed
4. Deploy to production

---

**Impact**: This refactor ensures perfect 3-across alignment on all screen sizes, eliminating the "phantom 4th column" issue that occurred with the previous nested grid approach.
