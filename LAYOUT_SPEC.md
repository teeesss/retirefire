# LAYOUT SPECIFICATION (LINEAR ROW MAP)

**Visual Target:** Center of Screen / Main Content Area
**Constraint:** Each "ROW" defined below must be a SEPARATE `<div>` container using CSS Grid.
**Width:** Max 2560px, Centered.

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
**Grid:** `col-span-full` (Single horizontal bar)
1. Milestones Component

### ROW 4: Plan Optimizer & Coach
**Grid:** `w-full` (Single horizontal container)
**Internal Layout:** Flex Row (Left: Liquidity Gap, Center: SS Optimization, Right: Tax Leakage)

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
**Grid:** `grid-cols-2`
1. Withdrawal Strategy
2. Safe Withdrawal Strategy (Centered content)

### ROW 13: Monte Carlo
**Grid:** `col-span-full`
1. Monte Carlo Analysis (Single line by itself)