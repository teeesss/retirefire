# Tax & Regulatory Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hardened the financial engine with accurate FICA/Medicare logic, Social Security taxation, dynamic RMD ages, and TCJA sunset support.

**Architecture:** Update `TaxCalculator.js` to handle tiered FICA/Medicare and Social Security "combined income" rules. Update `SimulationEngine.js` to calculate RMD ages based on birth year. Introduce a sunset toggle in `Config.js` and bracket logic in `TaxCalculator.js`.

**Tech Stack:** Vanilla JavaScript (ES6 Modules), Vitest for testing.

---

### Task 1: Accurate FICA & Additional Medicare Tax

**Files:**
- Modify: `src/engine/TaxCalculator.js`
- Test: `tests/unit/TaxCalculator.test.js`

- [ ] **Step 1: Write failing test for Additional Medicare Tax**

Add to `tests/unit/TaxCalculator.test.js`:
```javascript
it('should calculate 0.9% Additional Medicare Tax for high earners', () => {
    // Single, $300k wages. 
    // Medicare (1.45%): 300,000 * 0.0145 = 4350
    // SS (6.2% up to 176100): 176100 * 0.062 = 10918.2
    // Addl Medicare (0.9% over 200k): 100,000 * 0.009 = 900
    // Total FICA/Medicare: 4350 + 10918.2 + 900 = 16168.2
    const breakdown = TaxCalculator.calculateTaxBreakdown(300000, 0, 0, 'single', 'FL');
    expect(breakdown.fica).toBeCloseTo(16168, 0);
});
```

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement split FICA and Additional Medicare logic**

Update `src/engine/TaxCalculator.js`:
```javascript
        // 3. FICA & Medicare
        const ssRate = 0.062;
        const ssCap = 176100;
        const medicareRate = 0.0145;
        const addlMedicareRate = 0.009;
        const addlMedicareThreshold = filingStatus === 'married' ? 250000 : 200000;

        const ssTax = Math.min(wages || 0, ssCap) * ssRate;
        const medicareTax = (wages || 0) * medicareRate;
        const addlMedicareTax = Math.max(0, (wages || 0) - addlMedicareThreshold) * addlMedicareRate;
        
        const fica = ssTax + medicareTax + addlMedicareTax;
```

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

---

### Task 2: Precise Social Security Taxation (Combined Income Rule)

**Files:**
- Modify: `src/engine/TaxCalculator.js`
- Modify: `src/engine/SimulationEngine.js`
- Test: `tests/unit/TaxCalculator.test.js`

- [ ] **Step 1: Implement `calculateTaxableSocialSecurity` in `TaxCalculator.js`**

Add to `TaxCalculator.js`:
```javascript
    /**
     * Calculates portion of Social Security benefit subject to federal tax
     * Based on "Combined Income" = AGI + Tax-exempt Interest + 50% of SS Benefit
     */
    static calculateTaxableSocialSecurity(nonSSOrdinaryIncome, ssBenefit, status) {
        const combinedIncome = nonSSOrdinaryIncome + (ssBenefit * 0.5);
        const thresholds = status === 'married' ? [32000, 44000] : [25000, 34000];
        
        if (combinedIncome <= thresholds[0]) return 0;
        
        if (combinedIncome <= thresholds[1]) {
            return Math.min(ssBenefit * 0.5, (combinedIncome - thresholds[0]) * 0.5);
        }
        
        const tier1tax = (thresholds[1] - thresholds[0]) * 0.5;
        const tier2tax = (combinedIncome - thresholds[1]) * 0.85;
        return Math.min(ssBenefit * 0.85, tier1tax + tier2tax);
    }
```

- [ ] **Step 2: Update `SimulationEngine.js` to use the new calculator**

Modify `src/engine/SimulationEngine.js` around line 340:
```javascript
        // 3. Tax Calculation
        const taxableSS = TaxCalculator.calculateTaxableSocialSecurity(rmdIncome + workIncome, ssIncome, config.settings?.taxSettings?.filingStatus || 'single');
        const otherOrdIncome = rmdIncome + taxableSS;
```

- [ ] **Step 3: Add test case to `TaxCalculator.test.js`**

```javascript
it('should calculate taxable Social Security using combined income rules', () => {
    // Single, $30k ordinary income, $20k SS benefit.
    // Combined = 30k + 10k = 40k.
    // Over 34k threshold.
    // Tier 1: (34-25)*0.5 = 4500
    // Tier 2: (40-34)*0.85 = 5100
    // Total = 9600. (Max 85% of 20k = 17k).
    const taxable = TaxCalculator.calculateTaxableSocialSecurity(30000, 20000, 'single');
    expect(taxable).toBeCloseTo(9600, 0);
});
```

- [ ] **Step 4: Run tests and verify**

- [ ] **Step 5: Commit**

---

### Task 3: SECURE 2.0 Dynamic RMD Ages

**Files:**
- Modify: `src/engine/SimulationEngine.js`
- Test: `tests/unit/SimulationEngine.test.js`

- [ ] **Step 1: Add RMD start age logic to `SimulationEngine.js`**

Add to `SimulationEngine.js`:
```javascript
    static getRMDStartAge(birthYear) {
        if (birthYear <= 1950) return 72;
        if (birthYear <= 1959) return 73;
        return 75;
    }
```

- [ ] **Step 2: Update `_processYear` to use dynamic age**

Modify `src/engine/SimulationEngine.js`:
```javascript
        // RMD Calculation
        let rmdIncome = 0;
        const birthYear = currentYear - currentAge;
        const rmdStartAge = this.getRMDStartAge(birthYear);
        
        if (currentAge >= rmdStartAge && retirement > 0) {
            // ... (rest of RMD logic)
```

- [ ] **Step 3: Add test case for RMD age transition**

Add to `tests/unit/SimulationEngine.test.js`:
```javascript
it('should delay RMDs until age 75 for users born after 1959', () => {
    const youngConfig = JSON.parse(JSON.stringify(config));
    youngConfig.startYear = 2035;
    youngConfig.startAge = 50; // Born 1985
    youngConfig.settings.personal.age = 50;
    youngConfig.settings.personal.retireAge = 55;
    youngConfig.settings.personal.longevity = 80;
    
    const results = SimulationEngine.project(youngConfig, 'average');
    
    // Check age 73 (should be 0 RMD)
    const age73Idx = results.ages.indexOf(73);
    expect(results.income.RMD[age73Idx]).toBe(0);
    
    // Check age 75 (should have RMD)
    const age75Idx = results.ages.indexOf(75);
    expect(results.income.RMD[age75Idx]).toBeGreaterThan(0);
});
```

- [ ] **Step 4: Run tests and verify**

- [ ] **Step 5: Commit**

---

### Task 4: TCJA Sunset Implementation

**Files:**
- Modify: `src/data/Config.js`
- Modify: `src/engine/TaxCalculator.js`
- Test: `tests/unit/TaxCalculator.test.js`

- [ ] **Step 1: Add sunset toggle to `Config.js`**

- [ ] **Step 2: Add sunset brackets to `TaxCalculator.js`**

- [ ] **Step 3: Update `calculateTaxBreakdown` to accept `year` and `tcjaSunset` flag**

- [ ] **Step 4: Add test case for higher taxes after 2026**

- [ ] **Step 5: Commit**
