# RetireFire Architecture Guide

## Overview
RetireFire is a modular vanilla JavaScript application built with Vite. The application follows a "Handler-based" architecture where logic is separated into specialized modules.

## Directory Structure

### `/src/core/` (Future)
Planned location for calculation engines like `SimulationEngine` and `TaxCalculator`.

### `/src/data/`
- `Config.js`: Global configuration and user settings.
- `Store.js`: Application state and projection data.
- `Constants.js`: Naming maps, colors, and constant values.

### `/src/state/`
- `ChartStore.js`: Centralized tracking of Chart.js instances.
- `DataUtils.js`: Shared calculation utilities (Net Worth, Income, etc.).

### `/src/charts/`
Focused chart initialization modules:
- `SummaryCharts.js`: Main dashboard charts.
- `IncomeExpenseCharts.js`: Income, Expense, and Surplus charts.
- `TaxCharts.js`: Tax-related analysis and projections.
- `AnalysisCharts.js`: Monte Carlo and Risk analysis.
- `AccountCharts.js`: Asset trends and debt payoff.
- `ExplorerCharts.js`: Interactive scenario explorers.

### `/src/ui/`
User Interface handlers:
- `MetricsHandler.js`: Dashboard metric updates and professional "Coach" insights.
- `NavigationHandler.js`: Sidebar navigation and smooth scrolling.
- `SettingsHandler.js`: Population and application of settings.
- `ModalHandler.js`: Detail modals and popups.
- `ExportHandler.js`: PDF, CSV, and JSON export logic.
- `EventsHandler.js`: Management of one-time and recurring financial events.
- `ExplorerHandler.js`: Handlers for sliders and scenario switching.
- `DashboardDetails.js`: Goals, Milestones, and Data Tables.

### `/src/roth/`
Self-contained module for Roth Conversion planning.

## Application Lifecycle

1.  **Entry Point**: `main.js` initializes the application.
2.  **State Loading**: `App.loadSettings()` retrieves user data from `localStorage`.
3.  **Initial Projection**: `updateRawData()` runs the `SimulationEngine`.
4.  **UI Core Init**: `NavigationHandler` and `RothUI` attach listeners.
5.  **Dashboard Render**: `App.renderDashboard()` updates all text metrics and progress bars.
6.  **Chart Init**: `App.initAllCharts()` creates all visualization instances.

## Troubleshooting
Because the logic is broken into small files (avg < 150 lines), troubleshooting is easier:
- **Visual issue?** Check `src/charts/`.
- **Wrong number on dashboard?** Check `src/ui/MetricsHandler.js` or `src/state/DataUtils.js`.
- **Settings not saving?** Check `src/ui/SettingsHandler.js`.

---
**Last Updated**: 2026-01-24
