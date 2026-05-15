// GlobalBridge.js
import { AppController, recalculate } from './AppController.js';
import { updateRawData, rawData } from '../data/Store.js';
import { config } from '../data/Config.js';
import { Logger } from '../utils/Logger.js';
import { charts } from '../state/ChartStore.js';
// import { formatCurrency } from '../utils/Formatters.js'; // Unused in this bridge

// Features
import { SettingsHandler } from '../ui/SettingsHandler.js';
import { NavigationHandler } from '../ui/NavigationHandler.js';
import { ExplorerHandler } from '../ui/ExplorerHandler.js';
import * as IncomeExpenseCharts from '../charts/IncomeExpenseCharts.js';
import * as ExplorerCharts from '../charts/ExplorerCharts.js';
import * as TaxCharts from '../charts/TaxCharts.js';
import { ExportHandler } from '../ui/ExportHandler.js';
import { ModalHandler } from '../ui/ModalHandler.js';
import { DashboardDetails } from '../ui/DashboardDetails.js';
import { EventsHandler } from '../ui/EventsHandler.js';
import { GoalsHandler } from '../ui/GoalsHandler.js';
import { CryptoHandler } from '../ui/CryptoHandler.js';
import RothConfig from '../roth/RothConfig.js';
import { RothUI } from '../roth/RothUI.js';
import Chart from 'chart.js/auto';

export const GlobalBridge = {
    init() {
        Logger.debug('🌉 Initializing Global Bridge...');

        // Expose App Controller Methods
        window.recalculate = recalculate;
        window.updateRawData = updateRawData;
        window.updateDashboard = () => AppController.renderDashboard();
        window.refreshAllCharts = () => AppController.initAllCharts();
        window.toggleTheme = () => AppController.toggleTheme();
        window.runMonteCarloSimulation = () => AppController.runMonteCarloSimulation();

        // Settings
        window.openSettings = (section) => SettingsHandler.populateUI(section);
        window.showSettingsSection = (section, el) => SettingsHandler.showSettingsSection(section, el);
        window.applySettings = () => SettingsHandler.apply();
        window.closeSettings = () => SettingsHandler.close();
        window.resetToDefaults = () => SettingsHandler.reset();
        window.importSettings = () => SettingsHandler.importSettings();
        window.exportSettings = () => SettingsHandler.exportSettings();
        window.updateTotalExpenses = () => SettingsHandler.updateTotalExpenses();
        window.createCustomScenario = () => SettingsHandler.createCustomScenario();
        window.cloneScenario = () => SettingsHandler.cloneScenario();

        // Analysis & Explorer
        window.updateYearSlider = (val) => ExplorerHandler.updateYear(val);
        window.updateSpendingSlider = (val) => ExplorerHandler.updateSpending(val);
        window.setScenario = (sc, btn) => {
            config.currentScenario = sc;
            if (btn) {
                document.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
            window.recalculate();
        };
        window.runMarketRisk = (sc, btn) => ExplorerHandler.runMarketRisk(sc, btn);
        window.runWhatIf = (sc, btn) => ExplorerHandler.runWhatIf(sc, btn);
        window.runStressTest = () => ExplorerHandler.runStressTest();
        window.runSequenceRisk = (sc, btn) => ExplorerHandler.runSequenceRisk(sc, btn);
        window.setSSClaimAge = (age, btn) => ExplorerHandler.setSSClaimAge?.(age, btn);
        window.updateSSExplorer = () => ExplorerHandler.updateSSExplorer();
        window.updateSSComparisonChart = () => IncomeExpenseCharts?.updateSSComparisonChart?.();
        window.updateDebtCalculations = () => ExplorerHandler.updateDebtCalculations?.();

        // Roth Specific
        window.updateRothExplorerChart = () => ExplorerCharts.updateRothExplorerChart?.();
        window.updateRothTaxImpactChart = () => ExplorerCharts.updateRothTaxImpactChart?.();
        window.debugRothState = () => {
            Logger.debug('🔍 Roth Debug State:', {
                config: config.settings.taxes,
                mode: RothConfig?.mode,
                rawData: !!rawData,
                rothConversions: rawData.average?.rothConversions,
                hasRothUI: typeof RothUI !== 'undefined'
            });
        };

        // Charts
        window.setChartType = (section, type, button) => {
            if (button) {
                const tabs = button.parentElement.querySelectorAll('.tab');
                tabs.forEach(tab => tab.classList.remove('active'));
                button.classList.add('active');
            }
            if (section === 'taxes') {
                if (charts.taxes) charts.taxes.destroy();
                if (charts.effectiveTax) charts.effectiveTax.destroy();
                if (charts.taxBracket) charts.taxBracket.destroy();

                if (type === 'total') TaxCharts.initTaxesChart();
                else if (type === 'effective') TaxCharts.initEffectiveTaxChart();
                else if (type === 'bracket') TaxCharts.initTaxBracketChart();
            }
        };

        // Modals & Exports
        window.exportPDF = () => ExportHandler.exportPDF();
        window.exportCSV = () => ExportHandler.exportCSV();
        window.exportJSON = () => ExportHandler.exportJSON();
        window.openYearModal = (idx) => ModalHandler.openYearModal(idx);
        window.closeYearModal = () => ModalHandler.closeYearModal();
        window.openModal = (id) => ModalHandler.openModal(id);
        window.closeModal = (id) => ModalHandler.closeModal(id);

        // Navigation
        window.scrollToSection = (id) => NavigationHandler.scrollToSection(id);
        window.navigateToSettings = (id) => NavigationHandler.navigateToSettings(id);
        window.toggleSidebar = () => {
            const sidebar = document.querySelector('.main-sidebar');
            const overlay = document.querySelector('.sidebar-overlay');
            if (sidebar && overlay) {
                sidebar.classList.toggle('open');
                overlay.classList.toggle('active');
            }
        };

        // Data Tables
        window.showDataTable = (type, el) => DashboardDetails.showDataTable(type, el);
        window.openDataTableModal = () => {
            const modal = document.getElementById('dataTableModal');
            if (modal) {
                modal.style.display = 'flex';
                window.showDataTableModal('summary', modal.querySelector('.tab.active'));
            }
        };
        window.closeDataTableModal = () => {
            const modal = document.getElementById('dataTableModal');
            if (modal) modal.style.display = 'none';
        };
        window.showDataTableModal = (type, btn) => {
            if (btn) {
                btn.closest('.tab-container')?.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
            }
            const container = document.getElementById('dataTableModalContainer');
            if (container && DashboardDetails.generateDataTableHTML) {
                container.innerHTML = DashboardDetails.generateDataTableHTML(type);
            } else if (container) {
                DashboardDetails.showDataTable(type, btn);
                const source = document.getElementById('dataTableContainer');
                if (source) container.innerHTML = source.innerHTML;
            }
        };

        // Events & Goals
        window.addEvent = () => EventsHandler.addEvent();
        window.removeEvent = (btn) => EventsHandler.removeEvent(btn);
        window.addRecurringEvent = () => EventsHandler.addRecurringEvent();
        window.removeRecurringEvent = (idx) => EventsHandler.removeRecurringEvent(idx);
        window.openGoalModal = () => GoalsHandler.openGoalModal();
        window.closeGoalModal = () => GoalsHandler.closeGoalModal();
        window.saveGoal = () => GoalsHandler.saveGoal();
        window.removeGoal = (idx) => GoalsHandler.removeGoal(idx);
        window.updateCryptoPrices = () => CryptoHandler.syncPrices();

        // Misc
        window.showNotification = (message, type = 'success') => {
            const existing = document.querySelector('.notification');
            if (existing) existing.remove();
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✗' : '⚠'}</span> ${message}`;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        };

        // MC Helpers
        window.setMcSpendPreset = (val) => {
            const input = document.getElementById('mcSpendScenario');
            if (input) {
                input.value = val;
                window.updateMcSpendSlider(val);
                document.querySelectorAll('.spend-presets .btn').forEach(btn => {
                    btn.classList.remove('btn-primary');
                    btn.classList.add('btn-outline');
                });
                const activeBtn = document.getElementById(`preset-mc-${Math.round(val * 100)}`);
                if (activeBtn) {
                    activeBtn.classList.remove('btn-outline');
                    activeBtn.classList.add('btn-primary');
                }
            }
        };
        window.updateMcSpendSlider = (val) => {
            const display = document.getElementById('mcSpendVal');
            if (display) display.textContent = Math.round(val * 100) + '%';
        };
        window.updateMcScenarioDesc = (scenario) => {
            const descEl = document.getElementById('mcScenarioDesc');
            if (!descEl) return;
            const descriptions = {
                'monte-carlo': 'Advanced statistical analysis using 1,000+ random market paths based on volatility.',
                'historical-bootstrap': 'Uses random years selected from the full historical dataset (1928-Present).',
                'last-10': 'Simulates the strong bull market returns from 2014-2023.',
                'last-20': 'A mixed period covering two major stock market cycles (2004-2023).',
                'last-30': 'A full 30-year cycle including multiple crashes and strong recoveries.',
                '1970s': 'The period of "Stagflation" - low returns and high consumer price inflation.',
                'dotcom': 'Covers the consecutive 2000 Dotcom bust and 2008 Financial Crisis.',
                'depression': 'The "worst case" scenario in US history starting from the 1929 crash.'
            };
            descEl.textContent = descriptions[scenario] || descriptions['monte-carlo'];
        };

        // Event Listeners for Modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') window.closeDataTableModal();
        });
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('data-table-modal-overlay')) window.closeDataTableModal();
        });

        window.Chart = Chart;
        Logger.debug('✅ Global Bridge Established');
    }
};
