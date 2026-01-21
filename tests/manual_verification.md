# Manual Chart Verification Guide

## How to Test

Open `ray3.html` in a browser and follow this checklist to verify each chart works correctly.

---

## Pre-Test Setup
1. Open browser developer console (F12 → Console)
2. Clear local storage: `localStorage.clear()`
3. Refresh page

---

## Chart Hover Test Checklist

| # | Chart Name | Section | Hover Test | Expected |
|---|------------|---------|------------|----------|
| 1 | Net Worth Projection | Top | ✅ Shows year, age, 3 scenario values | Year X (Age Y): $X.XM |
| 2 | Real vs Nominal | After NW | ✅ Shows both values | Nominal: $X, Real: $X |
| 3 | Asset Allocation Pie | Right sidebar | ✅ Shows account & percentage | 401(k): $X (XX%) |
| 4 | Stacked Portfolio | Portfolio section | ✅ Shows all account values | Lists each account |
| 5 | Income Sources Bar | Income section | ✅ Shows income breakdown | Work: $X, SS: $X |
| 6 | SS Comparison | SS section | ✅ Shows cumulative by age | Age 62/67/70 values |
| 7 | Income Replacement | After SS | ✅ Shows percentage | XX% of pre-retirement |
| 8 | Expenses Stacked | Expenses section | ✅ Shows expense categories | General, Medical, etc |
| 9 | Expense Pie | Expenses section | ✅ Shows breakdown | Category: $X |
| 10 | Healthcare | Healthcare section | ✅ Shows Medical + LTC | LTC appears after age X |
| 11 | Taxes Stacked | Tax section | ✅ Shows Federal/FICA/CapGains | $X each |
| 12 | Cumulative Tax | Tax section | ✅ Shows running total | Increases over time |
| 13 | Effective Tax Rate | Tax section | ✅ Shows percentage | XX% |
| 14 | Tax Bracket | Tax section | ✅ Shows bracket | 10-37% |
| 15 | Withdrawal | Withdrawal section | ✅ Shows sources | Drawdown, RMD, SS |
| 16 | SWR | Withdrawal section | ✅ Shows your rate vs 4% | X.X% vs 4% rule |
| 17 | Roth Conversion | Tax Optimization | ✅ Shows conversion amounts | $XXK/year |
| 18 | RMD | Tax section | ✅ Shows RMD amounts | Starts at 73 |
| 19 | Mortgage | Housing section | ✅ Shows balance declining | $0 by age 58 |
| 20 | Account Trends | Trends section | ✅ Shows individual accounts | Can toggle categories |
| 21 | Scenario Comparison | Analysis section | ✅ Bar chart by age | 3 colored bars |
| 22 | Monte Carlo | Risk section | ✅ Shows percentile bands | 10th to 90th |
| 23 | Sequence Risk | Risk section | ✅ Shows risk level by year | Red/Yellow/Green |
| 24 | Legacy | Goals section | ✅ Shows 3 scenarios + goal | Goal line visible |
| 25 | What-If | Analysis section | ✅ Changes on click | Baseline vs Modified |

---

## Interaction Tests

### Scenario Switching
- [ ] Click "Average" button → All charts update
- [ ] Click "Pessimistic" button → Values decrease
- [ ] Click "Optimistic" button → Values return to highest

### Comparison Toggles
- [ ] Toggle off "Average" → Line disappears from Net Worth chart
- [ ] Toggle back on → Line reappears

### Year Slider
- [ ] Move slider to 2040 → Year displays update
- [ ] Account breakdown shows correct values
- [ ] Pie charts update

### Spending Slider
- [ ] Move to $120K → Shows "+$30K/yr" as negative impact
- [ ] Monthly updates to $10K
- [ ] 25x Rule shows $3M
- [ ] 4% SWR shows $3M

### Roth Conversion Toggle
- [ ] Uncheck "Enable Roth Ladder" → Chart area shows disabled message
- [ ] Check it again → Chart and metrics reappear

### Theme Toggle
- [ ] Click moon/sun icon → Colors invert
- [ ] Charts remain readable

---

## Settings Panel Test

- [ ] Open settings (gear icon)
- [ ] Change retirement age to 55
- [ ] Click "Apply Changes"
- [ ] Verify retirement year updates in header

---

## Data Export Tests

- [ ] Click "PDF" → PDF downloads
- [ ] Click "CSV" → CSV downloads with data
- [ ] Click "Save" → JSON backup downloads

---

## Console Error Check

After all tests:
- [ ] Check console for errors (should be empty)
- [ ] No "undefined" errors
- [ ] No Chart.js warnings

---

## Sign Off

| Tester | Date | Result | Notes |
|--------|------|--------|-------|
|        |      |        |       |
