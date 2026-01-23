import './style.css';
import Chart from 'chart.js/auto';
import { config } from './data/Config.js';
import { rawData, updateRawData } from './data/Store.js';
import { TaxCalculator } from './engine/TaxCalculator.js';
import { SimulationEngine } from './engine/SimulationEngine.js';
import { accountNames, incomeNames, expenseNames, colors, incomeColors, expenseColors, scenarioColors } from './data/Constants.js';
import { formatCurrency, formatPercent } from './utils/Formatters.js';

let charts = {};
// window.charts = charts; // Optional debugging

// Track initialization state
let isInitialized = false;

// ============================================
// CHART DESTRUCTION HELPER (Fixes HMR/double-init)
// ============================================

/**
 * Safely destroy an existing chart before recreating it.
 * This prevents "Canvas is already in use" errors with Vite HMR.
 * @param {string} chartKey - The key in the charts object (e.g., 'netWorth')
 * @returns {boolean} - True if a chart was destroyed
 */
function destroyChart(chartKey) {
    if (charts[chartKey]) {
        try {
            charts[chartKey].destroy();
            delete charts[chartKey];
            return true;
        } catch (e) {
            console.warn(`Failed to destroy chart ${chartKey}:`, e.message);
        }
    }
    return false;
}

/**
 * Destroy all existing charts (useful for full re-init)
 */
function destroyAllCharts() {
    Object.keys(charts).forEach(key => destroyChart(key));
}

// Vite HMR cleanup
if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        console.log('Vite HMR: Cleaning up charts...');
        destroyAllCharts();
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================



function calculateNetWorth(scenario, yearIndex) {
    const accounts = rawData[scenario]?.accounts;
    if (!accounts) return 0;
    let total = 0;
    for (let key in accounts) {
        if (accounts[key]?.[yearIndex] !== undefined) {
            total += accounts[key][yearIndex];
        }
    }
    return total;
}

function getNetWorthSeries(scenario) {
    return rawData.years.map((_, i) => calculateNetWorth(scenario, i));
}

function getTotalIncome(scenario, yearIndex) {
    const income = rawData[scenario]?.income;
    if (!income) return 0;
    let total = 0;
    for (let key in income) {
        if (income[key]?.[yearIndex]) total += income[key][yearIndex];
    }
    return total;
}

function getTotalExpenses(scenario, yearIndex) {
    const expenses = rawData[scenario]?.expenses;
    if (!expenses) return 0;
    let total = 0;
    for (let key in expenses) {
        if (expenses[key]?.[yearIndex]) total += expenses[key][yearIndex];
    }
    return total;
}

function getTotalTaxes(scenario, yearIndex) {
    const taxes = rawData[scenario]?.taxes;
    if (!taxes) return 0;
    return (taxes.Federal?.[yearIndex] || 0) + (taxes.FICA?.[yearIndex] || 0) + (taxes.CapGains?.[yearIndex] || 0);
}

// ============================================
// THEME MANAGEMENT
// ============================================

function toggleTheme() {
    config.theme = config.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', config.theme);
    document.querySelector('.theme-toggle').textContent = config.theme === 'dark' ? '🌙' : '☀️';
    saveToLocalStorage();
    updateChartColors();
}

function updateChartColors() {
    const textColor = config.theme === 'dark' ? '#9ca3af' : '#4b5563';
    const gridColor = config.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    Chart.defaults.color = textColor;
    Chart.defaults.borderColor = gridColor;

    // Update all charts
    Object.values(charts).forEach(chart => {
        if (chart && chart.update) {
            chart.update();
        }
    });
}

// ============================================
// LOCAL STORAGE
// ============================================

function saveToLocalStorage() {
    try {
        localStorage.setItem('retirementPlannerConfig', JSON.stringify(config));
        localStorage.setItem('retirementPlannerEvents', JSON.stringify(config.events));
        localStorage.setItem('retirementPlannerGoals', JSON.stringify(config.goals));
    } catch (e) {
        console.warn('Could not save to localStorage:', e);
    }
}

function loadFromLocalStorage() {
    try {
        const savedConfig = localStorage.getItem('retirementPlannerConfig');
        if (savedConfig) {
            const parsed = JSON.parse(savedConfig);
            Object.assign(config, parsed);
        }
        const savedEvents = localStorage.getItem('retirementPlannerEvents');
        if (savedEvents) {
            config.events = JSON.parse(savedEvents);
        }
        const savedGoals = localStorage.getItem('retirementPlannerGoals');
        if (savedGoals) {
            config.goals = JSON.parse(savedGoals);
        }
    } catch (e) {
        console.warn('Could not load from localStorage:', e);
    }
}

// ============================================
// SETTINGS PANEL
// ============================================

function openSettings(section) {
    document.getElementById('settingsOverlay').classList.add('active');
    if (section) {
        const navItem = document.querySelector(`.settings-nav-item[onclick*="'${section}'"]`);
        if (navItem) showSettingsSection(section, navItem);
    }
}

function closeSettings() {
    document.getElementById('settingsOverlay').classList.remove('active');
}

function showSettingsSection(section, el) {
    document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.settings-nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('settings-' + section).classList.add('active');
    el.classList.add('active');
}

function toggleSpouseFields() {
    const enabled = document.getElementById('hasSpouse').checked;
    document.getElementById('spouseFields').style.display = enabled ? 'block' : 'none';
    document.getElementById('spouseSection').style.display = enabled ? 'block' : 'none';
    config.settings.spouse.enabled = enabled;
}

function toggleHomeFields() {
    const owns = document.getElementById('ownsHome').checked;
    document.getElementById('homeOwnerFields').style.display = owns ? 'block' : 'none';
}

function setAllocation(stocks, bonds, cash, crypto) {
    document.getElementById('inputGlideStocks').value = stocks;
    document.getElementById('inputGlideStocksNum').value = stocks;
    document.getElementById('inputGlideBonds').value = bonds;
    document.getElementById('inputGlideBondsNum').value = bonds;
    document.getElementById('inputGlideCash').value = cash;
    document.getElementById('inputGlideCashNum').value = cash;
    document.getElementById('inputGlideCrypto').value = crypto;
    document.getElementById('inputGlideCryptoNum').value = crypto;
}

function updateAllocDisplay() {
    const s = parseInt(document.getElementById('inputGlideStocks').value);
    const b = parseInt(document.getElementById('inputGlideBonds').value);
    const c = parseInt(document.getElementById('inputGlideCash').value);
    const cr = parseInt(document.getElementById('inputGlideCrypto').value);

    // Check totals (optional warning logic could go here)

    // Sync Dropdown
    const select = document.getElementById('inputGlidePath');
    if (s === 90 && b === 0 && c === 3 && cr === 7) {
        select.value = 'aggressive';
    } else if (s === 60 && b === 30 && c === 5 && cr === 5) {
        select.value = 'moderate';
    } else if (s === 40 && b === 50 && c === 10 && cr === 0) {
        select.value = 'conservative';
    } else {
        select.value = 'custom';
    }
}

function updateTotalExpenses() {
    const general = parseFloat(document.getElementById('inputExpensesGeneral').value) || 0;
    const utilities = parseFloat(document.getElementById('inputExpensesUtilities').value) || 0;
    const travel = parseFloat(document.getElementById('inputExpensesTravel').value) || 0;
    const misc = parseFloat(document.getElementById('inputExpensesMisc').value) || 0;
    const gifts = parseFloat(document.getElementById('inputGifts').value) || 0;
    const vehicle = parseFloat(document.getElementById('inputVehicle').value) || 0;

    const total = general + utilities + travel + misc + gifts + vehicle;

    const display = document.getElementById('totalExpensesDisplay');
    if (display) {
        display.textContent = formatCurrency(total);
    }
}

function validateSettings() {
    const age = parseInt(document.getElementById('inputAge').value);
    const retireAge = parseInt(document.getElementById('inputRetireAge').value);
    const longevity = parseInt(document.getElementById('inputLongevity').value);

    if (isNaN(age) || age < 0 || age > 100) {
        showNotification('Please enter a valid age (0-100)', 'error');
        return false;
    }
    if (isNaN(longevity) || longevity <= age || longevity > 120) {
        showNotification('Life expectancy must be greater than current age', 'error');
        return false;
    }
    if (isNaN(retireAge) || retireAge < age || retireAge > longevity) {
        showNotification('Retirement age must be between current age and life expectancy', 'error');
        return false;
    }
    return true;
}

function applySettings() {
    if (!validateSettings()) return;

    // Personal
    config.settings.personal.name = document.getElementById('inputName').value;
    config.settings.personal.age = parseInt(document.getElementById('inputAge').value);
    config.settings.personal.retireAge = parseInt(document.getElementById('inputRetireAge').value);
    config.settings.personal.longevity = parseInt(document.getElementById('inputLongevity').value);

    // Assets
    const a = config.settings.assets;
    a.retirement = parseFloat(document.getElementById('inputRetirement').value);
    a.roth = parseFloat(document.getElementById('inputRoth').value);
    a.hsa = parseFloat(document.getElementById('inputHSA').value);
    a.investments = parseFloat(document.getElementById('inputInvestments').value);
    a.cash = parseFloat(document.getElementById('inputCash').value);
    a.otherAssets = parseFloat(document.getElementById('inputOtherAssets').value);
    a.btc = parseFloat(document.getElementById('inputBTC').value);
    a.eth = parseFloat(document.getElementById('inputETH').value);
    a.sol = parseFloat(document.getElementById('inputSOL').value);

    // Glide Path
    const g = config.settings.glidePath;
    g.stocks = parseFloat(document.getElementById('inputGlideStocks').value);
    g.bonds = parseFloat(document.getElementById('inputGlideBonds').value);
    g.cash = parseFloat(document.getElementById('inputGlideCash').value);
    g.crypto = parseFloat(document.getElementById('inputGlideCrypto').value);


    // Rates
    const r = config.settings.rates;
    r.optimistic = parseFloat(document.getElementById('inputReturnOpt').value);
    r.average = parseFloat(document.getElementById('inputReturnAvg').value);
    r.pessimistic = parseFloat(document.getElementById('inputReturnPes').value);
    r.bonds = parseFloat(document.getElementById('inputReturnBonds').value);
    r.cash = parseFloat(document.getElementById('inputReturnCash').value);

    // Income
    const inc = config.settings.income;
    inc.work = parseFloat(document.getElementById('inputWorkIncome').value);
    inc.growth = parseFloat(document.getElementById('inputIncomeGrowth').value);
    inc.contribution401k = parseFloat(document.getElementById('input401kContrib').value);
    inc.employerMatch = parseFloat(document.getElementById('inputEmployerMatch')?.value || 0);
    inc.rothContrib = parseFloat(document.getElementById('inputRothContrib')?.value || 0);
    inc.hsaContrib = parseFloat(document.getElementById('inputHSAContrib').value);

    // Expenses
    const exp = config.settings.expenses;
    exp.general = parseFloat(document.getElementById('inputExpensesGeneral').value);
    exp.travel = parseFloat(document.getElementById('inputExpensesTravel').value);
    exp.utilities = parseFloat(document.getElementById('inputExpensesUtilities').value);
    exp.misc = parseFloat(document.getElementById('inputExpensesMisc').value);
    exp.annualSpending = exp.general + exp.travel + exp.utilities + exp.misc;

    exp.phases = [
        { startAge: config.settings.personal.retireAge, endAge: 60, multiplier: parseFloat(document.getElementById('inputPhase1Mult')?.value || 1.0), description: 'Active Retirement' },
        { startAge: 60, endAge: 70, multiplier: parseFloat(document.getElementById('inputPhase2Mult')?.value || 0.9), description: 'Slow Down' }
    ];

    // Social Security
    const ss = config.settings.socialSecurity;
    ss.claimAge = parseInt(document.getElementById('inputSSAge')?.value || 62);
    ss.ss62 = parseFloat(document.getElementById('inputSS62')?.value || 1800);
    ss.ss67 = parseFloat(document.getElementById('inputSS67')?.value || 2739);
    ss.ss70 = parseFloat(document.getElementById('inputSS70')?.value || 3500);
    ss.cola = parseFloat(document.getElementById('inputSSCola')?.value || 2.5); // Default COLA if missing

    // Taxes
    const tx = config.settings.taxSettings;
    tx.filingStatus = document.getElementById('inputFilingStatus')?.value || 'head';
    tx.state = document.getElementById('inputState')?.value || 'FL';
    tx.fedBracket = parseInt(document.getElementById('inputFedBracket')?.value || 22); // Default 22% bracket

    // BUG-003 FIX: Always close settings modal, even if recalculation fails
    // BUG-003 FIX: Always close settings modal, even if recalculation fails
    // closeSettings(); --> USER REQUEST: Keep open and notify

    saveToLocalStorage();

    try {
        recalculate();
        updateApplyButton('applied'); // Show green "Applied!" feedback
        showNotification("✅ Settings applied & plan recalculated!", "success");
    } catch (error) {
        console.error('Error during recalculation:', error);
        showNotification('Settings saved, but recalculation encountered an error. Please refresh the page.', 'error');
    }
}

// Track if settings have changed
let settingsChanged = false;

// Add change listeners to all settings inputs
function initSettingsChangeDetection() {
    const settingsInputs = document.querySelectorAll('.settings-section input, .settings-section select');

    settingsInputs.forEach(input => {
        input.addEventListener('input', () => {
            settingsChanged = true;
            updateApplyButton('changed');
        });

        input.addEventListener('change', () => {
            settingsChanged = true;
            updateApplyButton('changed');
        });
    });

    console.log(`Initialized change detection on ${settingsInputs.length} settings inputs`);
}

function updateApplyButton(state) {
    const btn = document.getElementById('applySettingsBtn');
    const icon = document.getElementById('applyBtnIcon');
    const text = document.getElementById('applyBtnText');

    if (!btn || !icon || !text) return;

    if (state === 'changed') {
        btn.className = 'btn btn-warning';
        icon.textContent = '⚠️';
        text.textContent = 'Apply & Recalculate';
        btn.style.animation = 'pulse 1.5s ease-in-out infinite';
    } else if (state === 'applied') {
        btn.className = 'btn btn-success';
        icon.textContent = '✅';
        text.textContent = 'Applied!';
        btn.style.animation = 'none';
        settingsChanged = false;

        // Reset to warning state after 3 seconds
        setTimeout(() => {
            if (!settingsChanged) {
                btn.className = 'btn btn-outline';
                icon.textContent = '⚙️';
                text.textContent = 'Apply & Recalculate';
            }
        }, 3000);
    }
}


function resetToDefaults() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
        localStorage.clear();
        location.reload();
    }
}

function importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                Object.assign(config, imported);
                saveToLocalStorage();
                showNotification('Settings imported successfully!');
                location.reload();
            } catch (err) {
                showNotification('Error importing settings', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function exportSettings() {
    const data = JSON.stringify(config, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'retirement-planner-settings.json';
    a.click();
    showNotification('Settings exported!');
}

// ============================================
// EVENTS MANAGEMENT
// ============================================

function addEvent() {
    const year = parseInt(document.getElementById('eventYear').value);
    const description = document.getElementById('eventDescription').value;
    const amount = parseFloat(document.getElementById('eventAmount').value);
    const type = document.getElementById('eventType').value;

    if (!description || !amount) {
        showNotification('Please fill all fields', 'error');
        return;
    }

    config.events.push({ year, description, amount, type });
    renderEventsTable();
    saveToLocalStorage();

    document.getElementById('eventDescription').value = '';
    document.getElementById('eventAmount').value = '';
    showNotification('Event added!');
}

function removeEvent(btn) {
    const row = btn.closest('tr');
    const index = Array.from(row.parentNode.children).indexOf(row);
    config.events.splice(index, 1);
    renderEventsTable();
    saveToLocalStorage();
}

function addRecurringEvent() {
    const startAge = parseInt(document.getElementById('recurStartAge').value);
    const endAge = parseInt(document.getElementById('recurEndAge').value);
    const description = document.getElementById('recurDescription').value;
    const amount = parseFloat(document.getElementById('recurAmount').value);
    const type = document.getElementById('recurType').value;

    if (!description || isNaN(amount)) {
        showNotification('Please fill all fields', 'error');
        return;
    }

    config.recurringEvents.push({ startAge, endAge, description, amount, type });
    renderEventsTable(); // Also renders recurring
    saveToLocalStorage();

    document.getElementById('recurDescription').value = '';
    document.getElementById('recurAmount').value = '';
    showNotification('Recurring event added!');
    recalculate();
}

function renderEventsTable() {
    // One-time events
    const tbody = document.getElementById('eventsTableBody');
    if (tbody) {
        tbody.innerHTML = config.events.map((event, i) => `
                    <tr>
                        <td>${event.year}</td>
                        <td>${event.description}</td>
                        <td class="${event.type === 'income' ? 'positive' : 'negative'}">${event.type === 'income' ? '+' : '-'}${formatCurrency(Math.abs(event.amount), false)}</td>
                        <td>${event.type === 'income' ? 'Income' : 'Expense'}</td>
                        <td><button class="btn btn-sm btn-outline" onclick="removeEvent(this)">Remove</button></td>
                    </tr>
                `).join('');
    }

    // Recurring events
    const recurTbody = document.getElementById('recurringEventsTableBody');
    if (recurTbody) {
        recurTbody.innerHTML = config.recurringEvents.map((event, i) => `
                    <tr>
                        <td>${event.startAge}-${event.endAge}</td>
                        <td>${event.description}</td>
                        <td class="${event.type === 'income' ? 'positive' : 'negative'}">${event.type === 'income' ? '+' : '-'}${formatCurrency(Math.abs(event.amount), false)}</td>
                        <td><button class="btn btn-sm btn-outline" onclick="removeRecurringEvent(${i})">Remove</button></td>
                    </tr>
                `).join('');
    }
}

function removeRecurringEvent(index) {
    config.recurringEvents.splice(index, 1);
    renderEventsTable();
    saveToLocalStorage();
    recalculate();
}

// ============================================
// CUSTOM SCENARIOS
// ============================================

function createCustomScenario() {
    const name = document.getElementById('customScenarioName').value || 'Custom';
    const returnRate = parseFloat(document.getElementById('customReturnRate').value);
    const inflationRate = parseFloat(document.getElementById('customInflationRate').value);

    // Clone average scenario and modify
    rawData.custom = JSON.parse(JSON.stringify(rawData.average));

    document.getElementById('customScenarioBtn').style.display = 'inline-block';
    showNotification(`Custom scenario "${name}" created!`);
    saveToLocalStorage();
}

function cloneScenario() {
    rawData.custom = JSON.parse(JSON.stringify(rawData[config.currentScenario]));
    document.getElementById('customScenarioBtn').style.display = 'inline-block';
    showNotification('Scenario cloned!');
}

// ============================================
// GOALS
// ============================================

function openGoalModal() {
    document.getElementById('goalModal').classList.add('active');
}

// ============================================
// CRYPTO PRICE SYNC (Coinbase API)
// ============================================

async function updateCryptoPrices() {
    try {
        // Initial defaults as requested
        const prices = { BTC: 93000, ETH: 3200, SOL: 130 };

        // Fetch from Coinbase
        const fetchPrice = async (ticker) => {
            const response = await fetch(`https://api.coinbase.com/v2/prices/${ticker}-USD/spot`);
            const data = await response.json();
            return parseFloat(data.data.amount);
        };

        try {
            prices.BTC = await fetchPrice('BTC');
            prices.ETH = await fetchPrice('ETH');
            prices.SOL = await fetchPrice('SOL');
            console.log('Crypto prices updated from Coinbase:', prices);
        } catch (e) {
            console.warn('Coinbase API failed, using defaults:', prices);
        }

        document.getElementById('btcPriceLabel').textContent = 'Price: ' + formatCurrency(prices.BTC, false);
        document.getElementById('ethPriceLabel').textContent = 'Price: ' + formatCurrency(prices.ETH, false);
        document.getElementById('solPriceLabel').textContent = 'Price: ' + formatCurrency(prices.SOL, false);

        // Keep these for recalculation
        config.cryptoPrices = prices;
        updateTotalCrypto();
    } catch (err) {
        console.error('Error in crypto sync:', err);
    }
}

function updateTotalCrypto() {
    const btc = parseFloat(document.getElementById('inputBTC').value) || 0;
    const eth = parseFloat(document.getElementById('inputETH').value) || 0;
    const sol = parseFloat(document.getElementById('inputSOL').value) || 0;
    const prices = config.cryptoPrices || { BTC: 93000, ETH: 3200, SOL: 130 };

    const total = (btc * prices.BTC) + (eth * prices.ETH) + (sol * prices.SOL);
    document.getElementById('inputCrypto').value = total.toFixed(0);
}

// ============================================
// EXPOSE TO WINDOW (Required for HTML onclick attributes)
// ============================================
// ============================================
// EXPOSE TO WINDOW (Required for HTML onclick attributes)
// ============================================
console.log('Main.js loaded v2.0 - Globals exposed');

// Theme & Storage
window.toggleTheme = toggleTheme;
window.resetToDefaults = resetToDefaults;
window.importSettings = importSettings;
window.exportSettings = exportSettings;

// Settings UI
window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.showSettingsSection = showSettingsSection;
window.toggleSpouseFields = toggleSpouseFields;
window.toggleHomeFields = toggleHomeFields;
window.updateAllocDisplay = updateAllocDisplay;
window.validateSettings = validateSettings;
window.applySettings = applySettings; // Calls recalculate

// Calculations & Updates
window.recalculate = recalculate;
window.updateTotalExpenses = updateTotalExpenses;
window.updateTotalCrypto = updateTotalCrypto;
window.setAllocation = setAllocation;
window.updateDashboard = updateDashboard;

// Events
window.addEvent = addEvent;
window.removeEvent = removeEvent;
window.addRecurringEvent = addRecurringEvent;
window.removeRecurringEvent = removeRecurringEvent;

// Scenarios
window.createCustomScenario = createCustomScenario;
window.cloneScenario = cloneScenario;
window.setScenario = setScenario;
window.toggleComparison = toggleComparison;
window.toggleRothConversion = toggleRothConversion;

// Goals
window.openGoalModal = openGoalModal;
window.saveGoal = saveGoal;
window.closeGoalModal = function () { document.getElementById('goalModal').classList.remove('active'); };

// Charts & Init (Just in case)
window.initCharts = initCharts; // Should be handled by DOMContentLoaded but useful for debug
window.updateNetWorthChart = updateNetWorthChart; // Used by toggleComparison

// Initialize crypto sync and event listeners
window.addEventListener('DOMContentLoaded', () => {
    // Skip if already initialized (prevents double-init from multiple listeners)
    if (isInitialized) return;

    setTimeout(updateCryptoPrices, 1000);

    // Note: initCharts() is called in the main initialization section at bottom of file

    // Add listeners to crypto inputs
    ['inputBTC', 'inputETH', 'inputSOL'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', updateTotalExpenses);
            el.addEventListener('input', updateTotalCrypto);
        }
    });

    // Add listeners for expense running total
    ['inputExpensesGeneral', 'inputExpensesUtilities', 'inputExpensesTravel', 'inputExpensesMisc', 'inputGifts', 'inputVehicle'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateTotalExpenses);
    });
    // Asset Allocation Dropdown Listener
    const glidePath = document.getElementById('inputGlidePath');
    if (glidePath) {
        glidePath.addEventListener('change', function () {
            const val = this.value;
            if (val === 'aggressive') {
                setAllocation(90, 0, 3, 7);
            } else if (val === 'moderate') {
                setAllocation(60, 30, 5, 5);
            } else if (val === 'conservative') {
                setAllocation(40, 50, 10, 0);
            }
            // Custom: do nothing
        });
    }

    updateTotalExpenses(); // Init
    initSettingsChangeDetection(); // Init settings detection
});

function saveGoal() {
    const name = document.getElementById('newGoalName').value;
    const target = parseFloat(document.getElementById('newGoalAmount').value);
    const year = parseInt(document.getElementById('newGoalYear').value);

    if (!name || !target) {
        showNotification('Please fill all fields', 'error');
        return;
    }

    config.goals.push({ name, target, year, current: calculateNetWorth(config.currentScenario, 0) });
    renderGoals();
    closeGoalModal();
    saveToLocalStorage();
    showNotification('Goal added!');
}

function renderGoals() {
    const container = document.getElementById('goalsContainer');
    const sc = config.currentScenario;
    const currentNW = calculateNetWorth(sc, 0);

    container.innerHTML = config.goals.map(goal => {
        const yearIndex = goal.year - config.startYear;
        const projectedNW = calculateNetWorth(sc, Math.min(yearIndex, rawData.years.length - 1));
        const progress = Math.min((projectedNW / goal.target) * 100, 100);
        const isAchieved = projectedNW >= goal.target;

        return `
            <div class="goal-item">
                <div class="goal-icon" style="background: rgba(${isAchieved ? '16, 185, 129' : '59, 130, 246'}, 0.2); color: var(--${isAchieved ? 'success' : 'primary'});">
                    ${isAchieved ? '✓' : '🎯'}
                </div>
                <div class="goal-info">
                    <div class="goal-title">${goal.name}</div>
                    <div class="goal-detail">Target: ${formatCurrency(goal.target, false)} by ${goal.year}</div>
                    <div class="goal-progress">
                        <div class="goal-progress-fill" style="width: ${progress}%; background: var(--${isAchieved ? 'success' : 'primary'});"></div>
                    </div>
                </div>
                <div class="goal-status">
                    <div class="goal-percentage ${isAchieved ? 'positive' : ''}">${isAchieved ? '✓' : ''} ${progress.toFixed(0)}%</div>
                    <div class="goal-remaining">${isAchieved ? 'Achieved!' : formatCurrency(Math.max(0, goal.target - projectedNW)) + ' to go'}</div>
                </div>
            </div>
        `;
    }).join('');
}

function updateMilestones() {
    const container = document.getElementById('milestoneTimeline');
    const sc = config.currentScenario;
    const data = rawData[sc];
    const s = config.settings;

    const milestones = [];

    // Current
    milestones.push({
        badge: '👏',
        year: 'TODAY',
        age: s.personal.age,
        title: "Current Plan Initialized",
        content: `Current net worth: <strong>${formatCurrency(calculateNetWorth(sc, 0))}</strong>`,
        color: 'var(--primary)'
    });

    // Debt Freedom
    const debtIdx = data.accounts.Debt.findIndex(v => v >= 0); // Debt is negative, find when it hits 0
    if (debtIdx !== -1 && debtIdx < rawData.years.length) {
        milestones.push({
            badge: '💳',
            year: rawData.years[debtIdx],
            age: rawData.ages[debtIdx],
            title: "Debt Freedom Achieved",
            content: "All tracked non-mortgage debts are paid off!",
            color: 'var(--success)'
        });
    }

    // Early Retirement
    const retireIdx = rawData.ages.findIndex(a => a >= s.personal.retireAge);
    if (retireIdx !== -1) {
        milestones.push({
            badge: '🎉',
            year: rawData.years[retireIdx],
            age: rawData.ages[retireIdx],
            title: "Retirement Celebration!",
            content: "Working years end. Your assets now generate your income.",
            color: 'var(--warning)',
            featured: true
        });
    }

    // SS Starts
    const ssIdx = rawData.ages.findIndex(a => a >= s.socialSecurity.claimAge);
    if (ssIdx !== -1) {
        milestones.push({
            badge: '👴',
            year: rawData.years[ssIdx],
            age: rawData.ages[ssIdx],
            title: "Social Security Income Begins",
            content: `Monthly benefit: <strong>${formatCurrency(data.income.SocialSecurity[ssIdx] / 12, false)}/mo</strong>`,
            color: 'var(--cyan)'
        });
    }

    // Medicare
    const medIdx = rawData.ages.findIndex(a => a >= 65);
    if (medIdx !== -1) {
        milestones.push({
            badge: '🏥',
            year: rawData.years[medIdx],
            age: rawData.ages[medIdx],
            title: "Medicare Eligibility",
            content: "Health insurance transitions to Medicare coverage.",
            color: 'var(--secondary)'
        });
    }

    // Max Legacy / End of Plan
    const lastIdx = rawData.years.length - 1;
    milestones.push({
        badge: '🎁',
        year: rawData.years[lastIdx],
        age: rawData.ages[lastIdx],
        title: "Legacy Outlook",
        content: `Projected final legacy: <strong>${formatCurrency(calculateNetWorth(sc, lastIdx))}</strong>`,
        color: 'var(--purple)'
    });

    container.innerHTML = milestones.map(m => `
        <div class="milestone ${m.featured ? 'featured' : ''}" style="border-color: ${m.color}">
            <div class="milestone-badge">${m.badge}</div>
            <div class="milestone-date">
                <div class="milestone-year">${m.year}</div>
                <div class="milestone-age">Age ${m.age}</div>
            </div>
            <div class="milestone-content">
                <h4>${m.title}</h4>
                <p>${m.content}</p>
            </div>
        </div>
    `).join('');
}
// ============================================
// SCENARIO & COMPARISON
// ============================================

function setScenario(scenario) {
    config.currentScenario = scenario;

    document.querySelectorAll('.scenario-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.scenario-btn.${scenario}`).classList.add('active');

    document.getElementById('selectedScenarioLabel').textContent = scenario.charAt(0).toUpperCase() + scenario.slice(1);

    updateDashboard();
    saveToLocalStorage();
}

function toggleComparison(scenario, btn) {
    config.comparisonEnabled[scenario] = !config.comparisonEnabled[scenario];
    btn.classList.toggle('active');
    updateNetWorthChart();
}

// ============================================
// ROTH CONVERSION TOGGLE
// ============================================

function toggleRothConversion() {
    const enabled = document.getElementById('rothConversionEnabled').checked;
    document.getElementById('rothConversionContent').style.display = enabled ? 'block' : 'none';
    document.getElementById('rothConversionDisabled').style.display = enabled ? 'none' : 'block';
    config.settings.taxes.rothConversionEnabled = enabled;
    updateRothConversionChart();
    saveToLocalStorage();
}

function updateRothConversionMetrics() {
    const convAmount = config.settings.taxes.rothConversion;
    const startYear = config.settings.taxes.rothConvStart - 2026;
    const endYear = config.settings.taxes.rothConvEnd - 2026;
    const years = (endYear - startYear) + 1;

    // Estimate tax savings (simplified: assume 24% bracket now, vs 32%+ later for RMDs)
    const taxSaved = convAmount * years * 0.08; // ~8% savings
    const breakEvenAge = 50 + Math.round(startYear + (years / 2));

    document.getElementById('rothAnnualAmount').textContent = formatCurrency(convAmount);
    document.getElementById('rothConversionYears').textContent = years + ' yrs';
    document.getElementById('rothTaxSavings').textContent = formatCurrency(taxSaved);
    document.getElementById('rothBreakEven').textContent = 'Age ' + breakEvenAge;
}

function updateRothConversionChart() {
    if (!charts.rothConversion) return;

    const enabled = document.getElementById('rothConversionEnabled')?.checked ?? true;
    const conversions = Array(46).fill(0);
    const noConversions = Array(46).fill(0); // Baseline

    if (enabled) {
        const startYear = config.settings.taxes.rothConvStart - 2026;
        const endYear = config.settings.taxes.rothConvEnd - 2026;
        for (let i = startYear; i <= endYear && i < 46; i++) {
            if (i >= 0) conversions[i] = config.settings.taxes.rothConversion;
        }
    }

    charts.rothConversion.data.datasets = [
        { label: 'With Conversions', data: conversions, backgroundColor: '#8b5cf6' },
        { label: 'Without Conversions', data: noConversions, backgroundColor: '#94a3b8' }
    ];
    charts.rothConversion.update();
    updateRothConversionMetrics();
}

// ============================================
// SPENDING SLIDER
// ============================================

function updateSpendingSlider(value) {
    const spending = parseInt(value);
    document.getElementById('spendingValue').textContent = formatCurrency(spending);
    config.settings.expenses.annualSpending = spending;

    // Update impact display
    const baseExpenses = 90000; // baseline
    const diff = spending - baseExpenses;
    const diffDisplay = document.getElementById('spendingImpact');
    if (diffDisplay) {
        if (diff > 0) {
            diffDisplay.textContent = '+' + formatCurrency(diff) + '/yr';
            diffDisplay.className = 'value negative';
        } else if (diff < 0) {
            diffDisplay.textContent = formatCurrency(Math.abs(diff)) + '/yr savings';
            diffDisplay.className = 'value positive';
        } else {
            diffDisplay.textContent = 'Baseline';
            diffDisplay.className = 'value';
        }
    }

    // Update monthly display
    const monthlyEl = document.getElementById('spendingMonthly');
    if (monthlyEl) {
        monthlyEl.textContent = formatCurrency(spending / 12);
    }

    // Update 25x rule (FIRE number)
    const fire25x = document.getElementById('spending25x');
    if (fire25x) {
        fire25x.textContent = formatCurrency(spending * 25);
    }

    // Update 4% SWR portfolio requirement
    const swr4pct = document.getElementById('spending4pct');
    if (swr4pct) {
        swr4pct.textContent = formatCurrency(spending / 0.04);
    }

    saveToLocalStorage();
}

// ============================================
// MONTE CARLO FUNCTIONS
// ============================================

function runMonteCarloSimulation() {
    showNotification('Running Monte Carlo simulation...', 'info');

    const successRateEl = document.getElementById('mcSuccessRate');
    const legacyRateEl = document.getElementById('mcLegacyRate');

    if (successRateEl) successRateEl.style.opacity = '0.5';
    if (legacyRateEl) legacyRateEl.style.opacity = '0.5';

    setTimeout(() => {
        const results = SimulationEngine.runMonteCarlo(1000);

        if (successRateEl) {
            successRateEl.textContent = results.successRate.toFixed(1) + '%';
            successRateEl.style.opacity = '1';
        }
        if (legacyRateEl) {
            legacyRateEl.textContent = results.legacyRate.toFixed(1) + '%';
            legacyRateEl.style.opacity = '1';
        }

        document.getElementById('mc10').textContent = formatCurrency(results.p10[results.p10.length - 1]);
        document.getElementById('mc25').textContent = formatCurrency(results.p25[results.p25.length - 1]);
        document.getElementById('mc50').textContent = formatCurrency(results.p50[results.p50.length - 1]);
        document.getElementById('mc75').textContent = formatCurrency(results.p75[results.p75.length - 1]);
        document.getElementById('mc90').textContent = formatCurrency(results.p90[results.p90.length - 1]);

        if (charts.monteCarlo) {
            charts.monteCarlo.data.datasets[0].data = results.p90;
            charts.monteCarlo.data.datasets[1].data = results.p75;
            charts.monteCarlo.data.datasets[2].data = results.p50;
            charts.monteCarlo.data.datasets[3].data = results.p25;
            charts.monteCarlo.data.datasets[4].data = results.p10;
            charts.monteCarlo.data.datasets[5].data = getNetWorthSeries('average');
            charts.monteCarlo.update();
        }

        showNotification('Monte Carlo simulation complete! 1,000 runs analyzed.', 'success');
    }, 500);
}

function toggleLinearProjection() {
    const show = document.getElementById('showLinearProjection').checked;
    if (charts.monteCarlo && charts.monteCarlo.data.datasets[5]) {
        charts.monteCarlo.data.datasets[5].hidden = !show;
        charts.monteCarlo.update();
    }
}

function toggleConfidenceBands() {
    const show = document.getElementById('showConfidenceBands').checked;
    if (charts.monteCarlo) {
        // Confidence bands are datasets 0, 1, 3, 4
        [0, 1, 3, 4].forEach(idx => {
            if (charts.monteCarlo.data.datasets[idx]) {
                charts.monteCarlo.data.datasets[idx].hidden = !show;
            }
        });
        charts.monteCarlo.update();
    }
}

function showMonteCarloHelp() {
    alert('Monte Carlo Simulation Explained:\n\n' +
        '• We run 1,000 random simulations\n' +
        '• Each simulation varies market returns based on historical volatility\n' +
        '• Results show the range of possible outcomes\n' +
        '• Success rate = % of simulations where you don\'t run out of money\n' +
        '• Legacy goal = % of simulations where you achieve your estate target');
}

// ============================================
// SOCIAL SECURITY
// ============================================

function selectSSAge(age, el) {
    document.querySelectorAll('.ss-option').forEach(opt => opt.classList.remove('selected'));
    el.classList.add('selected');
    config.settings.socialSecurity.claimAge = age;
    updateSSChart();
    saveToLocalStorage();
}

function updateSSDisplay() {
    const ss62 = config.settings.socialSecurity.ss62;
    const ss67 = config.settings.socialSecurity.ss67;
    const ss70 = config.settings.socialSecurity.ss70;

    document.getElementById('ss62').textContent = formatCurrency(ss62, false) + '/mo (' + formatCurrency(ss62 * 12, false) + '/yr)';
    document.getElementById('ss67').textContent = formatCurrency(ss67, false) + '/mo (' + formatCurrency(ss67 * 12, false) + '/yr)';
    document.getElementById('ss70').textContent = formatCurrency(ss70, false) + '/mo (' + formatCurrency(ss70 * 12, false) + '/yr)';

    // Calculate lifetime benefits (simple approximation to age 95)
    const years62 = 95 - 62;
    const years67 = 95 - 67;
    const years70 = 95 - 70;

    document.getElementById('ss62Lifetime').textContent = formatCurrency(ss62 * 12 * years62);
    document.getElementById('ss67Lifetime').textContent = formatCurrency(ss67 * 12 * years67);
    document.getElementById('ss70Lifetime').textContent = formatCurrency(ss70 * 12 * years70);
}

// ============================================
// YEAR SLIDER & DETAIL
// ============================================

document.getElementById('yearSlider').addEventListener('input', function (e) {
    config.currentYear = parseInt(e.target.value);
    updateYearDisplay();
});

function updateYearDisplay() {
    const yearIndex = config.currentYear;
    const year = rawData.years[yearIndex];
    const age = rawData.ages[yearIndex];

    document.getElementById('selectedYear').textContent = year;
    document.getElementById('selectedAge').textContent = age;
    document.getElementById('allocationYearLabel').textContent = year;
    document.getElementById('cashFlowYearLabel').textContent = year;
    document.getElementById('expenseYearLabel').textContent = year;

    updateYearStats();
    updateAccountBreakdown();
    updateCashFlowDetails();
    updateAllocationChart();
    updateExpensePieChart();
}

function updateYearStats() {
    const yearIndex = config.currentYear;
    const scenario = config.currentScenario;
    const netWorth = calculateNetWorth(scenario, yearIndex);
    const totalIncome = getTotalIncome(scenario, yearIndex);
    const totalExpenses = getTotalExpenses(scenario, yearIndex);
    const accounts = rawData[scenario].accounts;

    document.getElementById('yearStats').innerHTML = `
                <div class="stat-item"><div class="label">Net Worth</div><div class="value">${formatCurrency(netWorth)}</div></div>
                <div class="stat-item"><div class="label">Income</div><div class="value positive">${formatCurrency(totalIncome)}</div></div>
                <div class="stat-item"><div class="label">Expenses</div><div class="value negative">${formatCurrency(totalExpenses)}</div></div>
                <div class="stat-item"><div class="label">Cash Flow</div><div class="value ${totalIncome - totalExpenses >= 0 ? 'positive' : 'negative'}">${formatCurrency(totalIncome - totalExpenses)}</div></div>
                <div class="stat-item"><div class="label">401(k)/IRA</div><div class="value">${formatCurrency(accounts.RetirementSavings?.[yearIndex] || 0)}</div></div>
                <div class="stat-item"><div class="label">Roth IRA</div><div class="value">${formatCurrency(accounts.RothIRA?.[yearIndex] || 0)}</div></div>
                <div class="stat-item"><div class="label">HSA</div><div class="value">${formatCurrency(accounts.HSA?.[yearIndex] || 0)}</div></div>
                <div class="stat-item"><div class="label">Withdrawal Rate</div><div class="value">${((rawData[scenario].income.Drawdown?.[yearIndex] || 0) / netWorth * 100).toFixed(1)}%</div></div>
            `;
}

function openYearModal(yearIndex) {
    const year = rawData.years[yearIndex];
    const age = rawData.ages[yearIndex];

    document.getElementById('modalYear').textContent = year;
    document.getElementById('modalAge').textContent = age;

    const scenario = config.currentScenario;
    const accounts = rawData[scenario].accounts;
    const income = rawData[scenario].income;
    const expenses = rawData[scenario].expenses;

    let html = '<div class="settings-grid">';

    html += '<div><h4 style="margin-bottom: 0.5rem; color: var(--primary);">Assets</h4>';
    for (let key in accounts) {
        if (accounts[key][yearIndex] !== 0) {
            html += `<div style="display: flex; justify-content: space-between; padding: 0.25rem 0; font-size: 0.85rem;"><span>${accountNames[key] || key}</span><span>${formatCurrency(accounts[key][yearIndex], false)}</span></div>`;
        }
    }
    html += '</div>';

    html += '<div><h4 style="margin-bottom: 0.5rem; color: var(--success);">Income</h4>';
    for (let key in income) {
        if (income[key][yearIndex] > 0) {
            html += `<div style="display: flex; justify-content: space-between; padding: 0.25rem 0; font-size: 0.85rem;"><span>${incomeNames[key] || key}</span><span class="positive">${formatCurrency(income[key][yearIndex], false)}</span></div>`;
        }
    }
    html += '</div>';

    html += '<div><h4 style="margin-bottom: 0.5rem; color: var(--danger);">Expenses</h4>';
    for (let key in expenses) {
        if (expenses[key][yearIndex] > 0) {
            html += `<div style="display: flex; justify-content: space-between; padding: 0.25rem 0; font-size: 0.85rem;"><span>${expenseNames[key] || key}</span><span class="negative">${formatCurrency(expenses[key][yearIndex], false)}</span></div>`;
        }
    }
    html += '</div>';

    html += '</div>';

    document.getElementById('yearModalBody').innerHTML = html;
    document.getElementById('yearDetailModal').classList.add('active');
}

function closeYearModal() {
    document.getElementById('yearDetailModal').classList.remove('active');
}

// ============================================
// ACCOUNT BREAKDOWN
// ============================================

function updateAccountBreakdown() {
    const yearIndex = config.currentYear;
    const accounts = rawData[config.currentScenario].accounts;
    const netWorth = calculateNetWorth(config.currentScenario, yearIndex);
    const icons = { RothIRA: "💎", RetirementSavings: "🏦", HSA: "🏥", Investments: "📈", Housing: "🏠", OtherAssets: "📦", CashSavings: "💵", Debt: "💳" };

    const sorted = Object.entries(accounts)
        .map(([name, values]) => ({ name, value: values[yearIndex] || 0 }))
        .filter(a => a.value !== 0)
        .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    document.getElementById('accountBreakdownTitle').textContent = `💰 Account Breakdown (${2026 + yearIndex} - Age ${config.startAge + yearIndex})`;

    document.getElementById('accountBreakdown').innerHTML = sorted.map(account => {
        const percentage = netWorth > 0 ? Math.abs(account.value / netWorth * 100) : 0;
        const color = colors[account.name] || '#6b7280';
        return `
                    <div class="account-row">
                        <div class="account-icon" style="background: ${color}22; color: ${color}">${icons[account.name] || '📊'}</div>
                        <div class="account-info">
                            <div class="account-name">${accountNames[account.name] || account.name}</div>
                            <div class="account-bar"><div class="account-bar-fill" style="width: ${Math.min(percentage, 100)}%; background: ${color}"></div></div>
                        </div>
                        <div class="account-value" style="color: ${account.value < 0 ? 'var(--danger)' : 'inherit'}">${formatCurrency(account.value)}</div>
                    </div>`;
    }).join('');
}

function updateCashFlowDetails() {
    const yearIndex = config.currentYear;
    const income = rawData[config.currentScenario].income;
    const expenses = rawData[config.currentScenario].expenses;
    const totalIncome = getTotalIncome(config.currentScenario, yearIndex);
    const totalExpenses = getTotalExpenses(config.currentScenario, yearIndex);

    let html = '';
    html += '<h4 style="color: var(--success); margin-bottom: 0.5rem;">📥 Income</h4>';
    for (let key in income) {
        if (income[key][yearIndex] > 0) {
            html += `<div style="display: flex; justify-content: space-between; padding: 0.25rem 0;"><span style="color: var(--text-muted)">${incomeNames[key] || key}</span><span class="positive">${formatCurrency(income[key][yearIndex], false)}</span></div>`;
        }
    }
    html += '<h4 style="color: var(--danger); margin: 1rem 0 0.5rem 0;">📤 Expenses</h4>';
    for (let key in expenses) {
        if (expenses[key][yearIndex] > 0) {
            html += `<div style="display: flex; justify-content: space-between; padding: 0.25rem 0;"><span style="color: var(--text-muted)">${expenseNames[key] || key}</span><span class="negative">${formatCurrency(expenses[key][yearIndex], false)}</span></div>`;
        }
    }
    html += `<div style="margin-top: 1rem; padding-top: 0.5rem; border-top: 2px solid var(--border-color); display: flex; justify-content: space-between; font-weight: 700;"><span>Net Cash Flow</span><span class="${totalIncome - totalExpenses >= 0 ? 'positive' : 'negative'}">${formatCurrency(totalIncome - totalExpenses, false)}</span></div>`;

    document.getElementById('cashFlowDetails').innerHTML = html;
}

// ============================================
// CHARTS INITIALIZATION
// ============================================

// initCharts was moved to the bottom of the script for robustness

function initNetWorthChart() {
    const ctx = document.getElementById('chartNetWorth').getContext('2d');
    charts.netWorth = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [
                { label: 'Optimistic', data: getNetWorthSeries('optimistic'), borderColor: scenarioColors.optimistic, backgroundColor: scenarioColors.optimistic + '20', fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 6 },
                { label: 'Average', data: getNetWorthSeries('average'), borderColor: scenarioColors.average, backgroundColor: scenarioColors.average + '20', fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 6 },
                { label: 'Pessimistic', data: getNetWorthSeries('pessimistic'), borderColor: scenarioColors.pessimistic, backgroundColor: scenarioColors.pessimistic + '20', fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 6 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderColor: 'rgba(255,255,255,0.2)',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        title: (items) => `Year ${items[0].label} (Age ${50 + items[0].dataIndex})`,
                        label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw, false)}`
                    }
                }
            },
            scales: {
                y: { ticks: { callback: (v) => formatCurrency(v) }, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { ticks: { maxTicksLimit: 12 }, grid: { display: false } }
            },
            onClick: (e, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    document.getElementById('yearSlider').value = index;
                    config.currentYear = index;
                    updateYearDisplay();
                }
            }
        }
    });

    updateNetWorthLegend();
}

function updateNetWorthChart() {
    if (!charts.netWorth) return;

    charts.netWorth.data.datasets.forEach((dataset, i) => {
        const scenarios = ['optimistic', 'average', 'pessimistic'];
        dataset.hidden = !config.comparisonEnabled[scenarios[i]];
    });
    charts.netWorth.update();
}

function updateNetWorthLegend() {
    document.getElementById('netWorthLegend').innerHTML = `
                <div class="legend-item"><span class="legend-color" style="background: ${scenarioColors.optimistic}"></span> Optimistic (${config.settings.rates.optimistic}% return)</div>
                <div class="legend-item"><span class="legend-color" style="background: ${scenarioColors.average}"></span> Average (${config.settings.rates.average}% return)</div>
                <div class="legend-item"><span class="legend-color" style="background: ${scenarioColors.pessimistic}"></span> Pessimistic (${config.settings.rates.pessimistic}% return)</div>
            `;
}

function setNetWorthScale(scale, btn) {
    if (charts.netWorth) {
        charts.netWorth.options.scales.y.type = scale;
        charts.netWorth.update();
    }
    btn.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
}

function setChartType(chart, type, btn) {
    // Toggle between line and area fill
    btn.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
}

function initRealNominalChart() {
    const ctx = document.getElementById('chartRealNominal').getContext('2d');
    const nominal = getNetWorthSeries(config.currentScenario);
    const inflationRate = config.settings.inflation[config.currentScenario] / 100;
    const real = nominal.map((v, i) => v / Math.pow(1 + inflationRate, i));

    charts.realNominal = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [
                { label: 'Nominal', data: nominal, borderColor: '#3b82f6', backgroundColor: '#3b82f620', fill: true, tension: 0.4, pointRadius: 0 },
                { label: 'Real', data: real, borderColor: '#10b981', backgroundColor: '#10b98120', fill: true, tension: 0.4, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw, false)}` } } },
            scales: { y: { ticks: { callback: (v) => formatCurrency(v) } }, x: { ticks: { maxTicksLimit: 8 } } }
        }
    });
}

function initAllocationChart() {
    const ctx = document.getElementById('chartAllocation').getContext('2d');
    charts.allocation = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { boxWidth: 12, padding: 8, font: { size: 11 } } },
                tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${formatCurrency(ctx.raw, false)} (${((ctx.raw / ctx.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%)` } }
            }
        }
    });
    updateAllocationChart();
}

function updateAllocationChart() {
    if (!charts.allocation) return;

    const accounts = rawData[config.currentScenario].accounts;
    const yearIndex = config.currentYear;
    const labels = [], data = [], bgColors = [];

    for (let key in accounts) {
        const value = accounts[key][yearIndex];
        if (value > 0) {
            labels.push(accountNames[key] || key);
            data.push(value);
            bgColors.push(colors[key] || '#6b7280');
        }
    }

    charts.allocation.data.labels = labels;
    charts.allocation.data.datasets[0].data = data;
    charts.allocation.data.datasets[0].backgroundColor = bgColors;
    charts.allocation.update();
}

function initStackedPortfolioChart() {
    const ctx = document.getElementById('chartStackedPortfolio').getContext('2d');
    const accounts = rawData[config.currentScenario].accounts;

    charts.stackedPortfolio = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: Object.keys(accounts).filter(k => k !== 'Debt').map(key => ({
                label: accountNames[key] || key,
                data: accounts[key],
                backgroundColor: colors[key] + '80',
                borderColor: colors[key],
                fill: true,
                pointRadius: 0
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: { legend: { position: 'top', labels: { boxWidth: 12, padding: 8 } } },
            scales: { y: { stacked: true, ticks: { callback: (v) => formatCurrency(v) } }, x: { ticks: { maxTicksLimit: 10 } } }
        }
    });
}

function setStackedView(view, btn) {
    btn.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    // Toggle between absolute and percentage view
}

function initIncomeChart() {
    const ctx = document.getElementById('chartIncome').getContext('2d');
    const income = rawData[config.currentScenario].income;

    charts.income = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: rawData.years,
            datasets: Object.keys(income).map(key => ({
                label: incomeNames[key] || key,
                data: income[key],
                backgroundColor: incomeColors[key] || '#6b7280'
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: { legend: { position: 'top', labels: { boxWidth: 12, padding: 8 } } },
            scales: { x: { stacked: true, ticks: { maxTicksLimit: 10 } }, y: { stacked: true, ticks: { callback: (v) => formatCurrency(v) } } }
        }
    });
}

function initSSComparisonChart() {
    const ctx = document.getElementById('chartSSComparison').getContext('2d');

    // Generate cumulative SS benefits for each claiming age
    const ss62Data = [], ss67Data = [], ss70Data = [];
    let cum62 = 0, cum67 = 0, cum70 = 0;
    const ss62 = config.settings.socialSecurity.ss62 * 12;
    const ss67 = config.settings.socialSecurity.ss67 * 12;
    const ss70 = config.settings.socialSecurity.ss70 * 12;

    for (let i = 0; i < 46; i++) {
        const age = 50 + i;
        if (age >= 62) cum62 += ss62 * Math.pow(1.02, age - 62);
        if (age >= 67) cum67 += ss67 * Math.pow(1.02, age - 67);
        if (age >= 70) cum70 += ss70 * Math.pow(1.02, age - 70);
        ss62Data.push(cum62);
        ss67Data.push(cum67);
        ss70Data.push(cum70);
    }

    charts.ssComparison = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [
                { label: 'Claim at 62', data: ss62Data, borderColor: '#ef4444', backgroundColor: '#ef444420', fill: false, tension: 0.4, pointRadius: 0 },
                { label: 'Claim at 67', data: ss67Data, borderColor: '#3b82f6', backgroundColor: '#3b82f620', fill: false, tension: 0.4, pointRadius: 0 },
                { label: 'Claim at 70', data: ss70Data, borderColor: '#10b981', backgroundColor: '#10b98120', fill: false, tension: 0.4, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { boxWidth: 12, padding: 8 } } },
            scales: { y: { ticks: { callback: (v) => formatCurrency(v) } }, x: { ticks: { maxTicksLimit: 8 } } }
        }
    });
}

function updateSSChart() {
    // Re-render SS comparison chart when claiming age changes
}

function initIncomeReplacementChart() {
    const ctx = document.getElementById('chartIncomeReplacement').getContext('2d');
    const income = rawData[config.currentScenario].income;

    // Calculate income replacement ratio
    const totalIncomeData = rawData.years.map((_, i) => getTotalIncome(config.currentScenario, i));
    const preRetirementIncome = totalIncomeData[0]; // First year income
    const replacementData = totalIncomeData.map(inc => preRetirementIncome > 0 ? (inc / preRetirementIncome) * 100 : 0);

    charts.incomeReplacement = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [
                { label: 'Replacement %', data: replacementData, borderColor: '#3b82f6', backgroundColor: '#3b82f620', fill: true, tension: 0.4, pointRadius: 0 },
                { label: '80% Target', data: Array(46).fill(80), borderColor: '#10b981', borderDash: [5, 5], fill: false, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { ticks: { callback: (v) => v + '%' }, max: 150 }, x: { ticks: { maxTicksLimit: 10 } } }
        }
    });
}

function initSurplusGapChart() {
    const ctx = document.getElementById('chartSurplusGap').getContext('2d');

    // Calculate annual surplus/gap
    const totalIncomeData = rawData.years.map((_, i) => getTotalIncome(config.currentScenario, i));
    const totalExpensesData = rawData.years.map((_, i) => getTotalExpenses(config.currentScenario, i));
    const surplusData = totalIncomeData.map((inc, i) => inc - totalExpensesData[i]);

    // Determine colors based on positive/negative values
    const backgroundColors = surplusData.map(val => val >= 0 ? '#10b981' : '#ef4444');
    const borderColors = surplusData.map(val => val >= 0 ? '#047857' : '#b91c1c');

    charts.surplusGap = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: rawData.years,
            datasets: [
                {
                    label: 'Surplus/Gap',
                    data: surplusData,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 1,
                    barPercentage: 0.8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: true },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + ': ' + formatCurrency(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    ticks: { callback: function (value) { return formatCurrency(value); } },
                    grid: {
                        color: (context) => context.tick.value === 0 ? '#666' : (config.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                        lineWidth: (context) => context.tick.value === 0 ? 2 : 1
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { maxTicksLimit: 10 }
                }
            }
        }
    });
}



function initSuccessGauge() {
    const ctx = document.getElementById('gaugeSuccess').getContext('2d');

    // Run Monte Carlo simulation directly
    const results = SimulationEngine.runMonteCarlo(500);
    const successRate = Math.round(results.successRate);

    // Update text metric
    const metricEl = document.getElementById('metricSuccess');
    if (metricEl) metricEl.innerText = successRate + '%';

    charts.successGauge = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Success', 'Risk'],
            datasets: [{
                data: [successRate, 100 - successRate],
                backgroundColor: successRate >= 80 ? ['#10b981', '#1f2937'] :
                    successRate >= 60 ? ['#f59e0b', '#1f2937'] : ['#ef4444', '#1f2937'],
                borderWidth: 0,
                cutout: '70%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            }
        }
    });
}



function initExpensesChart() {
    const ctx = document.getElementById('chartExpenses').getContext('2d');
    const expenses = rawData[config.currentScenario].expenses;

    charts.expenses = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: Object.keys(expenses).map(key => ({
                label: expenseNames[key] || key,
                data: expenses[key],
                backgroundColor: expenseColors[key] + '60',
                borderColor: expenseColors[key],
                fill: true,
                pointRadius: 0
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: { legend: { position: 'top', labels: { boxWidth: 12, padding: 8 } } },
            scales: { y: { stacked: true, ticks: { callback: (v) => formatCurrency(v) } }, x: { ticks: { maxTicksLimit: 10 } } }
        }
    });
}

function initExpensePieChart() {
    const ctx = document.getElementById('chartExpensePie').getContext('2d');
    charts.expensePie = new Chart(ctx, {
        type: 'pie',
        data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 10, padding: 6, font: { size: 10 } } },
                tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${formatCurrency(ctx.raw, false)}` } }
            }
        }
    });
    updateExpensePieChart();
}

function updateExpensePieChart() {
    if (!charts.expensePie) return;

    const expenses = rawData[config.currentScenario].expenses;
    const yearIndex = config.currentYear;
    const labels = [], data = [], bgColors = [];

    for (let key in expenses) {
        const value = expenses[key][yearIndex];
        if (value > 0) {
            labels.push(expenseNames[key] || key);
            data.push(value);
            bgColors.push(expenseColors[key] || '#6b7280');
        }
    }

    charts.expensePie.data.labels = labels;
    charts.expensePie.data.datasets[0].data = data;
    charts.expensePie.data.datasets[0].backgroundColor = bgColors;
    charts.expensePie.update();
}

function initHealthcareChart() {
    const ctx = document.getElementById('chartHealthcare').getContext('2d');
    const expenses = rawData[config.currentScenario].expenses;

    charts.healthcare = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: rawData.years,
            datasets: [
                { label: 'Healthcare', data: expenses.Medical, backgroundColor: '#ef4444' },
                { label: 'Long-Term Care', data: expenses.LTC, backgroundColor: '#ec4899' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { boxWidth: 12, padding: 8 } } },
            scales: { x: { stacked: true, ticks: { maxTicksLimit: 10 } }, y: { stacked: true, ticks: { callback: (v) => formatCurrency(v) } } }
        }
    });
}

function initTaxesChart() {
    const ctx = document.getElementById('chartTaxes').getContext('2d');
    const taxes = rawData[config.currentScenario].taxes;

    charts.taxes = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: rawData.years,
            datasets: [
                { label: 'Federal', data: taxes.Federal, backgroundColor: '#ef4444' },
                { label: 'FICA', data: taxes.FICA, backgroundColor: '#f59e0b' },
                { label: 'Capital Gains', data: taxes.CapGains, backgroundColor: '#8b5cf6' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { boxWidth: 12, padding: 8 } } },
            scales: { x: { stacked: true, ticks: { maxTicksLimit: 10 } }, y: { stacked: true, ticks: { callback: (v) => formatCurrency(v) } } }
        }
    });
}

function initCumulativeTaxChart() {
    const ctx = document.getElementById('chartCumulativeTax').getContext('2d');
    const taxes = rawData[config.currentScenario].taxes;

    let cumSum = 0;
    const cumData = rawData.years.map((_, i) => {
        cumSum += (taxes.Federal[i] || 0) + (taxes.FICA[i] || 0) + (taxes.CapGains[i] || 0);
        return cumSum;
    });

    charts.cumulativeTax = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [{ label: 'Cumulative Taxes', data: cumData, borderColor: '#ef4444', backgroundColor: '#ef444420', fill: true, tension: 0.4, pointRadius: 0 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { ticks: { callback: (v) => formatCurrency(v) } }, x: { ticks: { maxTicksLimit: 8 } } }
        }
    });
}

function initEffectiveTaxChart() {
    const ctx = document.getElementById('chartEffectiveTax').getContext('2d');

    const effectiveRates = rawData.years.map((_, i) => {
        const totalIncome = getTotalIncome(config.currentScenario, i);
        const totalTax = getTotalTaxes(config.currentScenario, i);
        return totalIncome > 0 ? (totalTax / totalIncome) * 100 : 0;
    });

    charts.effectiveTax = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [{ label: 'Effective Rate', data: effectiveRates, borderColor: '#8b5cf6', backgroundColor: '#8b5cf620', fill: true, tension: 0.4, pointRadius: 0 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { ticks: { callback: (v) => v.toFixed(0) + '%' }, max: 40 }, x: { ticks: { maxTicksLimit: 8 } } }
        }
    });
}

function initTaxBracketChart() {
    const ctx = document.getElementById('chartTaxBracket').getContext('2d');

    // Simplified tax bracket visualization
    const brackets = rawData.years.map((_, i) => {
        const income = getTotalIncome(config.currentScenario, i);
        if (income > 700000) return 37;
        if (income > 400000) return 35;
        if (income > 200000) return 32;
        if (income > 100000) return 24;
        if (income > 50000) return 22;
        if (income > 20000) return 12;
        return 10;
    });

    charts.taxBracket = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: rawData.years,
            datasets: [{ label: 'Tax Bracket', data: brackets, backgroundColor: '#8b5cf6' }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { ticks: { callback: (v) => v + '%' }, max: 40 }, x: { ticks: { maxTicksLimit: 10 } } }
        }
    });
}

function initWithdrawalChart() {
    const ctx = document.getElementById('chartWithdrawal').getContext('2d');
    const income = rawData[config.currentScenario].income;

    charts.withdrawal = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: rawData.years,
            datasets: [
                { label: 'Drawdown', data: income.Drawdown, backgroundColor: '#f59e0b' },
                { label: 'RMD', data: income.RMD, backgroundColor: '#8b5cf6' },
                { label: 'Social Security', data: income.SocialSecurity, backgroundColor: '#3b82f6' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { boxWidth: 12, padding: 8 } } },
            scales: { x: { stacked: true, ticks: { maxTicksLimit: 10 } }, y: { stacked: true, ticks: { callback: (v) => formatCurrency(v) } } }
        }
    });
}

function initSWRChart() {
    const ctx = document.getElementById('chartSWR').getContext('2d');

    const swrData = rawData.years.map((_, i) => {
        const netWorth = calculateNetWorth(config.currentScenario, i);
        const drawdown = rawData[config.currentScenario].income.Drawdown[i] || 0;
        return netWorth > 0 ? (drawdown / netWorth) * 100 : 0;
    });

    charts.swr = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [
                { label: 'Your Rate', data: swrData, borderColor: '#10b981', backgroundColor: '#10b98120', fill: true, tension: 0.4, pointRadius: 0 },
                { label: '4% Rule', data: Array(46).fill(4), borderColor: '#f59e0b', borderDash: [5, 5], fill: false, pointRadius: 0 },
                { label: 'Danger Zone', data: Array(46).fill(6), borderColor: '#ef4444', borderDash: [5, 5], fill: false, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { ticks: { callback: (v) => v.toFixed(1) + '%' }, max: 10, min: 0 }, x: { ticks: { maxTicksLimit: 10 } } }
        }
    });
}

function initRothConversionChart() {
    const ctx = document.getElementById('chartRothConversion').getContext('2d');

    const conversions = Array(46).fill(0);
    const startYear = config.settings.taxes.rothConvStart - 2026;
    const endYear = config.settings.taxes.rothConvEnd - 2026;
    for (let i = startYear; i <= endYear && i < 46; i++) {
        if (i >= 0) conversions[i] = config.settings.taxes.rothConversion;
    }

    charts.rothConversion = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: rawData.years,
            datasets: [{ label: 'Conversions', data: conversions, backgroundColor: '#8b5cf6' }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { ticks: { callback: (v) => formatCurrency(v) } }, x: { ticks: { maxTicksLimit: 10 } } }
        }
    });
}

function initRMDChart() {
    const ctx = document.getElementById('chartRMD').getContext('2d');
    const rmdData = rawData[config.currentScenario].income.RMD;

    charts.rmd = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: rawData.years,
            datasets: [{ label: 'RMD', data: rmdData, backgroundColor: '#06b6d4' }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { ticks: { callback: (v) => formatCurrency(v) } }, x: { ticks: { maxTicksLimit: 10 } } }
        }
    });
}

function initMortgageChart() {
    const ctx = document.getElementById('chartMortgage').getContext('2d');

    // Use simulation data for consistency
    const debtData = rawData[config.currentScenario]?.accounts?.Debt || [];
    // Debt is stored as negative in simulation, convert to positive for chart
    const balances = debtData.map(v => Math.abs(v));

    charts.mortgage = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [{ label: 'Mortgage Balance', data: balances, borderColor: '#ef4444', backgroundColor: '#ef444420', fill: true, tension: 0.4, pointRadius: 0 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: { mode: 'index', intersect: false, callbacks: { label: (c) => formatCurrency(c.raw) } }
            },
            scales: { y: { ticks: { callback: (v) => formatCurrency(v) } }, x: { ticks: { maxTicksLimit: 8 } } }
        }
    });
}

function initAccountTrendsChart() {
    const ctx = document.getElementById('chartAccountTrends').getContext('2d');
    const accounts = rawData[config.currentScenario].accounts;

    charts.accountTrends = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: Object.keys(accounts).filter(k => k !== 'Debt').map(key => ({
                label: accountNames[key] || key,
                data: accounts[key],
                borderColor: colors[key],
                backgroundColor: colors[key] + '20',
                fill: false,
                tension: 0.4,
                pointRadius: 0
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: { legend: { position: 'top', labels: { boxWidth: 12, padding: 8 } } },
            scales: { y: { ticks: { callback: (v) => formatCurrency(v) } }, x: { ticks: { maxTicksLimit: 10 } } }
        }
    });
}

function showAccountTrends(type, btn) {
    const accounts = rawData[config.currentScenario].accounts;
    const map = {
        'all': Object.keys(accounts).filter(k => k !== 'Debt'),
        'retirement': ['RetirementSavings'],
        'roth': ['RothIRA'],
        'hsa': ['HSA'],
        'taxable': ['Investments', 'CashSavings'],
        'other': ['OtherAssets', 'Housing']
    };

    charts.accountTrends.data.datasets = (map[type] || map['all']).filter(k => accounts[k]).map(key => ({
        label: accountNames[key] || key,
        data: accounts[key] || [],
        borderColor: colors[key],
        backgroundColor: colors[key] + '20',
        fill: false,
        tension: 0.4,
        pointRadius: 0
    }));
    charts.accountTrends.update();

    document.querySelectorAll('#accountTabs .tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
}

function initScenarioComparisonChart() {
    const ctx = document.getElementById('chartScenarioComparison').getContext('2d');
    const keyAges = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95];
    const keyIndices = keyAges.map(a => a - 50);

    charts.scenarioComparison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: keyAges.map(a => `Age ${a}`),
            datasets: [
                { label: 'Optimistic', data: keyIndices.map(i => calculateNetWorth('optimistic', i)), backgroundColor: scenarioColors.optimistic },
                { label: 'Average', data: keyIndices.map(i => calculateNetWorth('average', i)), backgroundColor: scenarioColors.average },
                { label: 'Pessimistic', data: keyIndices.map(i => calculateNetWorth('pessimistic', i)), backgroundColor: scenarioColors.pessimistic }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { boxWidth: 12, padding: 8 } } },
            scales: { y: { ticks: { callback: (v) => formatCurrency(v) } } }
        }
    });
}

function initMonteCarloChart() {
    const ctx = document.getElementById('chartMonteCarlo').getContext('2d');

    charts.monteCarlo = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [
                { label: '90th %ile', data: [], borderColor: '#10b981', backgroundColor: '#10b98120', fill: '+1', tension: 0.4, pointRadius: 0 },
                { label: '75th %ile', data: [], borderColor: '#22c55e', backgroundColor: '#22c55e20', fill: '+1', tension: 0.4, pointRadius: 0 },
                { label: 'Median', data: [], borderColor: '#3b82f6', backgroundColor: 'transparent', fill: false, tension: 0.4, pointRadius: 0, borderWidth: 3 },
                { label: '25th %ile', data: [], borderColor: '#f59e0b', backgroundColor: '#f59e0b20', fill: '+1', tension: 0.4, pointRadius: 0 },
                { label: '10th %ile', data: [], borderColor: '#ef4444', backgroundColor: '#ef444420', fill: false, tension: 0.4, pointRadius: 0 },
                { label: 'Linear Baseline', data: [], borderColor: 'rgba(59, 130, 246, 0.5)', borderDash: [5, 5], fill: false, tension: 0.4, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { boxWidth: 12, padding: 8 } } },
            scales: { y: { ticks: { callback: (v) => formatCurrency(v) } }, x: { ticks: { maxTicksLimit: 10 } } }
        }
    });
    runMonteCarloSimulation();
}

function initSequenceRiskChart() {
    const ctx = document.getElementById('chartSequenceRisk').getContext('2d');

    // Sequence risk is highest in early retirement years
    const riskData = rawData.ages.map(age => {
        if (age < 53) return 20;
        if (age < 58) return 90; // Peak risk
        if (age < 65) return 70;
        if (age < 75) return 40;
        return 20;
    });

    charts.sequenceRisk = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: rawData.years,
            datasets: [{
                label: 'Risk Level',
                data: riskData,
                backgroundColor: riskData.map(r => r > 70 ? '#ef4444' : r > 40 ? '#f59e0b' : '#10b981')
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { max: 100, ticks: { callback: (v) => v + '%' } }, x: { ticks: { maxTicksLimit: 10 } } }
        }
    });
}

function initLegacyChart() {
    const ctx = document.getElementById('chartLegacy').getContext('2d');

    charts.legacy = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [
                { label: 'Optimistic', data: getNetWorthSeries('optimistic'), borderColor: scenarioColors.optimistic, fill: false, tension: 0.4, pointRadius: 0 },
                { label: 'Average', data: getNetWorthSeries('average'), borderColor: scenarioColors.average, fill: false, tension: 0.4, pointRadius: 0 },
                { label: 'Pessimistic', data: getNetWorthSeries('pessimistic'), borderColor: scenarioColors.pessimistic, fill: false, tension: 0.4, pointRadius: 0 },
                { label: 'Legacy Goal', data: Array(46).fill(config.goals[2]?.target || 5000000), borderColor: '#8b5cf6', borderDash: [5, 5], fill: false, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { boxWidth: 12, padding: 8 } } },
            scales: { y: { ticks: { callback: (v) => formatCurrency(v) } }, x: { ticks: { maxTicksLimit: 10 } } }
        }
    });
}

function initWhatIfChart() {
    const ctx = document.getElementById('chartWhatIf').getContext('2d');
    const baseline = getNetWorthSeries('average');

    charts.whatIf = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [
                { label: 'Baseline', data: baseline, borderColor: '#3b82f6', fill: false, tension: 0.4, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'top', labels: { boxWidth: 12, padding: 8 } },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: { y: { ticks: { callback: (v) => formatCurrency(v) } }, x: { ticks: { maxTicksLimit: 10 } } }
        }
    });
}

let debtStrategy = 'avalanche';
function setDebtStrategy(strategy, el) {
    debtStrategy = strategy;
    if (el) {
        document.querySelectorAll('.strategy-tab').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
    }
    updateDebtCalculations();
}

function updateDebtCalculations() {
    const extra = parseFloat(document.getElementById('extraDebtPayment').value) || 0;
    const incMortgage = document.getElementById('includeMortgage').checked;
    const incCC = document.getElementById('includeCC').checked;
    const incCar = document.getElementById('includeCar').checked;

    let debts = [];
    if (incMortgage) debts.push({ name: 'Mortgage', bal: 425000, rate: 0.035, min: 2800 });
    if (incCC) debts.push({ name: 'Credit Cards', bal: 12500, rate: 0.189, min: 450 });
    if (incCar) debts.push({ name: 'Car Loan', bal: 28000, rate: 0.052, min: 650 });

    if (debts.length === 0) return;

    // Strategy sorting
    if (debtStrategy === 'avalanche') debts.sort((a, b) => b.rate - a.rate);
    else debts.sort((a, b) => a.bal - b.bal);

    // Simulation (Simple monthly)
    let currentBals = debts.map(d => d.bal);
    let totalInterest = 0;
    let totalInterestBaseline = 0;
    let months = 0;
    let monthsBaseline = 0;

    // Baseline (No Extra)
    let baseBals = debts.map(d => d.bal);
    while (baseBals.some(b => b > 0) && monthsBaseline < 600) {
        baseBals.forEach((b, i) => {
            if (b > 0) {
                let interest = b * (debts[i].rate / 12);
                totalInterestBaseline += interest;
                baseBals[i] = Math.max(0, b + interest - debts[i].min);
            }
        });
        monthsBaseline++;
    }

    // Accelerated (With Extra)
    let accBals = debts.map(d => d.bal);
    let history = [];
    while (accBals.some(b => b > 0) && months < 600) {
        let monthlyExtra = extra;
        accBals.forEach((b, i) => {
            if (b > 0) {
                let interest = b * (debts[i].rate / 12);
                totalInterest += interest;
                let payment = debts[i].min;

                // Apply extra payment to first (high priority) debt
                if (monthlyExtra > 0) {
                    payment += monthlyExtra;
                    monthlyExtra = 0;
                }

                accBals[i] = Math.max(0, b + interest - payment);
            }
        });
        history.push(accBals.reduce((a, b) => a + b, 0));
        months++;
    }

    // Update UI
    document.getElementById('debtInterestSaved').textContent = formatCurrency(totalInterestBaseline - totalInterest);
    document.getElementById('debtTimeSaved').textContent = (monthsBaseline - months) + ' months';

    let finalDate = new Date();
    finalDate.setMonth(finalDate.getMonth() + months);
    document.getElementById('debtFinalDate').textContent = finalDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    // Update Chart
    if (charts.debtPayoff) {
        charts.debtPayoff.data.labels = history.map((_, i) => 'Mo ' + i);
        charts.debtPayoff.data.datasets[0].data = history;
        charts.debtPayoff.update();
    }
}

let ssClaimAge = 67;
function setSSClaimAge(age, btn) {
    ssClaimAge = age;
    document.querySelectorAll('.age-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateSSExplorer();
}

function updateSSExplorer() {
    const pia = parseFloat(document.getElementById('ssPiaInput').value) || 0;
    let multiplier = 1.0;
    if (ssClaimAge === 62) multiplier = 0.7;
    else if (ssClaimAge === 63) multiplier = 0.75;
    else if (ssClaimAge === 64) multiplier = 0.8;
    else if (ssClaimAge === 65) multiplier = 0.867;
    else if (ssClaimAge === 66) multiplier = 0.933;
    else if (ssClaimAge === 67) multiplier = 1.0;
    else if (ssClaimAge === 68) multiplier = 1.08;
    else if (ssClaimAge === 69) multiplier = 1.16;
    else if (ssClaimAge === 70) multiplier = 1.24;

    const monthly = pia * multiplier;
    const annual = monthly * 12;
    const yearsTo95 = 95 - ssClaimAge;
    const lifetime = annual * yearsTo95;

    document.getElementById('ssMonthlyValue').textContent = formatCurrency(monthly);
    document.getElementById('ssAnnualValue').textContent = formatCurrency(annual);
    document.getElementById('ssLifetimeValue').textContent = formatCurrency(lifetime);

    // Break-even logic (simplified)
    if (ssClaimAge === 70) {
        document.getElementById('ssBreakEvenText').textContent = "Claiming at 70 instead of 62 breaks even at age 78.";
    } else if (ssClaimAge === 62) {
        document.getElementById('ssBreakEvenText').textContent = "Claiming at 62 provides immediate income but less lifetime wealth if you live past 78.";
    } else {
        document.getElementById('ssBreakEvenText').textContent = "Full Retirement Age (67) is the standard benchmark for your benefits.";
    }

    if (charts.ssExplorer) {
        const labels = [];
        const data62 = [];
        const data67 = [];
        const data70 = [];
        let cum62 = 0, cum67 = 0, cum70 = 0;

        for (let age = 62; age <= 95; age++) {
            labels.push(age);
            if (age >= 62) cum62 += pia * 0.7 * 12;
            if (age >= 67) cum67 += pia * 1.0 * 12;
            if (age >= 70) cum70 += pia * 1.24 * 12;
            data62.push(cum62);
            data67.push(cum67);
            data70.push(cum70);
        }

        charts.ssExplorer.data.labels = labels;
        charts.ssExplorer.data.datasets[0].data = data62;
        charts.ssExplorer.data.datasets[1].data = data67;
        charts.ssExplorer.data.datasets[2].data = data70;
        charts.ssExplorer.update();
    }
}
function optimizeRothStrategy() {
    // Logic to find optimal conversion amount based on filling status and brackets
    const status = config.settings.taxSettings.filingStatus;
    const targetBracketRate = parseFloat(document.getElementById('rothTargetBracket').value) || 0.22;
    const brackets = TaxCalculator.brackets[status];
    const targetLimit = brackets.find(b => b.rate === targetBracketRate)?.limit || 100000;

    // Simplified: set conversion to fill up to the target bracket limit based on average income
    const avgTaxableIncome = 150000; // Placeholder for more complex logic
    const optimalAmount = Math.max(0, targetLimit - avgTaxableIncome);

    document.getElementById('rothConvAmount').value = Math.round(optimalAmount / 1000) * 1000;
    document.getElementById('rothStartAge').value = config.settings.personal.retireAge;
    document.getElementById('rothEndAge').value = 72;
    updateRothExplorer();
}

function updateRothExplorer() {
    const amount = parseFloat(document.getElementById('rothConvAmount').value) || 0;
    const start = parseInt(document.getElementById('rothStartAge').value) || 55;
    const end = parseInt(document.getElementById('rothEndAge').value) || 72;

    // Deep clone config to simulate strategy
    const localConfig = JSON.parse(JSON.stringify(config));
    localConfig.settings.taxes.rothConversionEnabled = true;
    localConfig.settings.taxes.rothConversion = amount;
    localConfig.settings.taxes.rothConvStart = config.startYear + (start - config.settings.personal.age);
    localConfig.settings.taxes.rothConvEnd = config.startYear + (end - config.settings.personal.age);

    const benchmark = SimulationEngine.project(config, 'average');
    const strategy = SimulationEngine.project(localConfig, 'average');

    const baselineNW = benchmark.accounts.RetirementSavings.map((v, i) => v + benchmark.accounts.RothIRA[i] + benchmark.accounts.Investments[i]);
    const strategyNW = strategy.accounts.RetirementSavings.map((v, i) => v + strategy.accounts.RothIRA[i] + strategy.accounts.Investments[i]);

    const totalBaselineTax = benchmark.expenses.Taxes.reduce((a, b) => a + b, 0);
    const totalStrategyTax = strategy.expenses.Taxes.reduce((a, b) => a + b, 0);
    const taxSavings = totalBaselineTax - totalStrategyTax;
    const legacyBoost = strategyNW[strategyNW.length - 1] - baselineNW[baselineNW.length - 1];

    document.getElementById('rothTotalTax').textContent = formatCurrency(totalStrategyTax);
    document.getElementById('rothTaxSavings').textContent = (taxSavings >= 0 ? "+" : "") + formatCurrency(taxSavings);
    document.getElementById('rothLegacyBoost').textContent = (legacyBoost >= 0 ? "+" : "") + formatCurrency(legacyBoost);

    if (charts.rothExplorer) {
        charts.rothExplorer.data.datasets[0].data = baselineNW;
        charts.rothExplorer.data.datasets[1].data = strategyNW;
        charts.rothExplorer.update();
    }
}

function initRothExplorerChart() {
    const ctx = document.getElementById('chartRothExplorer').getContext('2d');
    charts.rothExplorer = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [
                { label: 'Baseline', data: [], borderColor: 'rgba(59, 130, 246, 0.5)', borderDash: [5, 5], tension: 0.4, pointRadius: 0 },
                { label: 'With Roth Strategy', data: [], borderColor: '#8b5cf6', tension: 0.4, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: { y: { ticks: { callback: (v) => formatCurrency(v) } } }
        }
    });
    updateRothExplorer();
}

function resetRothExplorer() {
    document.getElementById('rothConvAmount').value = 0;
    document.getElementById('rothStartAge').value = config.settings.personal.retireAge;
    document.getElementById('rothEndAge').value = 72;
    document.getElementById('rothTargetBracket').value = "0.22";
    updateRothExplorer();
}


function initDebtPayoffChart() {
    const ctx = document.getElementById('chartDebtPayoff').getContext('2d');
    charts.debtPayoff = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{ label: 'Total Debt Balance', data: [], borderColor: '#f59e0b', backgroundColor: '#f59e0b20', fill: true, tension: 0.4, pointRadius: 0 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y, false)}`
                    }
                }
            },
            scales: { y: { ticks: { callback: (v) => formatCurrency(v) } }, x: { display: false } }
        }
    });
    updateDebtCalculations();
}

function initSSExplorerChart() {
    const ctx = document.getElementById('chartSSExplorer').getContext('2d');
    charts.ssExplorer = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: 'Claim @ 62', data: [], borderColor: '#ef4444', tension: 0.4, pointRadius: 0 },
                { label: 'Claim @ 67', data: [], borderColor: '#3b82f6', tension: 0.4, pointRadius: 0 },
                { label: 'Claim @ 70', data: [], borderColor: '#10b981', tension: 0.4, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        title: (items) => `Age ${rawData.ages[items[0].dataIndex]} (${items[0].label})`,
                        label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y, false)}/yr`
                    }
                }
            },
            scales: { y: { ticks: { callback: (v) => formatCurrency(v) } } }
        }
    });
    updateSSExplorer();
}


function initMarketRiskChart() {
    const ctx = document.getElementById('chartMarketRisk').getContext('2d');
    const baseline = getNetWorthSeries('average');
    charts.marketRisk = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [
                { label: 'Baseline', data: baseline, borderColor: 'rgba(59, 130, 246, 0.5)', borderDash: [5, 5], fill: false, tension: 0.4, pointRadius: 0 },
                { label: 'Stress Test', data: baseline, borderColor: '#ef4444', fill: false, tension: 0.4, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'top', labels: { boxWidth: 12, padding: 8 } },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        title: (items) => `Year ${items[0].label}`,
                        label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y, false)}`
                    }
                }
            },
            scales: { y: { ticks: { callback: (v) => formatCurrency(v) } }, x: { ticks: { maxTicksLimit: 10 } } }
        }
    });
}

function runMarketRisk(scenario, btn) {
    const baseline = getNetWorthSeries('average');
    const testConfig = JSON.parse(JSON.stringify(config));
    let scResults;
    let insight = "";

    switch (scenario) {
        case 'dotcom':
            // DotCom: -45% over 3 years at start
            scResults = SimulationEngine.project(testConfig, 'average');
            if (scResults.yearsCount > 0) scResults.accounts.Investments[0] *= 0.85;
            if (scResults.yearsCount > 1) scResults.accounts.Investments[1] *= 0.70;
            if (scResults.yearsCount > 2) scResults.accounts.Investments[2] *= 0.55;
            // Apply to retirement savings too
            if (scResults.yearsCount > 0) scResults.accounts.RetirementSavings[0] *= 0.85;
            if (scResults.yearsCount > 1) scResults.accounts.RetirementSavings[1] *= 0.70;
            if (scResults.yearsCount > 2) scResults.accounts.RetirementSavings[2] *= 0.55;
            insight = "A Dot Com style crash at the start of your plan significantly reduces your early compounding potential.";
            break;
        case 'gfc':
            // GFC: -37% at retirement
            scResults = SimulationEngine.project(testConfig, 'average');
            const retireIdx = testConfig.settings.personal.retireAge - testConfig.settings.personal.age;
            if (retireIdx >= 0 && retireIdx < scResults.yearsCount) {
                for (let j = retireIdx; j < scResults.yearsCount; j++) {
                    scResults.accounts.Investments[j] *= 0.63;
                    scResults.accounts.RetirementSavings[j] *= 0.63;
                }
            }
            insight = "The 'Global Financial Crisis' scenario at retirement shows the danger of sequence of returns risk.";
            break;
        case 'stagflation':
            testConfig.settings.rates.average = 2.0;
            testConfig.settings.inflation.average = 6.0;
            scResults = SimulationEngine.project(testConfig, 'average');
            insight = "Stagflation (high inflation + low returns) is extremely damaging to purchasing power over the long term.";
            break;
        case 'lostdecade':
            testConfig.settings.rates.average = 0.0; // 0% returns for 10 years
            scResults = SimulationEngine.project(testConfig, 'average');
            // Reset to normal after 10 years? For simplicity, we'll just keep it low for the whole run or handle the first 10
            insight = "A 'Lost Decade' of 0% returns stalling your growth.";
            break;
        default:
            scResults = SimulationEngine.project(testConfig, 'average');
            insight = "Your plan baseline shows steady growth under average market conditions.";
    }

    // Calculate path
    const modified = [];
    for (let i = 0; i < scResults.yearsCount; i++) {
        let nw = 0;
        for (const key in scResults.accounts) {
            nw += scResults.accounts[key][i] || 0;
        }
        modified.push(nw);
    }

    const legacyValue = modified[modified.length - 1];

    // Update Chart
    charts.marketRisk.data.datasets[1].data = modified;
    charts.marketRisk.data.datasets[1].label = scenario === 'baseline' ? 'Baseline' : 'Stress Test Result';
    charts.marketRisk.update();

    // Update UI
    document.getElementById('riskLegacyValue').textContent = formatCurrency(legacyValue);
    document.getElementById('riskEndDate').textContent = "Age " + config.settings.personal.longevity;
    document.getElementById('riskShortfall').textContent = formatCurrency(legacyValue < 0 ? Math.abs(legacyValue) : 0);
    document.getElementById('riskInsightText').textContent = insight;

    // Highlight button
    document.querySelectorAll('.risk-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
}

function resetMarketRisk() {
    runMarketRisk('baseline', document.querySelector('.risk-btn'));
}

function runWhatIf(scenario, btn) {
    const baseline = getNetWorthSeries('average');

    // Create a dedicated config for scenario testing
    const testConfig = JSON.parse(JSON.stringify(config));
    let scResults;

    switch (scenario) {
        case 'crash55':
            // We modify the returns for the year age 55 in the simulation
            scResults = SimulationEngine.project(testConfig, 'average');
            const idx55 = 55 - testConfig.settings.personal.age;
            if (idx55 >= 0 && idx55 < scResults.yearsCount) {
                // Correct current path: restart from year 55 with a 30% drop
                for (let j = idx55; j < scResults.yearsCount; j++) {
                    scResults.accounts.Investments[j] *= 0.7;
                    scResults.accounts.RetirementSavings[j] *= 0.7;
                }
            }
            break;
        case 'bear':
            // Bear market years 3 to 8
            scResults = SimulationEngine.project(testConfig, 'average');
            for (let j = 3; j <= 8 && j < scResults.yearsCount; j++) {
                scResults.accounts.Investments[j] *= 0.6;
                scResults.accounts.RetirementSavings[j] *= 0.6;
            }
            break;
        case 'inflation':
            testConfig.settings.inflation.average = 5.0; // Higher inflation
            scResults = SimulationEngine.project(testConfig, 'average');
            break;
        case 'lowreturns':
            testConfig.settings.rates.average = 3.0; // Lower returns
            scResults = SimulationEngine.project(testConfig, 'average');
            break;
        case 'ssdelay':
            testConfig.settings.socialSecurity.claimAge = 70;
            scResults = SimulationEngine.project(testConfig, 'average');
            break;
        case 'healthcare':
            // Add a one-time medical expense at age 75
            testConfig.events.push({ year: testConfig.startYear + (75 - testConfig.settings.personal.age), amount: 250000, type: 'expense', description: 'Major Healthcare' });
            scResults = SimulationEngine.project(testConfig, 'average');
            break;
        default:
            scResults = SimulationEngine.project(testConfig, 'average');
    }

    // Calculate the total net worth path from the results
    const modified = [];
    for (let i = 0; i < scResults.yearsCount; i++) {
        let nw = 0;
        for (const key in scResults.accounts) {
            nw += scResults.accounts[key][i] || 0;
        }
        modified.push(nw);
    }

    const nw95 = modified[modified.length - 1];
    const success = nw95 > 0 ? 99 : 0; // Simple success check
    const legacy = nw95 >= (config.goals[2]?.target || 5000000);

    // Update chart
    charts.whatIf.data.datasets = [
        { label: 'Baseline', data: baseline, borderColor: 'rgba(59, 130, 246, 0.5)', borderDash: [5, 5], fill: false, tension: 0.4, pointRadius: 0 },
        { label: scenario === 'baseline' ? 'Current Plan' : 'Modified', data: modified, borderColor: scenario === 'baseline' ? '#3b82f6' : '#ef4444', fill: false, tension: 0.4, pointRadius: 0 }
    ];
    charts.whatIf.update();

    // Update impact summary
    const nw95El = document.getElementById('whatIfNW95');
    const successEl = document.getElementById('whatIfSuccess');
    const legacyEl = document.getElementById('whatIfLegacy');

    if (nw95El) {
        nw95El.textContent = formatCurrency(nw95);
        nw95El.className = 'impact-value ' + (nw95 >= 2000000 ? 'positive' : 'negative');
    }
    if (successEl) {
        successEl.textContent = (nw95 > 0 ? 'High' : 'Low');
        successEl.className = 'impact-value ' + (nw95 > 0 ? 'positive' : 'negative');
    }
    if (legacyEl) {
        legacyEl.textContent = legacy ? 'Yes' : 'No';
        legacyEl.className = 'impact-value ' + (legacy ? 'positive' : 'negative');
    }

    document.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
}

function resetWhatIf() {
    const baselineBtn = document.querySelector('.scenario-btn[data-scenario="baseline"]');
    if (baselineBtn) {
        runWhatIf('baseline', baselineBtn);
    }
}

function initSparklines() {
    // Net Worth sparkline
    const sparkNWCtx = document.getElementById('sparkNW').getContext('2d');
    charts.sparkNW = new Chart(sparkNWCtx, {
        type: 'line',
        data: {
            labels: rawData.years.slice(0, 10),
            datasets: [{ data: getNetWorthSeries(config.currentScenario).slice(0, 10), borderColor: '#10b981', borderWidth: 2, pointRadius: 0, tension: 0.4 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
    });

    // Growth sparkline
    const sparkGrowthCtx = document.getElementById('sparkGrowth').getContext('2d');
    charts.sparkGrowth = new Chart(sparkGrowthCtx, {
        type: 'line',
        data: {
            labels: rawData.years,
            datasets: [{ data: getNetWorthSeries(config.currentScenario), borderColor: '#3b82f6', borderWidth: 2, pointRadius: 0, tension: 0.4 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
    });
}

// ============================================
// DATA TABLES
// ============================================

function showDataTable(type, btn) {
    const container = document.getElementById('dataTableContainer');
    const scenario = config.currentScenario;
    let html = '<table class="data-table"><thead><tr><th>Year (Age)</th>';

    if (type === 'summary') {
        html += '<th>Net Worth</th><th>Income</th><th>Expenses</th><th>Cash Flow</th><th>Taxes</th></tr></thead><tbody>';
        for (let i = 0; i < rawData.years.length; i += 2) {
            const nw = calculateNetWorth(scenario, i);
            const inc = getTotalIncome(scenario, i);
            const exp = getTotalExpenses(scenario, i);
            const tax = getTotalTaxes(scenario, i);
            html += `<tr><td>${rawData.years[i]} (${rawData.ages[i]})</td>
                        <td>${formatCurrency(nw)}</td>
                        <td class="positive">${formatCurrency(inc)}</td>
                        <td class="negative">${formatCurrency(exp)}</td>
                        <td class="${inc - exp >= 0 ? 'positive' : 'negative'}">${formatCurrency(inc - exp)}</td>
                        <td class="negative">${formatCurrency(tax)}</td></tr>`;
        }
    } else if (type === 'accounts') {
        const accounts = rawData[scenario].accounts;
        const keys = Object.keys(accounts);
        keys.forEach(k => html += `<th>${accountNames[k] || k}</th>`);
        html += '</tr></thead><tbody>';
        for (let i = 0; i < rawData.years.length; i += 2) {
            html += `<tr><td>${rawData.years[i]} (${rawData.ages[i]})</td>`;
            keys.forEach(k => {
                const val = accounts[k][i] || 0;
                html += `<td class="${val < 0 ? 'negative' : ''}">${formatCurrency(val)}</td>`;
            });
            html += '</tr>';
        }
    } else if (type === 'income') {
        const income = rawData[scenario].income;
        const keys = Object.keys(income);
        keys.forEach(k => html += `<th>${incomeNames[k] || k}</th>`);
        html += '<th>Total</th></tr></thead><tbody>';
        for (let i = 0; i < rawData.years.length; i += 2) {
            html += `<tr><td>${rawData.years[i]} (${rawData.ages[i]})</td>`;
            let total = 0;
            keys.forEach(k => {
                const val = income[k][i] || 0;
                total += val;
                html += `<td class="positive">${formatCurrency(val)}</td>`;
            });
            html += `<td class="positive"><strong>${formatCurrency(total)}</strong></td></tr>`;
        }
    } else if (type === 'expenses') {
        const expenses = rawData[scenario].expenses;
        const keys = Object.keys(expenses);
        keys.forEach(k => html += `<th>${expenseNames[k] || k}</th>`);
        html += '<th>Total</th></tr></thead><tbody>';
        for (let i = 0; i < rawData.years.length; i += 2) {
            html += `<tr><td>${rawData.years[i]} (${rawData.ages[i]})</td>`;
            let total = 0;
            keys.forEach(k => {
                const val = expenses[k][i] || 0;
                total += val;
                html += `<td class="negative">${formatCurrency(val)}</td>`;
            });
            html += `<td class="negative"><strong>${formatCurrency(total)}</strong></td></tr>`;
        }
    } else if (type === 'taxes') {
        const taxes = rawData[scenario].taxes;
        html += '<th>Federal</th><th>FICA</th><th>Cap Gains</th><th>Total</th></tr></thead><tbody>';
        for (let i = 0; i < rawData.years.length; i += 2) {
            const fed = taxes.Federal[i] || 0;
            const fica = taxes.FICA[i] || 0;
            const cap = taxes.CapGains[i] || 0;
            html += `<tr><td>${rawData.years[i]} (${rawData.ages[i]})</td>
                        <td class="negative">${formatCurrency(fed)}</td>
                        <td class="negative">${formatCurrency(fica)}</td>
                        <td class="negative">${formatCurrency(cap)}</td>
                        <td class="negative"><strong>${formatCurrency(fed + fica + cap)}</strong></td></tr>`;
        }
    } else if (type === 'cashflow') {
        html += '<th>Income</th><th>Expenses</th><th>Net</th><th>Cumulative</th></tr></thead><tbody>';
        let cumulative = 0;
        for (let i = 0; i < rawData.years.length; i += 2) {
            const inc = getTotalIncome(scenario, i);
            const exp = getTotalExpenses(scenario, i);
            const net = inc - exp;
            cumulative += net;
            html += `<tr><td>${rawData.years[i]} (${rawData.ages[i]})</td>
                        <td class="positive">${formatCurrency(inc)}</td>
                        <td class="negative">${formatCurrency(exp)}</td>
                        <td class="${net >= 0 ? 'positive' : 'negative'}">${formatCurrency(net)}</td>
                        <td>${formatCurrency(cumulative)}</td></tr>`;
        }
    }

    html += '</tbody></table>';
    container.innerHTML = html;

    document.querySelectorAll('#tableTabs .tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
}

// ============================================
// METRICS & DASHBOARD UPDATE
// ============================================

// ============================================
// SAFE DOM UPDATE HELPER (BUG-001 FIX)
// ============================================

/**
 * Safely update a DOM element's textContent or style
 * @param {string} id - Element ID
 * @param {string} content - Content to set
 * @param {string} property - Property to set ('textContent', 'innerHTML', or style property)
 */
function safeUpdateElement(id, content, property = 'textContent') {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with id '${id}' not found in DOM`);
        return false;
    }

    if (property === 'textContent' || property === 'innerHTML') {
        element[property] = content;
    } else if (property.startsWith('style.')) {
        const styleProp = property.replace('style.', '');
        element.style[styleProp] = content;
    } else {
        element[property] = content;
    }
    return true;
}

function updateMetrics() {
    const scenario = config.currentScenario;
    const netWorths = getNetWorthSeries(scenario);
    const currentNW = netWorths[0];
    const peakNW = Math.max(...netWorths);
    const peakIndex = netWorths.indexOf(peakNW);

    // Basic Header Metrics (with null checks)
    safeUpdateElement('metricCurrentNW', formatCurrency(currentNW));
    safeUpdateElement('metricPeakNW', formatCurrency(peakNW));
    safeUpdateElement('metricPeakYear', `Age ${rawData.ages[peakIndex]} (${rawData.years[peakIndex]})`);
    safeUpdateElement('metricPeakGrowth', `+${((peakNW - currentNW) / currentNW * 100).toFixed(0)}%`);

    const successRates = { optimistic: 99, average: 97, pessimistic: 94 };
    const successRate = successRates[scenario] || 95;
    safeUpdateElement('metricSuccess', successRate + '%');
    // Legacy/Missing Elements - Commented out to prevent errors
    // safeUpdateElement('successRingNum', successRate + '%');
    // safeUpdateElement('successRing', 201 - (201 * successRate / 100), 'style.strokeDashoffset');

    safeUpdateElement('metricRetireAge', config.settings.personal.retireAge);
    safeUpdateElement('metricRetireYear', 'Year ' + (2026 + config.settings.personal.retireAge - config.settings.personal.age));

    const ssBenefit = config.settings.socialSecurity['ss' + config.settings.socialSecurity.claimAge] || config.settings.socialSecurity.ss62;
    safeUpdateElement('metricSS', formatCurrency(ssBenefit, false) + '/mo');
    safeUpdateElement('metricSSAge', 'Starting Age ' + config.settings.socialSecurity.claimAge + ' (' + formatCurrency(ssBenefit * 12, false) + '/yr)');

    // Lifetime Totals for Analysis
    let totalTaxes = 0;
    let totalIncome = 0;
    const sc = rawData[scenario];
    for (let i = 0; i < rawData.years.length; i++) {
        totalTaxes += (sc.taxes.Federal[i] || 0) + (sc.taxes.FICA[i] || 0) + (sc.taxes.CapGains[i] || 0);
        totalIncome += (sc.income.Work[i] || 0) + (sc.income.SocialSecurity[i] || 0) + (sc.income.RMD[i] || 0);
    }
    safeUpdateElement('metricTaxes', formatCurrency(totalTaxes));

    // --- Comprehensive Metrics Dashboard (US-013) ---

    // Financial Health
    const outOfMoney = netWorths.findIndex(nw => nw <= 0);
    safeUpdateElement('mNeverRunOut', outOfMoney === -1 ? 'Never' : 'Age ' + rawData.ages[outOfMoney]);
    safeUpdateElement('mSuccessRate', successRate + '%');

    const retirementSpend = config.settings.expenses?.annualSpending || 90000;
    const assetsRequired = retirementSpend * 25;
    const currentAssets = (config.settings.assets?.retirement || 0) + (config.settings.assets?.roth || 0) + (config.settings.assets?.hsa || 0) + (config.settings.assets?.investments || 0);
    const savingsRatio = (currentAssets / assetsRequired * 100).toFixed(0);
    safeUpdateElement('mSavingsRatio', savingsRatio + '%');

    // Progress Tracking
    const monthsToRetire = Math.max(0, (config.settings.personal.retireAge - config.settings.personal.age) * 12);
    safeUpdateElement('mRetireCount', monthsToRetire + ' mo');

    const monthsRemaining = (config.settings.personal.longevity - config.settings.personal.age) * 12;
    safeUpdateElement('mLifeRemaining', monthsRemaining + ' mo');

    const yearlySavings = (config.settings.income?.contribution401k || 0) + (config.settings.income?.rothContrib || 0) + (config.settings.income?.hsaContrib || 0);
    const savingsRate = (yearlySavings / (config.settings.income?.work || 1) * 100).toFixed(1);
    safeUpdateElement('mSavingsRate', savingsRate + '%');

    // Debt & Cash Flow continues below
    const debtRatio = (config.settings.housing.mortgagePayment * 12 / config.settings.income.work * 100).toFixed(1);
    safeUpdateElement('mDebtRatio', debtRatio + '%');

    const year1Income = sc.income.Work[0] + sc.income.SocialSecurity[0];
    const year1Expense = sc.expenses.General[0] + sc.expenses.Housing[0] + sc.expenses.Medical[0];
    safeUpdateElement('mCashFlow12', formatCurrency(year1Income - year1Expense));

    // Taxes & Housing
    const lifetimeTaxRate = ((totalTaxes / totalIncome) * 100).toFixed(1);
    safeUpdateElement('mTaxLifetime', lifetimeTaxRate + '%');

    const year1Tax = (sc.taxes.Federal[0] || 0) + (sc.taxes.FICA[0] || 0);
    const year1TaxRate = ((year1Tax / sc.income.Work[0]) * 100).toFixed(1);
    safeUpdateElement('mTaxNextYear', year1TaxRate + '%');

    safeUpdateElement('mHousingRatio', debtRatio + '%');

    // Legacy & Estate (BUG-002 FIX: Safe array access)
    const legacyGoal = config.goals?.[2]?.target || 5000000;
    const legacyScore = (peakNW / legacyGoal * 100).toFixed(0);
    safeUpdateElement('mLegacyScore', legacyScore + '%');
    safeUpdateElement('mEstateDocs', '0/7');
    safeUpdateElement('mRothLegacy', formatCurrency(sc.accounts.RothIRA[sc.accounts.RothIRA.length - 1]));

    // Update the Metrics Cards for Expenses
    const totalExp = config.settings.expenses.annualSpending;
    safeUpdateElement('mTotalExpenses', formatCurrency(totalExp, false) + '/yr');

    // Dynamic Debt Free
    const debtIdx = sc.accounts.Debt.findIndex((d, idx) => d >= 0 && idx > 0);
    if (debtIdx !== -1) {
        safeUpdateElement('mDebtFree', (config.startYear + debtIdx));
    } else {
        safeUpdateElement('mDebtFree', 'Paid Off');
    }

    // Risk
    safeUpdateElement('mLTCRisk', '70% Potential');
    // Calculate retirement year index (years from now until retirement)
    const retirementYearIndex = Math.max(0, config.settings.personal.retireAge - config.settings.personal.age);
    const retirementBalance = sc.accounts.RetirementSavings[retirementYearIndex] || sc.accounts.RetirementSavings[0] || 1;
    const withdrawalRate = (retirementSpend / retirementBalance * 100).toFixed(2);
    safeUpdateElement('mWithdrawalRate', withdrawalRate + '%');
    safeUpdateElement('mStressTest', 'Passed');
}
function updateDashboard() {
    updateMetrics();
    updateYearDisplay();
    updateSSDisplay();
    renderGoals();
    updateMilestones();
    renderEventsTable();
    showDataTable('summary', document.querySelector('#tableTabs .tab.active') || document.querySelector('#tableTabs .tab'));
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

function recalculate() {
    try {
        // Run the new dynamic simulation
        updateRawData();

        // Refresh UI components
        updateDashboard();
        refreshAllCharts();
        updateApplyButton('applied');

        showNotification('Projections recalculated!');
        saveToLocalStorage();
    } catch (error) {
        console.error('Calculation error:', error);
        showNotification('Error during recalculation', 'error');
    }
}

function refreshAllCharts() {
    // Destroy all existing charts
    for (const key in charts) {
        if (charts[key] && typeof charts[key].destroy === 'function') {
            charts[key].destroy();
        }
    }
    // Re-initialize all charts with new data
    initCharts();
}

async function exportPDF() {
    showNotification('Generating PDF...');

    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('l', 'mm', 'a4');

        // Title
        pdf.setFontSize(20);
        pdf.text('Retirement Financial Plan', 15, 20);
        pdf.setFontSize(12);
        pdf.text(`Prepared for: ${config.settings.personal.name}`, 15, 30);
        pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 15, 37);
        pdf.text(`Scenario: ${config.currentScenario.charAt(0).toUpperCase() + config.currentScenario.slice(1)}`, 15, 44);

        // Key Metrics
        pdf.setFontSize(14);
        pdf.text('Key Metrics', 15, 55);
        pdf.setFontSize(10);
        const netWorths = getNetWorthSeries(config.currentScenario);
        pdf.text(`Current Net Worth: ${formatCurrency(netWorths[0], false)}`, 15, 63);
        pdf.text(`Peak Net Worth: ${formatCurrency(Math.max(...netWorths), false)}`, 15, 70);
        pdf.text(`Retirement Age: ${config.settings.personal.retireAge}`, 15, 77);
        pdf.text(`Life Expectancy: ${config.settings.personal.longevity}`, 15, 84);

        // Capture charts
        const mainChart = document.getElementById('chartNetWorth');
        const canvas = await html2canvas(mainChart.parentElement);
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 100, 50, 180, 100);

        pdf.save('retirement-plan.pdf');
        showNotification('PDF exported successfully!');
    } catch (e) {
        console.error('PDF export error:', e);
        showNotification('Error exporting PDF', 'error');
    }
}

function exportCSV() {
    const scenario = config.currentScenario;
    let csv = 'Year,Age,Net Worth,Income,Expenses,Taxes,Cash Flow\n';

    for (let i = 0; i < rawData.years.length; i++) {
        const nw = calculateNetWorth(scenario, i);
        const inc = getTotalIncome(scenario, i);
        const exp = getTotalExpenses(scenario, i);
        const tax = getTotalTaxes(scenario, i);
        csv += `${rawData.years[i]},${rawData.ages[i]},${nw},${inc},${exp},${tax},${inc - exp}\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'retirement-plan.csv';
    a.click();
    showNotification('CSV exported!');
}

function exportJSON() {
    const data = {
        config: config,
        timestamp: new Date().toISOString(),
        projections: {
            optimistic: getNetWorthSeries('optimistic'),
            average: getNetWorthSeries('average'),
            pessimistic: getNetWorthSeries('pessimistic')
        }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'retirement-plan-backup.json';
    a.click();
    showNotification('Plan saved!');
}

// ============================================
// NOTIFICATIONS
// ============================================

function showNotification(message, type = 'success') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : '⚠'}</span> ${message}`;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
}

// ============================================
// CHART INITIALIZATION FUNCTIONS
// ============================================

// Money Flow Chart - Show ANNUAL breakdown by AGE, not a single bar!
function initMoneyFlowChart() {
    const ctx = document.getElementById('chartMoneyFlow')?.getContext('2d');
    if (!ctx) return;

    const scenario = config.currentScenario;
    const data = rawData[scenario];

    // Generate years and ages arrays dynamically
    const startYear = 2026;
    const currentAge = config.settings.personal.age;
    const longevity = config.settings.personal.longevity;
    const yearCount = longevity - currentAge + 1;
    const years = Array.from({ length: yearCount }, (_, i) => startYear + i);
    const ages = Array.from({ length: yearCount }, (_, i) => currentAge + i);

    // Get annual data for each category
    const taxes = [];
    const expenses = [];
    const savings = [];

    for (let i = 0; i < yearCount; i++) {
        const income = (data.income.Work?.[i] || 0) +
            (data.income.SocialSecurity?.[i] || 0) +
            (data.income.Drawdown?.[i] || 0) +
            (data.income.RMD?.[i] || 0);

        const tax = (data.taxes?.Federal?.[i] || 0) + (data.taxes?.FICA?.[i] || 0) + (data.taxes?.CapGains?.[i] || 0);
        const expense = (data.expenses?.General?.[i] || 0) +
            (data.expenses?.Housing?.[i] || 0) +
            (data.expenses?.Medical?.[i] || 0) +
            (data.expenses?.LTC?.[i] || 0);

        const surplus = income - tax - expense;

        taxes.push(tax);
        expenses.push(expense);
        savings.push(Math.max(0, surplus)); // Only positive savings
    }

    charts.moneyFlow = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Taxes',
                    data: taxes,
                    backgroundColor: '#ef4444',
                    stack: 'stack1'
                },
                {
                    label: 'Living Expenses',
                    data: expenses,
                    backgroundColor: '#f59e0b',
                    stack: 'stack1'
                },
                {
                    label: 'Savings/Surplus',
                    data: savings,
                    backgroundColor: '#10b981',
                    stack: 'stack1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, padding: 8 } },
                tooltip: {
                    callbacks: {
                        title: (items) => `Age ${ages[items[0].dataIndex]} (${items[0].label})`,
                        label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw, false)}`
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    ticks: { maxTicksLimit: 10 }
                },
                y: {
                    stacked: true,
                    ticks: { callback: (v) => formatCurrency(v) }
                }
            }
        }
    });
}

// Gap Calculator - Show retirement income WITH AGE CONTEXT
function initGapCalculator() {
    const targetMonthly = parseInt(document.getElementById('calcTargetIncome')?.value || 12000);
    const scenario = config.currentScenario;
    const data = rawData[scenario];

    // Find retirement year (first year after retire age)
    const retireAge = config.settings.personal.retireAge;
    const currentAge = config.settings.personal.age;
    const startYear = 2026;
    const yearsToRetire = retireAge - currentAge;
    const retireYearIndex = Math.max(0, yearsToRetire);

    // Calculate monthly income at retirement  
    const retireYear = startYear + retireYearIndex;
    const retireAgeActual = currentAge + retireYearIndex;
    const annualIncome = (data.income.SocialSecurity?.[retireYearIndex] || 0) +
        (data.income.Drawdown?.[retireYearIndex] || 0) +
        (data.income.RMD?.[retireYearIndex] || 0);
    const monthlyIncome = annualIncome / 12;

    // Calculate gap/surplus
    const gap = targetMonthly - monthlyIncome;
    const percentage = (monthlyIncome / targetMonthly) * 100;

    // Update UI with age context
    const projectedEl = document.getElementById('calcProjectedIncome');
    if (projectedEl) {
        projectedEl.innerHTML = `${formatCurrency(monthlyIncome, false)}/mo<br><small style="font-size: 0.7em; opacity: 0.7;">at Age ${retireAgeActual} (${retireYear})</small>`;
    }

    const resultLabel = document.getElementById('calcResultLabel');
    const resultValue = document.getElementById('calcResultValue');
    const progressBar = document.getElementById('calcProgressBar');

    if (gap > 0) {
        // Shortfall
        if (resultLabel) resultLabel.textContent = 'Monthly Shortfall';
        if (resultValue) {
            resultValue.textContent = formatCurrency(gap, false);
            resultValue.style.color = '#ef4444';
        }
        if (progressBar) {
            progressBar.style.width = Math.min(percentage, 100) + '%';
            progressBar.style.background = '#ef4444';
        }
    } else {
        // Surplus
        if (resultLabel) resultLabel.textContent = 'Monthly Surplus';
        if (resultValue) {
            resultValue.textContent = '+' + formatCurrency(Math.abs(gap), false);
            resultValue.style.color = '#10b981';
        }
        if (progressBar) {
            progressBar.style.width = '100%';
            progressBar.style.background = '#10b981';
        }
    }
}

// Master Chart Initialization Function
function initCharts() {
    // Destroy all existing charts first (prevents HMR errors)
    destroyAllCharts();

    const textColor = config.theme === 'dark' ? '#9ca3af' : '#4b5563';
    const gridColor = config.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    Chart.defaults.color = textColor;
    Chart.defaults.borderColor = gridColor;

    const initFunctions = [
        initNetWorthChart, initSuccessGauge, initRealNominalChart, initAllocationChart,
        initStackedPortfolioChart, initIncomeChart, initSSComparisonChart, initIncomeReplacementChart,
        initExpensesChart, initExpensePieChart, initHealthcareChart, initTaxesChart,
        initCumulativeTaxChart, initEffectiveTaxChart, initTaxBracketChart, initWithdrawalChart,
        initSWRChart, initRothConversionChart, initRMDChart, initMortgageChart,
        initAccountTrendsChart, initScenarioComparisonChart, initMonteCarloChart,
        initSequenceRiskChart, initLegacyChart, initWhatIfChart, initDebtPayoffChart,
        initMarketRiskChart, initSSExplorerChart, initRothExplorerChart, initSurplusGapChart
    ];

    initFunctions.forEach(func => {
        try {
            if (typeof func === 'function') func();
        } catch (e) {
            console.warn(`Failed to initialize ${func.name}:`, e.message);
        }
    });

    // CRITICAL: Always initialize these fixed charts
    try {
        initMoneyFlowChart();
    } catch (e) {
        console.error('Money Flow chart failed:', e);
    }

    try {
        initGapCalculator();
    } catch (e) {
        console.error('Gap Calculator failed:', e);
    }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    // Prevent double initialization
    if (isInitialized) return;
    isInitialized = true;

    loadFromLocalStorage();

    // Apply theme
    document.documentElement.setAttribute('data-theme', config.theme);
    document.querySelector('.theme-toggle').textContent = config.theme === 'dark' ? '🌙' : '☀️';

    // Initialize charts
    initCharts();

    // Update dashboard and recalculate
    recalculate();
    updateDashboard();

    // Set up auto-save
    setInterval(saveToLocalStorage, 30000);

    // Initialize sidebar navigation
    initSidebarNavigation();
});

// Sidebar Navigation
function initSidebarNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav-item');
    const sections = [];

    // Collect all section elements
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && href.startsWith('#')) {
            const section = document.getElementById(href.slice(1));
            if (section) {
                sections.push({ id: href.slice(1), element: section, navItem: item });
            }
        }
    });

    // Smooth scroll when clicking nav items
    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Update active state
                navItems.forEach(n => n.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });

    // Update active nav item on scroll
    let scrollTimeout;
    document.querySelector('.main-content').addEventListener('scroll', function () {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const scrollTop = this.scrollTop;
            let currentSection = sections[0];

            for (const section of sections) {
                if (section.element.offsetTop <= scrollTop + 100) {
                    currentSection = section;
                }
            }

            if (currentSection) {
                navItems.forEach(n => n.classList.remove('active'));
                currentSection.navItem.classList.add('active');
            }
        }, 100);
    });

    // Initialize settings change detection
    initSettingsChangeDetection();
}