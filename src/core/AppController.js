import Chart from 'chart.js/auto';
import { config } from '../data/Config.js';
import { rawData, updateRawData } from '../data/Store.js';
import { Logger } from '../utils/Logger.js';
import { ErrorBoundary } from '../utils/ErrorBoundary.js';
import { SecureStorage } from '../utils/SecureStorage.js';
import { deepMerge } from '../utils/DeepMerge.js';
import { formatCurrency } from '../utils/Formatters.js';

// Handlers
import { MetricsHandler } from '../ui/MetricsHandler.js';
import { NavigationHandler } from '../ui/NavigationHandler.js';
import { ModalHandler } from '../ui/ModalHandler.js';
import { EventsHandler } from '../ui/EventsHandler.js';
import { DashboardDetails } from '../ui/DashboardDetails.js';
import { ExplorerHandler } from '../ui/ExplorerHandler.js';
import { CryptoHandler } from '../ui/CryptoHandler.js';
import { RothUI } from '../roth/RothUI.js';
import { RothDeepDive } from '../roth/RothDeepDive.js';
import { GapCalculator } from '../ui/GapCalculator.js';
import { CashFlowExplorer } from '../explorers/CashFlowExplorer.js';
import { initializeDescriptionsAndTooltips } from '../utils/comprehensiveDescriptions.js';

// Charts
import { charts, destroyAllCharts } from '../state/ChartStore.js';
import * as SummaryCharts from '../charts/SummaryCharts.js';
import * as IncomeExpenseCharts from '../charts/IncomeExpenseCharts.js';
import * as TaxCharts from '../charts/TaxCharts.js';
import * as AnalysisCharts from '../charts/AnalysisCharts.js';
import * as AccountCharts from '../charts/AccountCharts.js';
import * as ExplorerCharts from '../charts/ExplorerCharts.js';
import { SimulationEngine } from '../engine/SimulationEngine.js';

/**
 * Main Application Orchestrator
 */
export const AppController = {
    isSaving: false, // Mutex for auto-save

    async init() {
        try {
            // Initialize error boundary FIRST to catch any initialization errors
            ErrorBoundary.init();

            Logger.debug('🚀 RetireFire Initializing... [AppController]');
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
            CashFlowExplorer.init();
            CryptoHandler.syncPrices();
            this.renderDashboard();
            this.initAllCharts();

            // Initialize descriptions and explorers
            setTimeout(() => {
                Logger.debug('⏰ Init timeout executing');
                initializeDescriptionsAndTooltips(charts);

                // Refresh Roth metrics after everything is loaded
                if (RothUI && RothUI.refreshMetrics) {
                    try {
                        Logger.debug('🔄 Calling RothUI.refreshMetrics()...');
                        RothUI.refreshMetrics();
                    } catch (error) {
                        Logger.error('❌ refreshMetrics() error:', error);
                    }
                }
            }, 1000);

            // Auto-save every 30 seconds with race condition protection
            setInterval(async () => {
                if (this.isSaving) {
                    Logger.warn('⏭️ Skipping auto-save: previous save still in progress');
                    return;
                }
                this.isSaving = true;
                try {
                    await this.saveSettings();
                } catch (error) {
                    Logger.error('Auto-save failed:', error);
                } finally {
                    this.isSaving = false;
                }
            }, 30000);

            Logger.debug('✅ RetireFire Ready');
        } catch (error) {
            Logger.error('❌ Fatal error during App initialization:', error);
            // Show user-friendly error message
            const appElement = document.getElementById('app');
            if (appElement) {
                appElement.innerHTML = `
                    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: var(--bg-color);">
                        <div style="text-align: center; padding: 2rem; max-width: 500px;">
                            <h1 style="color: #ef4444; margin-bottom: 1rem;">⚠️ Initialization Error</h1>
                            <p style="color: var(--text-color); margin-bottom: 1rem;">
                                The application failed to initialize. Please refresh the page and try again.
                            </p>
                            <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                Refresh Page
                            </button>
                        </div>
                    </div>
                `;
            }
        }
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
        ExplorerHandler.initYearSlider();

        // Refresh Roth metrics after dashboard renders
        if (RothUI && RothUI.refreshMetrics) {
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
                try { if (typeof fn === 'function') fn(); } catch (e) { Logger.warn('Chart init failed:', e.message); }
            });
        });
    },

    loadSettings() {
        try {
            SecureStorage.migrateFromPlaintext();
            const savedConfig = SecureStorage.load();
            if (savedConfig) {
                deepMerge(config, savedConfig);
                Logger.debug('✅ Settings loaded from encrypted storage');
            } else {
                Logger.debug('No saved settings found - using defaults');
            }
        } catch (e) {
            Logger.error('❌ Could not load from SecureStorage:', e);
        }
    },

    saveSettings() {
        try {
            SecureStorage.save(config);
            Logger.debug('✅ Settings saved to encrypted storage');
        } catch (e) {
            Logger.error('❌ Could not save to SecureStorage:', e);
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
        this.initAllCharts();
    },

    runMonteCarloSimulation() {
        const volatility = parseFloat(document.getElementById('mcVolatility')?.value || 0.15);
        const spendMult = parseFloat(document.getElementById('mcSpendScenario')?.value || 1.0);
        const iters = parseInt(document.getElementById('mcIterations')?.value || 1000);
        const scenario = document.getElementById('mcScenario')?.value || 'monte-carlo';

        Logger.debug(`🎲 Starting Monte Carlo: ${iters} iterations, ${volatility} volatility...`);
        if (window.showNotification) window.showNotification('Running Monte Carlo...', 'info');

        setTimeout(() => {
            Logger.time('MonteCarlo');
            let results;
            try {
                results = SimulationEngine.runMonteCarlo(iters, volatility, spendMult, scenario);
            } catch (e) {
                Logger.error('❌ Monte Carlo Simulation Failed:', e);
                if (window.showNotification) window.showNotification('Simulation failed: ' + e.message, 'error');
                return;
            }
            Logger.timeEnd('MonteCarlo');

            rawData.monteCarlo = results;
            window.lastMonteCarloResults = {
                successRate: results.successRate,
                legacyRate: results.legacyRate,
                scenario: scenario,
                iterations: iters
            };

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

            if (window.showNotification) window.showNotification('Monte Carlo analysis complete!');
        }, 10);
    }
};

// Orchestration Helper
export function recalculate() {
    updateRawData();
    AppController.renderDashboard();
    AppController.initAllCharts();
    setTimeout(() => {
        if (RothUI && RothUI.refreshMetrics) {
            RothUI.refreshMetrics();
        }
    }, 300);
    if (window.showNotification) window.showNotification('Projections recalculated!');
}
