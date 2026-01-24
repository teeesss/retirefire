# Retirement Financial Planner Pro - Project Overview

## Summary
A comprehensive single-page HTML application for retirement financial planning with interactive charts, multi-scenario analysis, and customizable settings.

## Application Purpose
Provides users with a 45-year retirement projection dashboard to visualize:
- Net worth growth across optimistic, average, and pessimistic scenarios
- Income sources (work, Social Security, RMDs, drawdowns)
- Expense categories (healthcare, housing, general living, taxes, LTC)
- Tax burden analysis and Roth conversion strategies
- Mortgage payoff tracking
- Monte Carlo simulation results
- What-if scenario analysis

## Key Features
| Feature | Description |
|---------|-------------|
| **Scenario Toggle** | Switch between Optimistic/Average/Pessimistic projections |
| **Year Explorer** | Slider to explore any year from 2026-2071 |
| **25+ Charts** | Net worth, income, expenses, taxes, healthcare, withdrawals, etc. |
| **Settings Panel** | Comprehensive configuration for all financial variables |
| **Goals Tracking** | Track progress toward financial milestones |
| **Data Export** | PDF, CSV, and JSON export functionality |
| **Theme Toggle** | Dark/Light mode support |

## Technology Stack
- **HTML5** - Single file application
- **CSS** - Custom CSS with CSS variables for theming
- **JavaScript** - Vanilla JS with Chart.js for visualizations
- **Libraries**: Chart.js, chartjs-plugin-annotation, chartjs-plugin-zoom, jsPDF, html2canvas

## Default User Profile (Hardcoded)
- **User**: Ray, Age 50
- **Retirement Age**: 53
- **Life Expectancy**: 95
- **Current Net Worth**: ~$4.24M
- **Location**: Texas (no state income tax)

## Application Structure

### HTML Sections (Lines 1-2106)
1. Header with scenario controls
2. Key metrics dashboard (6 cards)
3. Year explorer with slider
4. Main net worth projection chart
5. Portfolio allocation charts
6. Income/expense breakdowns
7. Social Security comparison
8. Tax analysis charts
9. Withdrawal strategy visualizations
10. Monte Carlo simulation
11. Goals and milestones
12. Data tables
13. Settings modal

### Settings Panel (Lines 2107-2762)
Categories: Personal Info, Spouse, Assets, Income, Social Security, Expenses, Housing, Healthcare, Return Rates, Inflation, Taxes, One-Time Events, Custom Scenarios, Goals

### JavaScript (Lines 2808-4787)
- Configuration object with all user settings
- Raw financial data for 3 scenarios (46 years each)
- Chart initialization and update functions
- Dashboard update logic
- Export functions
