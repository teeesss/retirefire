# TASK-007: Advanced Cash Flow Explorer

**Status**: 🚧 In Progress  
**Priority**: MEDIUM-HIGH  
**Estimated Effort**: 4-6 hours  
**Related Issues**: ISSUE-019, ISSUE-020  

---

## 📋 Overview

Modernize the "What You Need" calculator to provide interactive controls and dynamic age-based calculations. Currently, the calculator is outdated and lacks flexibility for users at different life stages.

### Current Problems
1. **ISSUE-019**: Calculator shows "Age 53" hardcoded - doesn't use current user age
2. **ISSUE-020**: Target income is a number input - should be an interactive slider
3. No spend rate % scenarios (e.g., "What if I spend 3% vs 4%?")
4. Limited visualization of deficit/surplus scenarios

### Goals
- ✅ Fix age calculation to use dynamic current age
- ✅ Convert target income to interactive slider with number input
- ✅ Add spend rate % scenarios
- ✅ Enhance deficit/surplus visualization
- ✅ Maintain existing functionality
- ✅ Add comprehensive tests

---

## 🎯 Implementation Plan

### **Phase 1: Fix Dynamic Age Calculation (ISSUE-019)**

**Files to Modify:**
- `src/ui/GapCalculator.js` (lines 19-34)

**Current Code Analysis:**
```javascript
// Line 19-21: Uses retireAge correctly
const startAge = config.startAge || config.settings.personal.age;
const retireAge = config.settings.personal.retireAge;
const yearIndex = Math.max(0, retireAge - startAge);

// Line 34: Subtitle shows retirement age
subtitle.textContent = `At Retirement: Age ${retireAge} (${rawData.years[safeIndex]})`;
```

**Issue**: The calculator is actually using the correct retirement age, but the subtitle might be confusing. Let me verify if there's a hardcoded "53" somewhere.

**Action Items:**
1. ✅ Search codebase for hardcoded "53" references
2. ✅ Verify age calculation logic is correct
3. ✅ Update subtitle to be more descriptive
4. ✅ Add current age context to the display

**Expected Changes:**
```javascript
// Enhanced subtitle with current age context
const currentAge = config.settings.personal.age;
subtitle.textContent = `At Retirement: Age ${retireAge} (${rawData.years[safeIndex]}) - ${retireAge - currentAge} years from now`;
```

---

### **Phase 2: Convert Target Income to Interactive Slider (ISSUE-020)**

**Files to Modify:**
- `src/partials/charts/gap-calculator.html` (lines 10-14)
- `src/ui/GapCalculator.js` (lines 11-16)

**Current Code:**
```html
<input type="number" id="calcTargetIncome" class="modern-input" value="12000"
    onchange="initGapCalculator()">
```

**New Design:**
```html
<div class="slider-container">
    <input type="range" id="calcTargetIncomeSlider" 
        min="0" max="30000" step="500" value="12000"
        oninput="window.syncGapSlider(this.value)">
    <input type="number" id="calcTargetIncome" 
        class="modern-input" value="12000"
        onchange="window.syncGapInput(this.value)">
</div>
```

**Action Items:**
1. ✅ Add slider element with appropriate range (0-30k)
2. ✅ Implement bidirectional sync between slider and input
3. ✅ Add visual feedback (e.g., color coding based on surplus/deficit)
4. ✅ Update CSS for slider styling

**New Methods in GapCalculator.js:**
```javascript
static syncSlider(value) {
    const slider = document.getElementById('calcTargetIncomeSlider');
    const input = document.getElementById('calcTargetIncome');
    if (slider) slider.value = value;
    if (input) input.value = value;
    this.update();
}

static syncInput(value) {
    const slider = document.getElementById('calcTargetIncomeSlider');
    const input = document.getElementById('calcTargetIncome');
    if (slider) slider.value = value;
    if (input) input.value = value;
    this.update();
}
```

---

### **Phase 3: Add Spend Rate % Scenarios**

**Files to Create:**
- `src/explorers/CashFlowExplorer.js` (new file)

**Files to Modify:**
- `src/partials/charts/gap-calculator.html` (add scenario buttons)
- `src/ui/GapCalculator.js` (integrate with CashFlowExplorer)

**New Features:**
1. **Spend Rate Selector**: Buttons for 3%, 3.5%, 4%, 4.5%, 5%
2. **Dynamic Calculation**: Calculate required income based on spend rate
3. **Comparison View**: Show how different spend rates affect sustainability

**Design:**
```html
<div class="spend-rate-scenarios">
    <div class="scenario-label">Spend Rate Scenarios:</div>
    <div class="scenario-buttons">
        <button class="scenario-btn" data-rate="3.0">3%</button>
        <button class="scenario-btn" data-rate="3.5">3.5%</button>
        <button class="scenario-btn active" data-rate="4.0">4%</button>
        <button class="scenario-btn" data-rate="4.5">4.5%</button>
        <button class="scenario-btn" data-rate="5.0">5%</button>
    </div>
    <div class="scenario-result">
        <span class="metric-label">Portfolio Needed:</span>
        <span class="metric-value" id="portfolioNeeded">$0</span>
    </div>
</div>
```

**CashFlowExplorer.js Structure:**
```javascript
export class CashFlowExplorer {
    static init() {
        this.setupSpendRateButtons();
        this.currentRate = 4.0; // Default 4%
    }

    static setupSpendRateButtons() {
        const buttons = document.querySelectorAll('.scenario-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setSpendRate(parseFloat(e.target.dataset.rate));
            });
        });
    }

    static setSpendRate(rate) {
        this.currentRate = rate;
        this.updateScenario();
    }

    static updateScenario() {
        // Calculate portfolio needed based on spend rate
        const targetMonthly = parseFloat(document.getElementById('calcTargetIncome')?.value) || 0;
        const targetAnnual = targetMonthly * 12;
        const portfolioNeeded = targetAnnual / (this.currentRate / 100);
        
        // Update UI
        this.safeUpdate('portfolioNeeded', formatCurrency(portfolioNeeded));
        
        // Highlight active button
        document.querySelectorAll('.scenario-btn').forEach(btn => {
            btn.classList.toggle('active', parseFloat(btn.dataset.rate) === this.currentRate);
        });
    }

    static safeUpdate(id, content) {
        const el = document.getElementById(id);
        if (el) el.textContent = content;
    }
}
```

---

### **Phase 4: Enhanced Deficit/Surplus Visualization**

**Files to Modify:**
- `src/partials/charts/gap-calculator.html` (add visualization elements)
- `src/ui/GapCalculator.js` (enhance visualization logic)

**New Visualization Features:**
1. **Color-coded progress bar** (already exists, enhance it)
2. **Percentage display** (e.g., "You're at 85% of your goal")
3. **Action recommendations** (e.g., "Save $500/month more" or "Reduce expenses by $200/month")
4. **Visual indicators** (icons, badges)

**Enhanced HTML:**
```html
<div class="gap-visualization">
    <div class="progress-section">
        <div class="progress-label">
            <span id="calcProgressPercent">0%</span>
            <span id="calcProgressStatus">of goal</span>
        </div>
        <div class="progress-bar-container">
            <div class="progress-bar" id="calcProgressBar" style="width: 0%"></div>
        </div>
    </div>
    
    <div class="action-recommendation" id="calcRecommendation">
        <!-- Dynamic recommendations will appear here -->
    </div>
</div>
```

**Enhanced Update Logic:**
```javascript
static update() {
    // ... existing code ...
    
    // Calculate percentage
    const pct = targetMonthly > 0 ? Math.min(100, (projectedMonthly / targetMonthly) * 100) : 100;
    
    // Update percentage display
    this.safeUpdate('calcProgressPercent', Math.round(pct) + '%');
    
    // Generate recommendation
    const recommendation = this.generateRecommendation(gap, targetMonthly, projectedMonthly);
    this.safeUpdate('calcRecommendation', recommendation);
}

static generateRecommendation(gap, target, projected) {
    if (gap >= 0) {
        return `✅ You're on track! You have a surplus of ${formatCurrency(gap, false)}/month.`;
    } else {
        const shortfall = Math.abs(gap);
        const yearsToRetirement = config.settings.personal.retireAge - config.settings.personal.age;
        const monthsToRetirement = yearsToRetirement * 12;
        const additionalSavingsNeeded = shortfall * monthsToRetirement;
        
        return `⚠️ To reach your goal, consider: 
                <br>• Save an additional ${formatCurrency(shortfall, false)}/month
                <br>• Or reduce target income by ${formatCurrency(shortfall, false)}/month
                <br>• Total additional savings needed: ${formatCurrency(additionalSavingsNeeded)}`;
    }
}
```

---

## 🧪 Testing Strategy

### **Unit Tests** (`tests/unit/GapCalculator.test.js`)

Create new test file:

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GapCalculator } from '../../src/ui/GapCalculator.js';
import { config } from '../../src/data/Config.js';
import { rawData } from '../../src/data/Store.js';

describe('GapCalculator', () => {
    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
            <input id="calcTargetIncome" value="12000">
            <input id="calcTargetIncomeSlider" value="12000">
            <span id="calcProjectedIncome"></span>
            <span id="calcSubtitle"></span>
            <span id="calcResultValue"></span>
            <span id="calcResultLabel"></span>
            <div id="calcProgressBar"></div>
            <span id="calcProgressPercent"></span>
            <span id="calcRecommendation"></span>
        `;
        
        // Mock config
        config.settings = {
            personal: { age: 45, retireAge: 65 }
        };
        config.startAge = 45;
        
        // Mock rawData
        rawData.years = [2026, 2027, 2028];
    });

    it('should calculate retirement year index correctly', () => {
        GapCalculator.update();
        const subtitle = document.getElementById('calcSubtitle');
        expect(subtitle.textContent).toContain('Age 65');
    });

    it('should sync slider and input bidirectionally', () => {
        GapCalculator.syncSlider(15000);
        const slider = document.getElementById('calcTargetIncomeSlider');
        const input = document.getElementById('calcTargetIncome');
        expect(slider.value).toBe('15000');
        expect(input.value).toBe('15000');
    });

    it('should show surplus when projected > target', () => {
        // Mock getTotalIncome to return high value
        vi.mock('../../src/state/DataUtils.js', () => ({
            getTotalIncome: () => 180000 // $15k/month
        }));
        
        GapCalculator.update();
        const label = document.getElementById('calcResultLabel');
        expect(label.textContent).toBe('Surplus');
    });

    it('should show shortfall when projected < target', () => {
        // Mock getTotalIncome to return low value
        vi.mock('../../src/state/DataUtils.js', () => ({
            getTotalIncome: () => 60000 // $5k/month
        }));
        
        GapCalculator.update();
        const label = document.getElementById('calcResultLabel');
        expect(label.textContent).toBe('Shortfall');
    });

    it('should generate helpful recommendations', () => {
        const recommendation = GapCalculator.generateRecommendation(-2000, 12000, 10000);
        expect(recommendation).toContain('Save an additional');
        expect(recommendation).toContain('$2,000');
    });
});
```

### **Integration Tests** (`tests/integration/CashFlowExplorer.test.js`)

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { CashFlowExplorer } from '../../src/explorers/CashFlowExplorer.js';
import { GapCalculator } from '../../src/ui/GapCalculator.js';

describe('CashFlowExplorer Integration', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <button class="scenario-btn" data-rate="3.0">3%</button>
            <button class="scenario-btn" data-rate="4.0">4%</button>
            <button class="scenario-btn" data-rate="5.0">5%</button>
            <span id="portfolioNeeded"></span>
            <input id="calcTargetIncome" value="12000">
        `;
        
        CashFlowExplorer.init();
    });

    it('should calculate portfolio needed based on spend rate', () => {
        CashFlowExplorer.setSpendRate(4.0);
        const portfolioNeeded = document.getElementById('portfolioNeeded');
        // $12k/month * 12 months / 4% = $3.6M
        expect(portfolioNeeded.textContent).toContain('$3,600,000');
    });

    it('should highlight active spend rate button', () => {
        CashFlowExplorer.setSpendRate(5.0);
        const buttons = document.querySelectorAll('.scenario-btn');
        const activeButton = Array.from(buttons).find(btn => btn.classList.contains('active'));
        expect(activeButton.dataset.rate).toBe('5.0');
    });
});
```

---

## 📁 File Structure

```
src/
├── ui/
│   └── GapCalculator.js          (MODIFY - add slider sync, enhanced viz)
├── explorers/
│   └── CashFlowExplorer.js       (CREATE - spend rate scenarios)
├── partials/
│   └── charts/
│       └── gap-calculator.html   (MODIFY - add slider, scenarios, viz)
└── main.js                       (MODIFY - import CashFlowExplorer)

tests/
├── unit/
│   └── GapCalculator.test.js     (CREATE - unit tests)
└── integration/
    └── CashFlowExplorer.test.js  (CREATE - integration tests)

docs/
└── implementation_plans/
    └── TASK-007-Advanced-Cash-Flow-Explorer.md (THIS FILE)
```

---

## 🚀 Execution Order

1. **Phase 1**: Fix dynamic age calculation (30 min)
   - Search for hardcoded "53"
   - Update subtitle with context
   - Test age calculation

2. **Phase 2**: Add interactive slider (1 hour)
   - Update HTML with slider
   - Implement sync methods
   - Style slider
   - Test bidirectional sync

3. **Phase 3**: Add spend rate scenarios (2 hours)
   - Create CashFlowExplorer.js
   - Add scenario buttons to HTML
   - Implement portfolio calculation
   - Test scenario switching

4. **Phase 4**: Enhanced visualization (1 hour)
   - Add percentage display
   - Implement recommendation logic
   - Style visualization elements
   - Test recommendations

5. **Testing**: Write comprehensive tests (1 hour)
   - Unit tests for GapCalculator
   - Integration tests for CashFlowExplorer
   - E2E tests for user interactions

6. **Documentation**: Update docs (30 min)
   - Update TASKS.md
   - Update ISSUES.md
   - Add inline code comments

---

## ✅ Success Criteria

- [ ] Age calculation uses dynamic current age (no hardcoded values)
- [ ] Target income has both slider and number input (bidirectional sync)
- [ ] Spend rate scenarios (3%, 3.5%, 4%, 4.5%, 5%) work correctly
- [ ] Portfolio needed calculation is accurate
- [ ] Deficit/surplus visualization is clear and actionable
- [ ] Recommendations are helpful and specific
- [ ] All unit tests pass (100%)
- [ ] All integration tests pass (100%)
- [ ] Code is well-documented
- [ ] TASKS.md and ISSUES.md are updated

---

## 🎨 UI/UX Enhancements

### Color Scheme
- **Surplus**: `#10b981` (green)
- **Warning (80-100%)**: `#f59e0b` (amber)
- **Deficit**: `#ef4444` (red)

### Animations
- Smooth progress bar transitions (CSS `transition: width 0.3s ease`)
- Button hover effects
- Slider thumb animations

### Accessibility
- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader friendly

---

## 📊 Expected Impact

### User Benefits
1. **Clarity**: Users see exactly where they stand relative to their goals
2. **Flexibility**: Interactive controls allow quick "what-if" scenarios
3. **Actionability**: Specific recommendations guide next steps
4. **Confidence**: Visual feedback reinforces progress

### Technical Benefits
1. **Modularity**: New CashFlowExplorer can be reused elsewhere
2. **Testability**: Comprehensive test coverage ensures reliability
3. **Maintainability**: Clear separation of concerns
4. **Extensibility**: Easy to add more scenarios in the future

---

## 🔄 Future Enhancements (Out of Scope)

- [ ] Chart visualization of spend rate scenarios over time
- [ ] Integration with Monte Carlo success rates
- [ ] Tax-adjusted income projections
- [ ] Inflation-adjusted targets
- [ ] Multiple goal tracking (e.g., "Comfortable" vs "Luxurious")

---

**Last Updated**: 2026-02-02  
**Author**: Antigravity AI  
**Status**: Ready for Implementation
