# Coding Standards & Rules

## General Principles

### 1. Single File Architecture
- This is a single-file HTML application
- All HTML, CSS, and JS remain in `ray3.html`
- Test files are separate in `/tests/` directory

### 2. Chart.js Conventions
```javascript
// Always use these chart options for consistency
options: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
        legend: { position: 'top', labels: { boxWidth: 12, padding: 8 } },
        tooltip: {
            callbacks: {
                label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw, false)}`
            }
        }
    }
}
```

### 3. Formatting Functions
```javascript
// Use formatCurrency for all money displays
formatCurrency(value, short = true)  // true: $4.2M, false: $4,240,000

// Use formatPercent for percentages
formatPercent(value)  // expects decimal: 0.25 -> "25.0%"
```

### 4. Color Palette
```javascript
// Scenario colors - never change these
scenarioColors = {
    optimistic: '#10b981',   // Green
    average: '#3b82f6',      // Blue
    pessimistic: '#ef4444',  // Red
    custom: '#8b5cf6'        // Purple
}

// Account colors - keep consistent across charts
colors = {
    CashSavings: '#84cc16',      // Lime
    HSA: '#8b5cf6',              // Purple
    Investments: '#f59e0b',      // Amber
    RetirementSavings: '#3b82f6', // Blue
    RothIRA: '#10b981',          // Green
    Housing: '#06b6d4',          // Cyan
    OtherAssets: '#6366f1',      // Indigo
    Debt: '#ef4444'              // Red
}
```

## Testing Standards

### Chart Tests Must Verify:
1. Chart instance exists after init
2. Chart has correct number of datasets
3. Each dataset has expected data length (46 years)
4. Tooltip callback returns valid string
5. Chart updates without errors when data changes

### Data Tests Must Verify:
1. Net worth equals sum of all accounts
2. No negative values in unexpected places
3. Totals match component sums
4. Year indices align (0 = 2026, 45 = 2071)

### Test File Template:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Test Suite: [Name]</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div id="results"></div>
    <script>
        const tests = [];
        function test(name, fn) {
            try {
                fn();
                tests.push({ name, status: 'PASS' });
            } catch (e) {
                tests.push({ name, status: 'FAIL', error: e.message });
            }
        }
        function assert(condition, message) {
            if (!condition) throw new Error(message);
        }
        // Tests go here
    </script>
</body>
</html>
```

## Modification Guidelines

### Before Modifying Charts:
1. Identify the init function: `init[ChartName]Chart()`
2. Check if there's an update function: `update[ChartName]Chart()`
3. Verify chart is stored in `charts` object
4. Test hover behavior after changes

### Before Modifying Settings:
1. Find the HTML input element
2. Find corresponding `config.settings` property
3. Ensure `applySettings()` reads the value
4. Ensure `saveToLocalStorage()` persists it

### Before Modifying Data:
1. Understand the `rawData` structure
2. Data is scenario-specific: `rawData.optimistic`, `.average`, `.pessimistic`
3. Each scenario has: `accounts`, `income`, `expenses`, `taxes`
4. All arrays are 46 elements (years 2026-2071)

## Error Prevention

### Common Mistakes to Avoid:
1. ❌ Forgetting to call `chart.update()` after data changes
2. ❌ Using wrong year index (off-by-one errors)
3. ❌ Not checking if array element exists before accessing
4. ❌ Mixing up monthly vs yearly values
5. ❌ Forgetting to save to localStorage

### Safe Patterns:
```javascript
// Always check array bounds
if (accounts[key]?.[yearIndex] !== undefined) {
    total += accounts[key][yearIndex];
}

// Always update charts after data changes
charts.myChart.data.datasets[0].data = newData;
charts.myChart.update();

// Always save after user actions
saveToLocalStorage();
```
