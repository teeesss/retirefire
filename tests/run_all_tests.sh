#!/bin/bash
#
# AUTOMATED TEST RUNNER - Retirement Planner Pro
# 
# Usage: ./tests/run_all_tests.sh
#
# This script runs ALL tests without any browser or user interaction.
# Exit code: 0 = all passed, 1 = failures found
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Counters
PASSED=0
FAILED=0
ERRORS=()

# File to test
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RAY_FILE="$SCRIPT_DIR/../ray3.html"

# Test function
pass() {
    ((PASSED++))
    echo -e "  ${GREEN}✓${NC} $1"
}

fail() {
    ((FAILED++))
    ERRORS+=("$1: $2")
    echo -e "  ${RED}✗${NC} $1"
    echo -e "    ${RED}→ $2${NC}"
}

section() {
    echo ""
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}─────────────────────────────────────${NC}"
}

# ============================================
# MAIN
# ============================================

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  🧪 RETIREMENT PLANNER PRO - AUTOMATED TEST SUITE${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo "  Running tests on: $(date)"
echo "  File: $RAY_FILE"

# ============================================
# FILE INTEGRITY TESTS
# ============================================
section "📁 FILE INTEGRITY TESTS"

# Check file exists
if [ -f "$RAY_FILE" ]; then
    pass "ray3.html exists"
else
    fail "ray3.html exists" "File not found: $RAY_FILE"
    echo ""
    echo -e "${RED}CRITICAL: Main file not found. Cannot continue.${NC}"
    exit 1
fi

# Check file size
FILE_SIZE=$(wc -c < "$RAY_FILE")
if [ "$FILE_SIZE" -gt 200000 ]; then
    pass "File size OK ($((FILE_SIZE / 1024)) KB)"
else
    fail "File size" "Too small: $FILE_SIZE bytes"
fi

# Check DOCTYPE
if grep -q "<!DOCTYPE html>" "$RAY_FILE"; then
    pass "DOCTYPE declaration present"
else
    fail "DOCTYPE declaration" "Missing"
fi

# Check critical patterns
patterns=(
    "const config ="
    "rawData ="
    "let charts = {}"
    "function initCharts"
    "function updateDashboard"
    "function formatCurrency"
)

for pattern in "${patterns[@]}"; do
    if grep -q "$pattern" "$RAY_FILE"; then
        pass "Contains '$pattern'"
    else
        fail "Contains '$pattern'" "Pattern not found"
    fi
done

# ============================================
# JAVASCRIPT SYNTAX TESTS
# ============================================
section "🔧 JAVASCRIPT SYNTAX TESTS"

# Count braces
OPEN_BRACES=$(grep -o '{' "$RAY_FILE" | wc -l)
CLOSE_BRACES=$(grep -o '}' "$RAY_FILE" | wc -l)
BRACE_DIFF=$((OPEN_BRACES - CLOSE_BRACES))

if [ "$BRACE_DIFF" -ge -5 ] && [ "$BRACE_DIFF" -le 5 ]; then
    pass "Braces balanced (diff: $BRACE_DIFF)"
else
    fail "Braces balanced" "Imbalance: $BRACE_DIFF"
fi

# Count parentheses
OPEN_PARENS=$(grep -o '(' "$RAY_FILE" | wc -l)
CLOSE_PARENS=$(grep -o ')' "$RAY_FILE" | wc -l)
PAREN_DIFF=$((OPEN_PARENS - CLOSE_PARENS))

if [ "$PAREN_DIFF" -ge -5 ] && [ "$PAREN_DIFF" -le 5 ]; then
    pass "Parentheses balanced (diff: $PAREN_DIFF)"
else
    fail "Parentheses balanced" "Imbalance: $PAREN_DIFF"
fi

# Check for script tags
if grep -q "<script>" "$RAY_FILE" && grep -q "</script>" "$RAY_FILE"; then
    pass "Script tags present and closed"
else
    fail "Script tags" "Missing or unclosed"
fi

# ============================================
# DATA STRUCTURE TESTS
# ============================================
section "📊 DATA STRUCTURE TESTS"

# Check scenarios
for scenario in optimistic average pessimistic; do
    if grep -q "${scenario}: {" "$RAY_FILE"; then
        pass "Scenario '${scenario}' exists"
    else
        fail "Scenario '${scenario}'" "Not found"
    fi
done

# Check 46 years
if grep -q "length: 46" "$RAY_FILE"; then
    pass "Years array has 46 elements"
else
    fail "Years array" "Not 46 elements"
fi

# Check account types
accounts=("RetirementSavings" "RothIRA" "HSA" "Investments" "CashSavings")
for acc in "${accounts[@]}"; do
    if grep -q "${acc}:" "$RAY_FILE"; then
        pass "Account type '${acc}' exists"
    else
        fail "Account type '${acc}'" "Not found"
    fi
done

# ============================================
# CONFIGURATION TESTS
# ============================================
section "⚙️ CONFIGURATION TESTS"

# Check mortgage years is 8
if grep -q "mortgageYears: 8" "$RAY_FILE"; then
    pass "Mortgage years is 8 (fixed)"
else
    fail "Mortgage years" "Not set to 8"
fi

# Check rothConversionEnabled
if grep -Eq "rothConversionEnabled: (true|false)" "$RAY_FILE"; then
    pass "rothConversionEnabled setting exists"
else
    fail "rothConversionEnabled" "Not found"
fi

# Check annualSpending
if grep -Eq "annualSpending: [0-9]+" "$RAY_FILE"; then
    pass "annualSpending configured"
else
    fail "annualSpending" "Not found"
fi

# Check start year
if grep -q "startYear: 2026" "$RAY_FILE"; then
    pass "Start year is 2026"
else
    fail "Start year" "Not 2026"
fi

# Check retirement age
if grep -Eq "retireAge: [0-9]+" "$RAY_FILE"; then
    pass "Retirement age configured"
else
    fail "Retirement age" "Not found"
fi

# ============================================
# CHART FUNCTION TESTS
# ============================================
section "📈 CHART FUNCTION TESTS"

chart_funcs=(
    "initNetWorthChart"
    "initAllocationChart"
    "initIncomeChart"
    "initExpensesChart"
    "initTaxesChart"
    "initMortgageChart"
    "initMonteCarloChart"
    "initRothConversionChart"
    "initWithdrawalChart"
    "initSSComparisonChart"
)

for func in "${chart_funcs[@]}"; do
    if grep -q "function ${func}(" "$RAY_FILE"; then
        pass "${func}() exists"
    else
        fail "${func}()" "Function not found"
    fi
done

# ============================================
# CORE FUNCTION TESTS
# ============================================
section "🧮 CORE FUNCTION TESTS"

core_funcs=(
    "formatCurrency"
    "formatPercent"
    "calculateNetWorth"
    "getTotalIncome"
    "getTotalExpenses"
    "getTotalTaxes"
    "setScenario"
    "toggleComparison"
    "toggleRothConversion"
    "updateSpendingSlider"
    "saveToLocalStorage"
    "loadFromLocalStorage"
    "updateDashboard"
)

for func in "${core_funcs[@]}"; do
    if grep -q "function ${func}(" "$RAY_FILE"; then
        pass "${func}() exists"
    else
        fail "${func}()" "Function not found"
    fi
done

# ============================================
# UI ELEMENT TESTS
# ============================================
section "🖱️ UI ELEMENT TESTS"

elements=(
    'id="chartNetWorth"'
    'id="chartMortgage"'
    'id="yearSlider"'
    'id="spendingSlider"'
    'id="rothConversionEnabled"'
    'id="settingsOverlay"'
    'id="selectedYear"'
    'id="selectedAge"'
    'id="milestoneTimeline"'
    'id="metricsDashboard"'
)

for el in "${elements[@]}"; do
    if grep -q "$el" "$RAY_FILE"; then
        pass "Element $el exists"
    else
        fail "Element $el" "Not found"
    fi
done

# ============================================
# NEW FEATURES TESTS
# ============================================
section "🆕 NEW FEATURES TESTS"

# Check enhanced milestones
if grep -q "milestone-badge" "$RAY_FILE"; then
    pass "Enhanced milestone badges exist"
else
    fail "Enhanced milestone badges" "Not found"
fi

if grep -q "milestone-age" "$RAY_FILE"; then
    pass "Milestone ages visible"
else
    fail "Milestone ages" "Not found"
fi

# Check metrics dashboard
if grep -q "metric-card excelling" "$RAY_FILE"; then
    pass "Metrics EXCELLING status exists"
else
    fail "Metrics EXCELLING status" "Not found"
fi

if grep -q "metric-card progressing" "$RAY_FILE"; then
    pass "Metrics PROGRESSING status exists"
else
    fail "Metrics PROGRESSING status" "Not found"
fi

if grep -q "metric-card vulnerable" "$RAY_FILE"; then
    pass "Metrics VULNERABLE status exists"
else
    fail "Metrics VULNERABLE status" "Not found"
fi

if grep -q "Browse All Metrics" "$RAY_FILE"; then
    pass "Browse All Metrics section exists"
else
    fail "Browse All Metrics section" "Not found"
fi

# Check Monte Carlo enhancements
if grep -q "runMonteCarloSimulation" "$RAY_FILE"; then
    pass "Monte Carlo simulation function exists"
else
    fail "Monte Carlo simulation function" "Not found"
fi

if grep -q "mcSuccessRate" "$RAY_FILE"; then
    pass "Monte Carlo success rate display exists"
else
    fail "Monte Carlo success rate display" "Not found"
fi

if grep -q "mcLegacyRate" "$RAY_FILE"; then
    pass "Monte Carlo legacy goal display exists"
else
    fail "Monte Carlo legacy goal display" "Not found"
fi

if grep -q "Run Again" "$RAY_FILE"; then
    pass "Monte Carlo Run Again button exists"
else
    fail "Monte Carlo Run Again button" "Not found"
fi

# Check What-If Explorer
if grep -q "whatIfExplorer" "$RAY_FILE"; then
    pass "What-If Explorer section exists"
else
    fail "What-If Explorer section" "Not found"
fi

if grep -q "scenario-btn" "$RAY_FILE"; then
    pass "What-If scenario buttons exist"
else
    fail "What-If scenario buttons" "Not found"
fi

if grep -q "resetWhatIf" "$RAY_FILE"; then
    pass "What-If reset function exists"
else
    fail "What-If reset function" "Not found"
fi

if grep -q "impactSummary" "$RAY_FILE"; then
    pass "What-If impact summary exists"
else
    fail "What-If impact summary" "Not found"
fi

# Check Debt Payoff Explorer
if grep -q "debtPayoffExplorer" "$RAY_FILE"; then
    pass "Debt Payoff Explorer section exists"
else
    fail "Debt Payoff Explorer section" "Not found"
fi

if grep -q "initDebtPayoffChart" "$RAY_FILE"; then
    pass "Debt Payoff chart initialization exists"
else
    fail "Debt Payoff chart initialization" "Not found"
fi

if grep -q "setDebtStrategy" "$RAY_FILE"; then
    pass "Debt Strategy function exists"
else
    fail "Debt Strategy function" "Not found"
fi

if grep -q "updateDebtCalculations" "$RAY_FILE"; then
    pass "Debt Calculation function exists"
fi

# Check Market Risk Explorer
if grep -q "marketRiskExplorer" "$RAY_FILE"; then
    pass "Market Risk Explorer section exists"
else
    fail "Market Risk Explorer section" "Not found"
fi

if grep -q "initMarketRiskChart" "$RAY_FILE"; then
    pass "Market Risk chart initialization exists"
else
    fail "Market Risk chart initialization" "Not found"
fi

if grep -q "runMarketRisk" "$RAY_FILE"; then
    pass "Market Risk simulation function exists"
else
    fail "Market Risk simulation function" "Not found"
fi

if grep -q "risk-btn" "$RAY_FILE"; then
    pass "Market Risk scenario buttons exist"
else
    fail "Market Risk scenario buttons" "Not found"
fi

# Check Social Security Explorer
if grep -q "ssExplorer" "$RAY_FILE"; then
    pass "Social Security Explorer section exists"
else
    fail "Social Security Explorer section" "Not found"
fi

if grep -q "initSSExplorerChart" "$RAY_FILE"; then
    pass "Social Security chart initialization exists"
else
    fail "Social Security chart initialization" "Not found"
fi

if grep -q "updateSSExplorer" "$RAY_FILE"; then
    pass "Social Security calculation function exists"
else
    fail "Social Security calculation function" "Not found"
fi

if grep -q "age-tab" "$RAY_FILE"; then
    pass "Social Security age tabs exist"
else
    fail "Social Security age tabs" "Not found"
fi

# Check Roth Conversion Explorer
if grep -q "rothExplorer" "$RAY_FILE"; then
    pass "Roth Conversion Explorer section exists"
else
    fail "Roth Conversion Explorer section" "Not found"
fi

if grep -q "initRothExplorerChart" "$RAY_FILE"; then
    pass "Roth Conversion chart initialization exists"
else
    fail "Roth Conversion chart initialization" "Not found"
fi

if grep -q "updateRothExplorer" "$RAY_FILE"; then
    pass "Roth Conversion calculation function exists"
else
    fail "Roth Conversion calculation function" "Not found"
fi

if grep -q "roth-input-group" "$RAY_FILE"; then
    pass "Roth Conversion inputs exist"
else
    fail "Roth Conversion inputs" "Not found"
fi

# Check Dynamic Calculation Engine
if grep -q "SimulationEngine" "$RAY_FILE"; then
    pass "Simulation Engine object exists"
else
    fail "Simulation Engine object" "Not found"
fi

if grep -q "recalculate()" "$RAY_FILE"; then
    pass "Recalculate function exists"
else
    fail "Recalculate function" "Not found"
fi

if grep -q "SimulationEngine.run()" "$RAY_FILE"; then
    pass "Simulation Engine run integration exists"
else
    fail "Simulation Engine run integration" "Not found"
fi

if grep -q "refreshAllCharts()" "$RAY_FILE"; then
    pass "Chart refresh function exists"
else
    fail "Chart refresh function" "Not found"
fi

# Check Comprehensive Metrics Dashboard (US-013)
if grep -q "id=\"comprehensiveMetrics\"" "$RAY_FILE"; then
    pass "Comprehensive Metrics section exists"
else
    fail "Comprehensive Metrics section" "Not found"
fi

if grep -q "id=\"mSuccessRate\"" "$RAY_FILE"; then
    pass "Metric: Success Rate ID exists"
else
    fail "Metric: Success Rate ID" "Not found"
fi

if grep -q "id=\"mDebtFree\"" "$RAY_FILE"; then
    pass "Metric: Debt Freedom ID exists"
else
    fail "Metric: Debt Freedom ID" "Not found"
fi

# ============================================
# SUMMARY
# ============================================
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  📋 TEST SUMMARY${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${GREEN}✓ Passed:${NC}  $PASSED"
echo -e "  ${RED}✗ Failed:${NC}  $FAILED"
echo ""

# Save results to JSON
RESULTS_FILE="$SCRIPT_DIR/last_test_results.json"
echo "{" > "$RESULTS_FILE"
echo "  \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"," >> "$RESULTS_FILE"
echo "  \"passed\": $PASSED," >> "$RESULTS_FILE"
echo "  \"failed\": $FAILED," >> "$RESULTS_FILE"
echo "  \"errors\": [" >> "$RESULTS_FILE"
for i in "${!ERRORS[@]}"; do
    if [ $i -eq $((${#ERRORS[@]} - 1)) ]; then
        echo "    \"${ERRORS[$i]}\"" >> "$RESULTS_FILE"
    else
        echo "    \"${ERRORS[$i]}\"," >> "$RESULTS_FILE"
    fi
done
echo "  ]" >> "$RESULTS_FILE"
echo "}" >> "$RESULTS_FILE"

echo "  Results saved to: $RESULTS_FILE"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "  ${RED}❌ TESTS FAILED - DO NOT UPDATE CODE${NC}"
    echo ""
    echo -e "${RED}  Failed tests:${NC}"
    for err in "${ERRORS[@]}"; do
        echo "    • $err"
    done
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
    echo ""
    exit 1
else
    echo -e "  ${GREEN}✅ ALL TESTS PASSED - SAFE TO PROCEED${NC}"
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
    echo ""
    exit 0
fi
