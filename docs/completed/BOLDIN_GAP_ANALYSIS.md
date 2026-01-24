# Boldin Feature Parity & Gap Analysis

**Status**: Initial Analysis Complete  
**Date**: 2026-01-21 (Updated: 2026-01-23)  
**Source**: Public Feature Documentation (PlannerPlus) & Current Application State

## Executive Summary
The current "Retirement Planner Pro" (RetireFire) has built a strong foundation in core deterministic modeling (Net Worth, Cash Flow) and basic Monte Carlo simulations. However, compared to Boldin's "PlannerPlus", significant gaps exist in **Tax Optimization**, **Dynamic Advice (Coaching)**, and **Granular Asset Modeling**.

To achieve "Premium" status, we must move beyond *displaying* data to *optimizing* it (e.g., suggesting Roth conversions rather than just allowing them).

---

## 1. Feature Comparison Configuration

| Category | Feature | Boldin (PlannerPlus) | RetireFire (Current) | Gap Severity |
|----------|---------|----------------------|----------------------|--------------|
| **Inputs** | **Staged Spending** | "Go-Go", "Slow-Go", "No-Go" phases with distinct multipliers. | Basic 2-stage (Active/Slow) multipliers. | 🟡 Medium |
| | **Real Estate** | Buy/Sell logic, downsizing, mortgage prepayment modeling, rental income specifics. | Generic "Home Value" & "Sell Year". No buy/downsize logic. | 🔴 High |
| | **Healthcare** | Pre-Medicare vs Medicare, explicit Out-of-Pocket, detailed inflation. | Basic Pre/Post values. Good parity achieved in Round 2. | 🟢 Low |
| | **Detailed Income** | Pensions (COLA/No-COLA), Annuities, Passive Streams. | Basic "Side Income" & "Pension" fields. | 🟡 Medium |
| **Logic** | **Tax Optimization** | Comparison of withdrawal strategies (Pro-Rata vs Standard vs Optimal). | ✅ Supports "Grow Tax Deferred" vs "Minimize RMDs". | 🟢 Low |
| | **Roth Conversions** | **Optimizer Tool**: Finds the *ideal* conversion amount to fill brackets. | ✅ Auto-optimizer finding headroom in brackets. | 🟢 Low |
| | **Withdrawal Order** | Optimized (Taxable -> Deferred -> Tax-Free) vs User Defined. | ✅ Logic toggles based on strategy selection. | 🟢 Low |
| **Visuals** | **Wellness Score** | Aggregate 0-100 "Financial Wellness" score based on multiple metrics. | Success Rate % (Monte Carlo) only. | 🟡 Medium |
| | **Tax Breakdown** | Area charts showing Ordinary Income vs Cap Gains vs State tax over time. | Hidden in calculations. No visual tax breakdown. | 🔴 High |
| | **Metric Watchlist** | Real-time Debt-to-Income, Savings Rate, FI Ratio. | Simple Net Worth card. | 🟡 Medium |
| **UX/AI** | **Digital Coach** | "Smart" text suggestions (e.g., "Consider converting $12k to Roth this year"). | ✅ Integrated coach with liquidity & success alerts. | 🟢 Low |
| | **Scenarios** | Side-by-Side comparison table of key metrics (Net Worth, Legacy). | ✅ Modular comparison view with difference mapping. | 🟢 Low |

---

## 2. Implementation Roadmap (US-034 Breakdown)

### Phase 1: Data & Calculation Gaps (The "Engine")
*   **Story A (Tax Logic)**: Implement `calculateTaxBreakdown()` to separate Ordinary Income, Capital Gains, and FICA. Update `calculateAnnualCashFlow` to return these distinct buckets.
*   **Story B (Real Estate)**: enhance `settings-housing` to allow "Future Home Purchase" or "Downsize" (Sell Home A -> Buy Home B with difference added to cash).
*   **Story C (Withdrawal Strategies)**: Create a logic toggle for Withdrawal Order (e.g., "Grow Tax Deferred" vs "Minimize RMDs").

### Phase 2: Visualization Gaps (The "Dashboard")
*   **Story D (Tax Chart)**: Create a stacked bar/area chart showing *Tax Paid* over time (Fed + State). Essential for showing Roth effectiveness.
*   **Story E (Comparison View)**: Create a "Scenario Compare" modal that shows Year 10, Year 20, and Final Net Worth for Strategy A vs B side-by-side.
*   **Story F (Wellness Score)**: Create a composite metric logic (Success Rate + Debt Free Age + Legacy Score) to generate a "Plan Health" score 0-100.

### Phase 3: The "Smart" Layer (The "Coach")
*   **Story G (Roth Optimizer)**: *Advanced*. Algorithm that iterates through conversion amounts to find the value that fills the current 12%/22%/24% bracket without jumping over.
*   **Story H (Smart Insights)**: Simple rules engine.
    *   *If Success Rate > 95%*: "You are over-saving. Consider spending more in early years."
    *   *If Taxable Account < 0 before Age 60*: "Liquidity Alert: You may face penalties accessing 401k funds."

---

## 3. Immediate Action Items (Next Sprint)
1.  **Refine Housing Logic**: The "Plan to Sell" is too simple. We need "Plan to Buy/Downsize" logic to properly model the windfall vs cost of a new home.
2.  **Tax Visualization**: Users can't see *why* Roth works without seeing the Tax prediction chart.
3.  **Money Flow Drill-down**: The current Sankey is good, but we need a table view of "Where is my money going?" (Taxes vs Expenses vs Savings).

