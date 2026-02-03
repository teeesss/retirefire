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

## CSS / Layout Standards

### Dashboard Grid - CRITICAL RULE

**Maximum 3 cards per row on desktop viewport (≥1280px)**

The dashboard uses a strict 3-column grid system. This is enforced in `src/style.css`:

```css
/* Desktop & Ultrawide: STRICT 3 cols MAX per row */
@media (min-width: 1280px) {
    .dashboard-grid {
        grid-template-columns: repeat(3, 1fr);
    }

    /* ALL cards span exactly 1 column (1 of 3) */
    .dashboard-grid .span-1,
    .dashboard-grid .span-2,
    .dashboard-grid .span-3,
    .dashboard-grid .span-4,
    .dashboard-grid .span-5,
    .dashboard-grid .span-6,
    .dashboard-grid .span-7,
    .dashboard-grid .span-8,
    .dashboard-grid .span-9,
    .dashboard-grid .span-10,
    .dashboard-grid .span-11 {
        grid-column: span 1 !important;
    }

    /* ONLY span-12 gets full width (e.g., Monte Carlo Analysis) */
    .dashboard-grid .span-12 {
        grid-column: span 3 !important;
    }
}
```

### When to Use Each Span Class

| Span Class | Desktop Behavior | Use For |
|------------|------------------|---------|
| `span-1` to `span-11` | 1 column (1/3 width) | Regular cards, charts, explorers |
| `span-12` | Full width (3/3) | Monte Carlo, Data Tables, full-width sections |

### Responsive Breakpoints

| Viewport | Columns | Behavior |
|----------|---------|----------|
| ≥1280px | 3 cols | Max 3 cards per row |
| 768-1279px | 2 cols | Max 2 cards per row |
| <768px | 1 col | Single column, stacked |

### ❌ DON'T

1. Use `span-6`, `span-8`, etc. expecting them to span multiple columns - they all map to 1 column
2. Add new span classes that break the 3-column grid
3. Override the `!important` rules without team discussion

### ✅ DO

1. Use `span-12` only for truly full-width content
2. Test layout at all breakpoints after CSS changes
3. Keep card heights consistent for clean rows

