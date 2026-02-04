# LAYOUT SPECIFICATION (LINEAR ROW MAP)

**Visual Target:** Center of Screen / Main Content Area
**Constraint:** Each "ROW" defined below must be a SEPARATE `<div>` container using CSS Grid.
**Width:** Max 2560px, Centered.

---

## CRITICAL IMPLEMENTATION RULES

### Rule 1: No `span-*` Classes on Chart Cards
Chart partials must use `class="card"` only. Do NOT use `span-4`, `span-6`, etc. The parent grid container in `index.html` handles column layout.

### Rule 2: Full-Width Rows (3, 4, 13) Must Match Styling
Rows 3 (Milestones), 4 (Coach), and 13 (Monte Carlo) use:
- `class="card ... w-full"` - Full width
- `flex flex-col lg:flex-row` - Horizontal layout on desktop
- `divide-y lg:divide-y-0 lg:divide-x` - Dividers between items

### Rule 3: No Wrapper Divs Around Grid Children
Grid children (chart partials) must be loaded DIRECTLY into the grid container. Do NOT wrap them in extra `<div>` elements as this constrains their size.

**WRONG:**
```html
<div class="grid grid-cols-2">
    <load src="chart1.html" />
    <div class="flex items-center"> <!-- BAD: constrains width -->
        <load src="chart2.html" />
    </div>
</div>
```

**CORRECT:**
```html
<div class="grid grid-cols-2">
    <load src="chart1.html" />
    <load src="chart2.html" />
</div>
```

---

## THE LINEAR MAP (Implement exactly 13 Rows)

### ROW 1: Key Metrics
**Grid:** `grid-cols-7` (Strict single line)
1. Net Worth
2. Peak Net Worth
3. Success
4. Wellness
5. Retire Age
6. SS Benefit
7. Taxes

### ROW 2: Comprehensive Metrics
**Grid:** `grid-cols-6` (Strict single line)
1. Financial Health
2. Progress
3. Debt & Cash
4. Taxes & Home
5. Legacy
6. Risk

### ROW 3: Milestones
**Layout:** `w-full` with `flex-row` internal layout (matches Row 4 styling)
**Card Style:** `card border-success/30 overflow-hidden w-full`
**Internal:** `flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x`
1. Milestones Component (horizontal items on desktop)

### ROW 4: Plan Optimizer & Coach
**Layout:** `w-full` (Single horizontal container)
**Card Style:** `card border-primary/30 overflow-hidden w-full`
**Internal:** `flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x`
1. Liquidity Gap | SS Optimization | Tax Leakage (horizontal on desktop)

### ROW 5: Tools & Calculators
**Grid:** `grid-cols-3`
1. Explorer Year (Slider)
2. Year By Year Financial Data (Button/Modal)
3. What You Need Calculator

### ROW 6: Portfolio Charts
**Grid:** `grid-cols-3`
1. Net Worth Comparison
2. Allocation - 2026
3. Legacy & Estate Impact

### ROW 7: Cash Flow Charts
**Grid:** `grid-cols-3`
1. Income Sources
2. Surplus / Gap
3. Money Flow - 2026

### ROW 8: Expense Charts
**Grid:** `grid-cols-3`
1. Expenses
2. Pie - 2026
3. Healthcare

### ROW 9: Tax & SS Charts
**Grid:** `grid-cols-3`
1. Tax Burden & Effective Rate
2. Social Security Strategy
3. Social Security Cumulative Comparison

### ROW 10: Optimization Charts
**Grid:** `grid-cols-3`
1. Roth Conversion Plan
2. Plan Improvement (Delta)
3. Plan Improvement (Cumulative Tax Delta)

### ROW 11: Stress Test Charts
**Grid:** `grid-cols-3`
1. What-if Explorer
2. Inflation & Market Stress
3. Sequence of Returns Risk

### ROW 12: Withdrawal Strategy
**Grid:** `grid-cols-2` (Each chart fills 50% width)
**IMPORTANT:** No wrapper divs around partials!
1. Withdrawal Strategy (left 50%)
2. Safe Withdrawal Strategy (right 50%)

### ROW 13: Monte Carlo
**Layout:** `w-full` (Full width container)
1. Monte Carlo Analysis (Single line by itself)