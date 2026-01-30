# Dashboard Layout & Deep Dive Planning

## Goal Description
The user wants to further refine the dashboard layout by swapping specific sections (Monte Carlo <-> Financial Goals) and fixing critical bugs (Social Security Chart). Additionally, we are planning major enhancements for the "What-If" Explorer and a new "Roth Conversion Center" (Epic).

## User Review Required
> [!IMPORTANT]
> **Bug Investigation (BUG-004)**: The Social Security chart is reportedly missing. This is a critical fix.
> **Layout Swap**: Monte Carlo moving to Row 8 (Analysis) and Financial Goals to Row 6 (Drawdown).
> **Planning Only**: Coding for the Deep Dives (Roth/What-If) is deferred until this plan is approved.

## Proposed Changes

### 1. Dashboard Layout & Navigation (US-068)
- **Swap Sections (`index.html`)**:
    - **Row 6 (Drawdown)**: Withdrawal Strategy (2), SWR (2), *Financial Goals* (2).
    - **Row 8 (Analysis)**: *Monte Carlo* (2), What-If Explorer (2), [New Stress Test] (2).
- **Sidebar (`sidebar.html`)**: Add "Jump to Section" links for all grid rows.

### 2. Critical Fixes (BUG-004, US-069)
- **Social Security Chart (`ExplorerCharts.js`)**:
    - Debug data generation in `initSocialSecurityChart`.
    - Ensure `SocialSecurityCalculator` returns valid `annualData`.
- **What-If Explorer (`explorers.html` / `ExplorerCharts.js`)**:
    - Fix event listener conflict causing graph lockup.
    - Improve interactivity (debounce inputs).

### 3. EPIC-001: Advanced Roth Conversion Center
*(Planning Phase - Implementation Deferred)*
- **Concept**: A dedicated Modal or "Deep Dive" view.
- **Features**:
    - **Tax Bracket Waterfall**: Visualizing fill-up to next bracket.
    - **Multi-Year Table**: Editable inputs for manual conversion amounts per year.
    - **Outcome Comparison**: Immediate "Tax Now vs. Tax Later" delta.
- **Architecture**: New `RothDeepDive.js` module and `roth-modal.html` partial.

## Verification Plan

### Manual Verification
1. **Layout**: Confirm Financial Goals is in Row 6 and Monte Carlo in Row 8.
2. **Bug Fix**: Verify Social Security chart renders data visible on load.
3. **Interactive Test**: Stress test parameters in What-If explorer (change inflation/returns) without UI freezing.

### Automated Tests
- **New Test**: `tests/unit/social-security.test.js` to assert non-zero benefit data generation.
