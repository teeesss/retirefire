import './style.css';
import './dashboard-layout.css';
import Chart from 'chart.js/auto';

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
import { initializeDescriptionsAndTooltips } from './utils/comprehensiveDescriptions.js';
import { initializeExplorerSections } from './utils/explorerSections.js';

// Charts
import { charts, destroyAllCharts } from './state/ChartStore.js';
import * as SummaryCharts from './charts/SummaryCharts.js';
import * as IncomeExpenseCharts from './charts/IncomeExpenseCharts.js';
import * as TaxCharts from './charts/TaxCharts.js';
import * as AnalysisCharts from './charts/AnalysisCharts.js';
import * as AccountCharts from './charts/AccountCharts.js';
import * as ExplorerCharts from './charts/ExplorerCharts.js';

// Utilities
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
        CryptoHandler.syncPrices();
        this.renderDashboard();
        this.initAllCharts();

        // Initialize descriptions and explorers
        setTimeout(() => {
            initializeDescriptionsAndTooltips(charts);
            initializeExplorerSections();
        }, 1000);

        // Auto-save every 30 seconds
        setInterval(() => this.saveSettings(), 30000);

        console.log('✅ RetireFire Ready');
    },

    renderDashboard() {
        MetricsHandler.updateMetrics();
        DashboardDetails.renderGoals();
        DashboardDetails.updateMilestones();
        EventsHandler.renderTable();
        DashboardDetails.showDataTable('summary');
        this.updateYearDisplay();
        this.updateSSDisplay();
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
                // Deep merge to preserve structure
                Object.keys(parsed).forEach(key => {
                    if (typeof parsed[key] === 'object' && parsed[key] !== null && !Array.isArray(parsed[key])) {
                        config[key] = { ...config[key], ...parsed[key] };
                    } else {
                        config[key] = parsed[key];
                    }
                });
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
    }
};

/**
 * Core recalculation function
 */
function recalculate() {
    updateRawData();
    App.renderDashboard();
    App.initAllCharts();
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
window.setSSClaimAge = (age, btn) => ExplorerHandler.setSSClaimAge?.(age, btn);
window.updateSSExplorer = () => ExplorerHandler.updateSSExplorer();
window.updateDebtCalculations = () => ExplorerHandler.updateDebtCalculations?.();

window.openSettings = (section) => SettingsHandler.populateUI();
window.applySettings = () => SettingsHandler.apply();
window.closeSettings = () => SettingsHandler.close();
window.resetToDefaults = () => SettingsHandler.reset();
window.importSettings = () => SettingsHandler.importSettings();
window.exportSettings = () => SettingsHandler.exportSettings();
window.toggleTheme = () => App.toggleTheme();

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