import './style.css';
import './dashboard-layout.css';
import Chart from 'chart.js/auto';
window.Chart = Chart;

// Configuration and Data
import { config } from './data/Config.js';
import { rawData, updateRawData } from './data/Store.js';

// Handlers
import { MetricsHandler } from './ui/MetricsHandler.js';
import { NavigationHandler } from './ui/NavigationHandler.js';
import { ExportHandler } from './ui/ExportHandler.js';
import { ModalHandler } from './ui/ModalHandler.js';
import { SettingsHandler } from './ui/SettingsHandler.js';
import { EventsHandler } from './ui/EventsHandler.js';
import { DashboardDetails } from './ui/DashboardDetails.js';
import { ExplorerHandler } from './ui/ExplorerHandler.js';
import { CryptoHandler } from './ui/CryptoHandler.js';
import { RothUI } from './roth/RothUI.js';
import RothConfig from './roth/RothConfig.js';
import { RothDeepDive } from './roth/RothDeepDive.js';
import { initializeDescriptionsAndTooltips } from './utils/comprehensiveDescriptions.js';
import { initializeExplorerSections } from './utils/explorerSections.js';
import { GapCalculator } from './ui/GapCalculator.js';

// Charts
import { charts, destroyAllCharts } from './state/ChartStore.js';
import * as SummaryCharts from './charts/SummaryCharts.js';
import * as IncomeExpenseCharts from './charts/IncomeExpenseCharts.js';
import * as TaxCharts from './charts/TaxCharts.js';
import * as AnalysisCharts from './charts/AnalysisCharts.js';
import * as AccountCharts from './charts/AccountCharts.js';
import * as ExplorerCharts from './charts/ExplorerCharts.js';
import { SimulationEngine } from './engine/SimulationEngine.js';

// Utilities
import { deepMerge } from './utils/DeepMerge.js';
import { calculateNetWorth, getNetWorthSeries, getTotalIncome, getTotalExpenses, getTotalTaxes } from './state/DataUtils.js';
import { formatCurrency } from './utils/Formatters.js';

/**
 * Main Application Orchestrator
 */
const App = {
    async init() {
        console.log('🚀 RetireFire Initializing...');
        this.loadSettings();
        updateRawData();

        // Apply theme
        document.documentElement.setAttribute('data-theme', config.theme);
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) themeToggle.textContent = config.theme === 'dark' ? '🌙' : '☀️';

        // Initialize UI components
        NavigationHandler.init();
        RothUI.init();
        RothDeepDive.init();
        GapCalculator.init();
        CryptoHandler.syncPrices();
        this.renderDashboard();
        this.initAllCharts();

        // Initialize descriptions and explorers
        setTimeout(() => {
            console.log('⏰ Init timeout executing');
            console.log('  - RothUI defined:', typeof RothUI);
            console.log('  - refreshMetrics defined:', typeof RothUI?.refreshMetrics);

            initializeDescriptionsAndTooltips(charts);
            // initializeExplorerSections(); // Disabled to prevent partial duplication (using explicit HTML partials now)

            // Refresh Roth metrics after everything is loaded
            if (RothUI && RothUI.refreshMetrics) {
                try {
                    console.log('🔄 Calling RothUI.refreshMetrics()...');
                    RothUI.refreshMetrics();
                } catch (error) {
                    console.error('❌ refreshMetrics() error:', error);
                }
            } else {
                console.error('❌ RothUI.refreshMetrics not available');
                console.error('  - RothUI:', RothUI);
                console.error('  - RothUI.refreshMetrics:', RothUI?.refreshMetrics);
            }
        }, 1000);

        // Auto-save every 30 seconds
        setInterval(() => this.saveSettings(), 30000);

        console.log('✅ RetireFire Ready');
    },

    renderDashboard() {
        MetricsHandler.updateMetrics();
        GapCalculator.update();
        DashboardDetails.renderGoals();
        DashboardDetails.updateMilestones();
        EventsHandler.renderTable();
        DashboardDetails.showDataTable('summary');
        this.updateYearDisplay();
        this.updateSSDisplay();

        // Refresh Roth metrics after dashboard renders
        if (RothUI && RothUI.refreshMetrics) {
            console.log('🔄 Refreshing Roth metrics from renderDashboard()');
            setTimeout(() => RothUI.refreshMetrics(), 100);
        }
    },

    initAllCharts() {
        destroyAllCharts();
        const textColor = config.theme === 'dark' ? '#9ca3af' : '#4b5563';
        const gridColor = config.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
        Chart.defaults.color = textColor;
        Chart.defaults.borderColor = gridColor;

        const modules = [SummaryCharts, IncomeExpenseCharts, TaxCharts, AnalysisCharts, AccountCharts, ExplorerCharts];
        modules.forEach(mod => {
            Object.values(mod).forEach(fn => {
                try { if (typeof fn === 'function') fn(); } catch (e) { console.warn('Chart init failed:', e.message); }
            });
        });
    },

    loadSettings() {
        try {
            const savedConfig = localStorage.getItem('retirementPlannerConfig');
            if (savedConfig) {
                const parsed = JSON.parse(savedConfig);
                // Recursive deep merge to preserve nested settings (US-033/034)
                deepMerge(config, parsed);
            }
        } catch (e) {
            console.warn('Could not load from localStorage:', e);
        }
    },

    saveSettings() {
        try {
            localStorage.setItem('retirementPlannerConfig', JSON.stringify(config));
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
        }
    },

    updateYearDisplay() {
        const yearIdx = config.currentYear || 0;
        const el = document.getElementById('currentYearDisplay');
        if (el && rawData.years) {
            el.textContent = `${rawData.years[yearIdx]} (Age ${rawData.ages[yearIdx]})`;
        }
    },

    updateSSDisplay() {
        const ss = config.settings.socialSecurity;
        const safeUpdate = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        safeUpdate('ss62Monthly', formatCurrency(ss.ss62, false) + '/mo');
        safeUpdate('ss67Monthly', formatCurrency(ss.ss67, false) + '/mo');
        safeUpdate('ss70Monthly', formatCurrency(ss.ss70, false) + '/mo');
        safeUpdate('ss62Yearly', formatCurrency(ss.ss62 * 12, false) + '/yr');
        safeUpdate('ss67Yearly', formatCurrency(ss.ss67 * 12, false) + '/yr');
        safeUpdate('ss70Yearly', formatCurrency(ss.ss70 * 12, false) + '/yr');
    },

    toggleTheme() {
        config.theme = config.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', config.theme);
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) themeToggle.textContent = config.theme === 'dark' ? '🌙' : '☀️';
        this.saveSettings();
        this.initAllCharts(); // Refresh chart colors
    },

    runMonteCarloSimulation() {
        const volatility = parseFloat(document.getElementById('mcVolatility')?.value || 0.15);
        const spendMult = parseFloat(document.getElementById('mcSpendScenario')?.value || 1.0);
        const iters = parseInt(document.getElementById('mcIterations')?.value || 1000);
        const scenario = document.getElementById('mcScenario')?.value || 'monte-carlo';

        console.log(`🎲 Starting Monte Carlo: ${iters} iterations, ${volatility} volatility, scenario: ${scenario}...`);
        showNotification('Running Monte Carlo...', 'info');

        // Allow UI to update before heavy calculation
        setTimeout(() => {
            console.time('MonteCarlo');
            let results;
            try {
                results = SimulationEngine.runMonteCarlo(iters, volatility, spendMult, scenario);
            } catch (e) {
                console.error('❌ Monte Carlo Simulation Failed:', e);
                showNotification('Simulation failed: ' + e.message, 'error');
                return;
            }
            console.timeEnd('MonteCarlo');
            console.log('📊 MC Results:', results);
            rawData.monteCarlo = results; // Store for other components

            if (charts.monteCarlo) {
                charts.monteCarlo.data.datasets[0].data = results.p90;
                charts.monteCarlo.data.datasets[1].data = results.p75;
                charts.monteCarlo.data.datasets[2].data = results.p50;
                charts.monteCarlo.data.datasets[3].data = results.p25;
                charts.monteCarlo.data.datasets[4].data = results.p10;
                charts.monteCarlo.update();
            }

            if (charts.successGauge) {
                const rate = results.successRate;
                charts.successGauge.data.datasets[0].data = [rate, 100 - rate];
                charts.successGauge.data.datasets[0].backgroundColor = [
                    rate > 80 ? '#10b981' : rate > 60 ? '#f59e0b' : '#ef4444',
                    config.theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e5e7eb'
                ];
                charts.successGauge.update();
            }

            const safeUpdate = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
            safeUpdate('mcSuccessRate', results.successRate.toFixed(1) + '%');
            safeUpdate('mcLegacyRate', results.legacyRate.toFixed(1) + '%');
            safeUpdate('mc90', formatCurrency(results.p90[results.p90.length - 1]));
            safeUpdate('mc75', formatCurrency(results.p75[results.p75.length - 1]));
            safeUpdate('mc50', formatCurrency(results.p50[results.p50.length - 1]));
            safeUpdate('mc25', formatCurrency(results.p25[results.p25.length - 1]));
            safeUpdate('mc10', formatCurrency(results.p10[results.p10.length - 1]));

            showNotification('Monte Carlo analysis complete!');
        }, 10);
    }
};

/**
 * Core recalculation function
 */
function recalculate() {
    updateRawData();
    App.renderDashboard();
    App.initAllCharts();

    // Refresh Roth metrics after recalculation
    setTimeout(() => {
        if (RothUI && RothUI.refreshMetrics) {
            RothUI.refreshMetrics();
        }
    }, 300);

    showNotification('Projections recalculated!');
}

/**
 * Global API for HTML Handlers
 */
window.updateRawData = updateRawData;
window.updateDashboard = () => App.renderDashboard();
window.refreshAllCharts = () => App.initAllCharts();
window.recalculate = recalculate;

// Global Handlers (Forward to modular handlers)
window.updateSpendingSlider = (val) => ExplorerHandler.updateSpending(val);
window.setScenario = (sc) => { config.currentScenario = sc; window.recalculate(); };
window.runMarketRisk = (sc, btn) => ExplorerHandler.runMarketRisk(sc, btn);
window.runWhatIf = (sc, btn) => ExplorerHandler.runWhatIf(sc, btn);
window.runStressTest = () => ExplorerHandler.runStressTest();
window.runMonteCarloSimulation = () => App.runMonteCarloSimulation();
window.setSSClaimAge = (age, btn) => ExplorerHandler.setSSClaimAge?.(age, btn);
window.updateSSExplorer = () => ExplorerHandler.updateSSExplorer();
window.updateSSComparisonChart = () => IncomeExpenseCharts.updateSSComparisonChart?.();
window.updateDebtCalculations = () => ExplorerHandler.updateDebtCalculations?.();

// Roth chart updates
window.updateRothExplorerChart = () => ExplorerCharts.updateRothExplorerChart?.();
window.updateRothTaxImpactChart = () => ExplorerCharts.updateRothTaxImpactChart?.();

// Debug function for Roth state
window.debugRothState = () => {
    console.log('🔍 Roth Debug State:');
    console.log('  Config:');
    console.log('    - Enabled:', config.settings.taxes.rothConversionEnabled);
    console.log('    - Mode:', RothConfig?.mode);
    console.log('    - Start:', config.settings.taxes.rothConvStart);
    console.log('    - End:', config.settings.taxes.rothConvEnd);
    console.log('  Data:');
    console.log('    - rawData exists:', !!rawData);
    console.log('    - baseline exists:', !!rawData.baseline);
    console.log('    - rothConversions:', rawData.average?.rothConversions);
    console.log('  UI:');
    console.log('    - RothUI:', typeof RothUI);
    console.log('    - refreshMetrics:', typeof RothUI?.refreshMetrics);
    console.log('  Metrics:');
    const converted = document.getElementById('rothTotalConverted')?.textContent;
    const taxPaid = document.getElementById('rothTaxSavings')?.textContent;
    const nwBoost = document.getElementById('rothLegacyBoost')?.textContent;
    console.log('    - Converted:', converted);
    console.log('    - Tax Paid:', taxPaid);
    console.log('    - NW Boost:', nwBoost);
};
console.log('✅ Debug function available: window.debugRothState()');


window.openSettings = (section) => SettingsHandler.populateUI();
window.applySettings = () => SettingsHandler.apply();
window.closeSettings = () => SettingsHandler.close();
window.resetToDefaults = () => SettingsHandler.reset();
window.importSettings = () => SettingsHandler.importSettings();
window.exportSettings = () => SettingsHandler.exportSettings();
window.toggleTheme = () => App.toggleTheme();

// Chart Type Switching
window.setChartType = (section, type, button) => {
    // Update active tab styling
    if (button) {
        const tabs = button.parentElement.querySelectorAll('.tab');
        tabs.forEach(tab => tab.classList.remove('active'));
        button.classList.add('active');
    }

    // Destroy and recreate the appropriate chart
    if (section === 'taxes') {
        if (charts.taxes) charts.taxes.destroy();
        if (charts.effectiveTax) charts.effectiveTax.destroy();
        if (charts.taxBracket) charts.taxBracket.destroy();

        if (type === 'total') {
            TaxCharts.initTaxesChart();
        } else if (type === 'effective') {
            TaxCharts.initEffectiveTaxChart();
        } else if (type === 'bracket') {
            TaxCharts.initTaxBracketChart();
        }
    }
};

window.exportPDF = () => ExportHandler.exportPDF();
window.exportCSV = () => ExportHandler.exportCSV();
window.exportJSON = () => ExportHandler.exportJSON();

window.openYearModal = (idx) => ModalHandler.openYearModal(idx);
window.closeYearModal = () => ModalHandler.closeYearModal();
window.scrollToSection = (id) => NavigationHandler.scrollToSection(id);

window.showDataTable = (type, el) => DashboardDetails.showDataTable(type, el);

window.addEvent = () => EventsHandler.addEvent();
window.removeEvent = (btn) => EventsHandler.removeEvent(btn);
window.addRecurringEvent = () => EventsHandler.addRecurringEvent();
window.removeRecurringEvent = (idx) => EventsHandler.removeRecurringEvent(idx);

window.updateCryptoPrices = () => CryptoHandler.syncPrices();

// Notification helper
function showNotification(message, type = 'success') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✗' : '⚠'}</span> ${message}`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}
window.showNotification = showNotification;

// Initialize on load
document.addEventListener('DOMContentLoaded', () => App.init());

// Vite HMR cleanup
if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        console.log('Vite HMR: Cleaning up charts...');
        destroyAllCharts();
    });
}

/**
 * Export core functions for chart modules
 */
export {
    calculateNetWorth,
    getNetWorthSeries,
    getTotalIncome,
    getTotalExpenses,
    getTotalTaxes,
    recalculate
};