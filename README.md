# RetireFire - Retirement Planning Application

**A comprehensive retirement financial planning tool built to rival professional platforms like RightCapital and eMoney.**

[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)]()
[![Build](https://img.shields.io/badge/build-stable-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/retirefire.git
cd retirefire

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Running Tests

```bash
# Run unit + integration tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting checks
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Run full suite with E2E tests
npm run test:all
```

### Build & Deploy

```bash
# Build for production
npm run build

# Deploy to server
npm run deploy
```

---

## 📋 What is RetireFire?

RetireFire is a high-fidelity financial planning application designed to provide professional-grade retirement projections. It features:

- **Multi-Scenario Analysis** - Optimistic, Average, and Pessimistic projections
- **45-Year Projections** - Comprehensive long-term planning
- **Interactive Charts** - 25+ visualizations powered by Chart.js
- **Tax Optimization** - Roth conversion strategies and tax-efficient withdrawals
- **Monte Carlo Simulation** - Probability-based success analysis with Historical Stress Tests (1970s, Dot-com, 1929)
- **Comprehensive Settings** - Full control over all financial variables

---

## ✨ Key Features

### Financial Projections
- Net worth tracking across multiple scenarios
- Income sources (work, Social Security, RMDs, withdrawals)
- Expense categories (housing, healthcare, living, taxes)
- Tax burden analysis and optimization
- Mortgage payoff tracking
- Home equity calculations

### Analysis Tools
- **Surplus/Gap Analysis** - Income vs. expenses
- **Money Flow Visualization** - Cash flow breakdown
- **Success Rate Gauge** - Monte Carlo probability
- **What You Need Calculator** - Retirement readiness
- **Withdrawal Strategy** - Tax-efficient drawdown
- **Roth Conversion Optimizer** - Tax strategy planning

### Interactive Features
- Year-by-year explorer with slider
- Scenario comparison (side-by-side)
- Goal tracking and milestones
- Data export (PDF, CSV, JSON)
- Dark/Light theme toggle
- Responsive mobile design

---

## 🏗️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Charts**: Chart.js with plugins (annotation, zoom)
- **Build**: Vite
- **Testing**: Vitest + Puppeteer
- **Styling**: Tailwind CSS
- **Deployment**: Automated FTP

---

## 📊 Project Status

**Current Status**: ✅ PRODUCTION READY - DEPLOYED

- **Test Pass Rate**: ✅ 599/599 Tests (100% Pass Rate)
- **Test Command**: `npm run test:all`
- **Build Status**: Stable (Zero console errors)
- **Deployment**: ✅ Live at https://www.bmwseals.com/retirefire/
- **Deploy Command**: `npm run deploy` (Automated build/sync)
- **Quality Grade**: A (Zero-Defect Verified)

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for detailed session logs.

---

## 📖 Documentation

### Core Documentation
- **[Architecture Guide](docs/guides/Architecture.md)** - Project modularity and structure
- **[TASKS.md](TASKS.md)** - Current work and sprint planning
- **[ISSUES.md](ISSUES.md)** - Fixed & Active issue logs
- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Overall project health
- **[LAYOUT_SPEC.md](docs/specs/LAYOUT_SPEC.md)** - Dashboard grid requirements

### Repository Organization
- **[Specifications](docs/specs/)**: UI/UX and Layout specifications
- **[Completed Tasks](docs/completed/)**: Historical task logs
- **[Audits](docs/audits/)**: Performance and security reports
- **[Debug](debug/)**: Artifacts for troubleshooting
- **[Logs](logs/)**: Test and build logs

---

## 🧪 Testing

### Test Suite Overview

```
✅ Unit Tests:          233/233 passing (100%)
✅ E2E/Integration:      366/366 passing (100%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Total Runnable:      599/599 passing (100%)
```

### Test Coverage
- Tax calculations (federal, state, FICA, capital gains)
- Simulation engine (projections, scenarios, Monte Carlo)
- Account management (6 account types)
- Withdrawal strategies
- Number formatting
- Dashboard metrics
- Chart rendering
- Interactive controls

See [docs/testing/TEST_GUIDE.md](docs/testing/TEST_GUIDE.md) for details.

---

## 🎯 Current Sprint
 
### ✅ Priority 0 & 1: Critical Dashboard & Enhancements - COMPLETE
 
1. Fix dashboard metrics (Net Worth, Peak, Age) ✅
2. Fix spending slider integration ✅
3. Implement interactive Roth conversion ✅
4. Auto-calculate Social Security ✅
5. Emergency Layout Recovery (Rule 3 Fix) ✅
6. Vite/Vitest Stability & CI Hardening ✅
7. Historical Stress Test Scenarios ✅
 
See [TASKS.md](TASKS.md) for full task list.

---

## 🐛 Known Issues
 
### High Priority (P1)
- Withdrawal strategy needs account breakdown
- Social Security cumulative view missing
- Monte Carlo limited to historical projections only
 
See [ISSUES.md](ISSUES.md) for complete list and status.

---

## 🤝 Contributing

### Development Workflow

1. **Before starting work**:
   ```bash
   npm test  # Ensure tests pass
   ```

2. **Make changes**:
   - Follow coding standards in [docs/guides/Coding_Standards.md](docs/guides/Coding_Standards.md)
   - Write tests for new features
   - Update documentation

3. **Before committing**:
   ```bash
   npm test  # Verify tests still pass
   npm run build  # Ensure build succeeds
   ```

4. **Update documentation**:
   - Update TASKS.md when completing tasks
   - Update ISSUES.md when fixing bugs
   - Update PROJECT_STATUS.md for major changes

### Quality Standards
- ✅ 100% test pass rate required
- ✅ All new features must include tests
- ✅ Documentation must be updated
- ✅ No regressions allowed

---

## 📦 Project Structure

```
retirefire/
├── index.html              # Main application file (Modular Shell)
├── src/                    # Source code
│   ├── partials/          # HTML Templates (Modularized)
│   ├── modules/           # Core logic (Tax, Simulation, etc)
│   ├── charts/            # Chart.js initialization logic
│   └── ui/                # UI Handlers and Event management
├── tests/                  # Full Test Suite (Unit, E2E, Integrated)
├── docs/                   # Documentation & Audit Reports
├── logs/                   # Debug logs and run reports
├── debug/                  # Diagnostic screenshots and visual diffs
├── .credentials/           # Deployment & Manual credentials (gitignored)
├── scripts/               # Build and deployment scripts
├── dist/                  # Production build output (Vite)
├── TASKS.md               # Continuous Sprint Planning
├── ISSUES.md              # Active Bug Tracking
├── PROJECT_STATUS.md      # Detailed Project Health
├── QUICKSTART.md          # Getting started
└── README.md              # This file
```

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🔗 Links

- **Live Demo**: [bmwseals.com/retirefire](http://bmwseals.com/retirefire)
- **Documentation**: [docs/](docs/)
- **Issues**: [ISSUES.md](ISSUES.md)
- **Tasks**: [TASKS.md](TASKS.md)

---

## 📧 Contact

For questions or support, please open an issue or contact the project maintainer.

---

**Last Updated**: 2026-02-03  
**Version**: 1.2.0  
**Status**: Production Ready ✅
