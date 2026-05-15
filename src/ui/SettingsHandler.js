import { config } from '../data/Config.js';
import { recalculate } from '../core/AppController.js';
import { SecureStorage } from '../utils/SecureStorage.js';
import { Logger } from '../utils/Logger.js';

export class SettingsHandler {
    static populateUI(sectionId = 'personal') {
        const s = config.settings;

        // Personal
        this.setVal('inputName', s.personal.name);
        this.setVal('inputAge', s.personal.age);
        this.setVal('inputRetireAge', s.personal.retireAge);
        this.setVal('inputLongevity', s.personal.longevity);
        this.setVal('inputState', s.taxSettings?.state || 'FL');
        this.setVal('inputFilingStatus', s.taxSettings?.filingStatus || 'head');

        // Assets
        this.setVal('inputRetirement', s.assets.retirement);
        this.setVal('inputRoth', s.assets.roth);
        this.setVal('inputHSA', s.assets.hsa);
        this.setVal('inputInvestments', s.assets.investments);
        this.setVal('inputCash', s.assets.cash);
        this.setVal('inputOtherAssets', s.assets.otherAssets);
        this.setVal('inputBTC', s.assets.btc);
        this.setVal('inputETH', s.assets.eth);
        this.setVal('inputSOL', s.assets.sol);

        // Glide Path
        this.setVal('inputGlideStocks', s.glidePath?.stocks || 60);
        this.setVal('inputGlideBonds', s.glidePath?.bonds || 30);
        this.setVal('inputGlideCash', s.glidePath?.cash || 5);
        this.setVal('inputGlideCrypto', s.glidePath?.crypto || 5);

        // Rates
        this.setVal('inputReturnOpt', s.rates.optimistic);
        this.setVal('inputReturnAvg', s.rates.average);
        this.setVal('inputReturnPes', s.rates.pessimistic);
        this.setVal('inputReturnBonds', s.rates.bonds);
        this.setVal('inputReturnCash', s.rates.cash);

        // Income
        this.setVal('inputWorkIncome', s.income.work);
        this.setVal('inputIncomeGrowth', s.income.growth);
        this.setVal('input401kContrib', s.income.contribution401k);
        this.setVal('inputEmployerMatch', s.income.employerMatch);
        this.setVal('inputRothContrib', s.income.rothContrib);
        this.setVal('inputHSAContrib', s.income.hsaContrib);

        // Expenses
        this.setVal('inputExpensesGeneral', s.expenses.general);
        this.setVal('inputExpensesTravel', s.expenses.travel);
        this.setVal('inputExpensesUtilities', s.expenses.utilities);
        this.setVal('inputExpensesMisc', s.expenses.misc);
        this.setVal('inputGifts', s.expenses.gifts);
        this.setVal('inputVehicle', s.expenses.vehicle);

        // Taxes
        this.setVal('inputRothConversion', s.taxes.rothConversion);
        this.setVal('inputRothConvStart', s.taxes.rothConvStart);
        this.setVal('inputRothConvEnd', s.taxes.rothConvEnd);
        this.setVal('inputRothConvBracket', s.taxes.rothConvBracket || '24');
        this.setVal('inputWithdrawalStrategy', s.taxes.withdrawalStrategy || 'grow_tax_deferred');

        // Social Security
        this.setVal('inputSSAge', s.socialSecurity.claimAge);
        this.setVal('inputSS62', s.socialSecurity.ss62);
        this.setVal('inputSS67', s.socialSecurity.ss67);
        this.setVal('inputSS70', s.socialSecurity.ss70);
        this.setVal('inputSSCola', s.socialSecurity.cola);

        // Goals
        this.setVal('goalRetirementNW', s.goals?.retirementNW || 4000000);
        this.setVal('goalAge70NW', s.goals?.age70NW || 10000000);
        this.setVal('goalLegacy', s.goals?.legacy || 5000000);
        this.setVal('goalRetireIncome', s.goals?.retireIncome || 120000);

        // Housing
        const h = s.housing || {};
        const ownsHome = document.getElementById('ownsHome');
        if (ownsHome) ownsHome.checked = (h.homeValue > 0 || h.mortgageBalance > 0);

        this.setVal('inputHomeValue', h.homeValue || 0);
        this.setVal('inputHomeAppreciation', h.appreciation || 3.5);
        this.setVal('inputMortgageBalance', h.mortgageBalance || 0);
        this.setVal('inputMortgageRate', h.mortgageRate || 6.5);
        this.setVal('inputMortgagePayment', h.mortgagePayment || 0);
        this.setVal('inputMortgageYears', h.mortgageYears || 0);
        this.setVal('inputPropertyTax', h.propertyTax || 0);
        this.setVal('inputHomeMaint', h.maintenance || 0);
        this.setVal('inputHomeInsurance', h.insurance || 0);

        this.setVal('inputPlanToSell', h.sellHome || 'no');
        this.setVal('inputSellYear', h.sellYear || 2030);
        this.setVal('inputSaleCosts', h.saleCosts || 6);
        this.setVal('inputFutureRent', h.futureRent || 0);
        this.setVal('inputRentInflation', h.rentInflation || 3);

        this.setVal('inputPlanToBuy', h.buyNewHome || 'no');
        this.setVal('inputBuyYear', h.buyYear || 2031);
        this.setVal('inputNewHomeValue', h.newHomeValue || 0);
        this.setVal('inputNewMortgageAmount', h.newMortgageAmount || 0);
        this.setVal('inputNewMortgageRate', h.newMortgageRate || 6.5);
        this.setVal('inputNewMortgageYears', h.newMortgageYears || 30);

        // Open overlay
        document.getElementById('settingsOverlay')?.classList.add('active');

        // Show specific section
        this.showSettingsSection(sectionId);

        // Auto-calculate totals
        this.updateTotalExpenses();
    }

    static showSettingsSection(sectionId, navItem) {
        // Hide all sections
        document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
        // Show target section
        const target = document.getElementById('settings-' + sectionId);
        if (target) {
            target.classList.add('active');
            // Scroll content to top
            const content = document.querySelector('.settings-content');
            if (content) content.scrollTop = 0;
        }

        // Update nav items
        document.querySelectorAll('.settings-nav-item').forEach(n => n.classList.remove('active'));

        if (navItem) {
            navItem.classList.add('active');
        } else {
            // Find nav item by text or data (more robust than index)
            const navItems = document.querySelectorAll('.settings-nav-item');
            navItems.forEach(n => {
                const text = n.textContent.toLowerCase();
                if (text.includes(sectionId.toLowerCase())) {
                    n.classList.add('active');
                }
            });
        }
    }

    static validate() {
        const age = parseInt(this.getVal('inputAge'));
        const retireAge = parseInt(this.getVal('inputRetireAge'));
        const longevity = parseInt(this.getVal('inputLongevity'));

        if (isNaN(age) || age < 0 || age > 100) {
            this.notify('Please enter a valid age (0-100)', 'error');
            return false;
        }
        if (isNaN(longevity) || longevity <= age || longevity > 120) {
            this.notify('Life expectancy must be greater than current age', 'error');
            return false;
        }
        if (isNaN(retireAge) || retireAge < age || retireAge > longevity) {
            this.notify('Retirement age must be between current age and life expectancy', 'error');
            return false;
        }
        return true;
    }

    static apply() {
        if (!this.validate()) return;

        const s = config.settings;

        // Personal
        s.personal.name = this.getVal('inputName');
        s.personal.age = parseInt(this.getVal('inputAge'));
        s.personal.retireAge = parseInt(this.getVal('inputRetireAge'));
        s.personal.longevity = parseInt(this.getVal('inputLongevity'));

        // Assets
        s.assets.retirement = parseFloat(this.getVal('inputRetirement'));
        s.assets.roth = parseFloat(this.getVal('inputRoth'));
        s.assets.hsa = parseFloat(this.getVal('inputHSA'));
        s.assets.investments = parseFloat(this.getVal('inputInvestments'));
        s.assets.cash = parseFloat(this.getVal('inputCash'));
        s.assets.otherAssets = parseFloat(this.getVal('inputOtherAssets'));
        s.assets.btc = parseFloat(this.getVal('inputBTC'));
        s.assets.eth = parseFloat(this.getVal('inputETH'));
        s.assets.sol = parseFloat(this.getVal('inputSOL'));

        // Glide Path
        s.glidePath = s.glidePath || {};
        s.glidePath.stocks = parseFloat(this.getVal('inputGlideStocks'));
        s.glidePath.bonds = parseFloat(this.getVal('inputGlideBonds'));
        s.glidePath.cash = parseFloat(this.getVal('inputGlideCash'));
        s.glidePath.crypto = parseFloat(this.getVal('inputGlideCrypto'));

        // Rates
        s.rates.optimistic = parseFloat(this.getVal('inputReturnOpt'));
        s.rates.average = parseFloat(this.getVal('inputReturnAvg'));
        s.rates.pessimistic = parseFloat(this.getVal('inputReturnPes'));
        s.rates.bonds = parseFloat(this.getVal('inputReturnBonds'));
        s.rates.cash = parseFloat(this.getVal('inputReturnCash'));

        // Income
        s.income.work = parseFloat(this.getVal('inputWorkIncome'));
        s.income.growth = parseFloat(this.getVal('inputIncomeGrowth'));
        s.income.contribution401k = parseFloat(this.getVal('input401kContrib'));
        s.income.employerMatch = parseFloat(this.getVal('inputEmployerMatch') || 0);
        s.income.rothContrib = parseFloat(this.getVal('inputRothContrib') || 0);
        s.income.hsaContrib = parseFloat(this.getVal('inputHSAContrib'));

        // Expenses
        s.expenses.general = parseFloat(this.getVal('inputExpensesGeneral'));
        s.expenses.travel = parseFloat(this.getVal('inputExpensesTravel'));
        s.expenses.utilities = parseFloat(this.getVal('inputExpensesUtilities'));
        s.expenses.misc = parseFloat(this.getVal('inputExpensesMisc'));
        s.expenses.gifts = parseFloat(this.getVal('inputGifts'));
        s.expenses.vehicle = parseFloat(this.getVal('inputVehicle'));
        s.expenses.annualSpending = s.expenses.general + s.expenses.travel + s.expenses.utilities + s.expenses.misc + s.expenses.gifts + s.expenses.vehicle;

        s.expenses.phases = [
            { startAge: s.personal.retireAge, endAge: 60, multiplier: parseFloat(this.getVal('inputPhase1Mult') || 1.0), description: 'Active Retirement' },
            { startAge: 60, endAge: 70, multiplier: parseFloat(this.getVal('inputPhase2Mult') || 0.9), description: 'Slow Down' }
        ];

        // Social Security
        s.socialSecurity.claimAge = parseInt(this.getVal('inputSSAge') || 62);
        s.socialSecurity.ss62 = parseFloat(this.getVal('inputSS62') || 1800);
        s.socialSecurity.ss67 = parseFloat(this.getVal('inputSS67') || 2739);
        s.socialSecurity.ss70 = parseFloat(this.getVal('inputSS70') || 3500);
        s.socialSecurity.cola = parseFloat(this.getVal('inputSSCola') || 2.5);

        // Taxes
        s.taxes = s.taxes || {};
        s.taxes.rothConversion = parseFloat(this.getVal('inputRothConversion') || 0);
        s.taxes.rothConvStart = parseInt(this.getVal('inputRothConvStart') || 2026);
        s.taxes.rothConvEnd = parseInt(this.getVal('inputRothConvEnd') || 2035);
        s.taxes.rothConvBracket = this.getVal('inputRothConvBracket') || '24';
        s.taxes.withdrawalStrategy = this.getVal('inputWithdrawalStrategy') || 'grow_tax_deferred';

        s.taxSettings = s.taxSettings || {};
        s.taxSettings.filingStatus = this.getVal('inputFilingStatus') || 'head';
        s.taxSettings.state = this.getVal('inputState') || 'FL';
        s.taxSettings.fedBracket = parseInt(this.getVal('inputFedBracket') || 22);

        // Goals
        s.goals = s.goals || {};
        s.goals.retirementNW = parseFloat(this.getVal('goalRetirementNW') || 4000000);
        s.goals.age70NW = parseFloat(this.getVal('goalAge70NW') || 10000000);
        s.goals.legacy = parseFloat(this.getVal('goalLegacy') || 5000000);
        s.goals.retireIncome = parseFloat(this.getVal('goalRetireIncome') || 120000);

        // Housing
        s.housing = s.housing || {};
        const followsOwnsHome = document.getElementById('ownsHome')?.checked;
        if (!followsOwnsHome) {
            s.housing.homeValue = 0;
            s.housing.mortgageBalance = 0;
        } else {
            s.housing.homeValue = parseFloat(this.getVal('inputHomeValue'));
            s.housing.mortgageBalance = parseFloat(this.getVal('inputMortgageBalance'));
        }
        s.housing.appreciation = parseFloat(this.getVal('inputHomeAppreciation'));
        s.housing.mortgageRate = parseFloat(this.getVal('inputMortgageRate'));
        s.housing.mortgagePayment = parseFloat(this.getVal('inputMortgagePayment'));
        s.housing.mortgageYears = parseInt(this.getVal('inputMortgageYears'));
        s.housing.propertyTax = parseFloat(this.getVal('inputPropertyTax'));
        s.housing.maintenance = parseFloat(this.getVal('inputHomeMaint'));
        s.housing.insurance = parseFloat(this.getVal('inputHomeInsurance'));

        s.housing.sellHome = this.getVal('inputPlanToSell');
        s.housing.sellYear = parseInt(this.getVal('inputSellYear'));
        s.housing.saleCosts = parseFloat(this.getVal('inputSaleCosts'));
        s.housing.futureRent = parseFloat(this.getVal('inputFutureRent'));
        s.housing.rentInflation = parseFloat(this.getVal('inputRentInflation'));

        s.housing.buyNewHome = this.getVal('inputPlanToBuy');
        s.housing.buyYear = parseInt(this.getVal('inputBuyYear'));
        s.housing.newHomeValue = parseFloat(this.getVal('inputNewHomeValue'));
        s.housing.newMortgageAmount = parseFloat(this.getVal('inputNewMortgageAmount'));
        s.housing.newMortgageRate = parseFloat(this.getVal('inputNewMortgageRate'));
        s.housing.newMortgageYears = parseInt(this.getVal('inputNewMortgageYears'));

        this.save();
        recalculate();
        this.showSuccess();
    }

    static save() {
        try {
            SecureStorage.save(config);
        } catch (e) {
            Logger.error('SettingsHandler save failed:', e);
            this.notify('Failed to save settings safely', 'error');
        }
    }

    static showSuccess() {
        const btn = document.getElementById('applySettingsBtn');
        const icon = document.getElementById('applyBtnIcon');
        const text = document.getElementById('applyBtnText');
        if (btn && icon && text) {
            btn.className = 'btn btn-success';
            icon.textContent = '✓';
            text.textContent = 'Applied!';
            setTimeout(() => {
                btn.className = 'btn btn-outline';
                icon.textContent = '⚙️';
                text.textContent = 'Apply & Recalculate';
            }, 3000);
        }
        this.notify('✓ Settings applied & plan recalculated!', 'success');
    }

    static notify(message, type = 'success') {
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✗' : '⚠'}</span> ${message}`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    static setVal(id, val) {
        const el = document.getElementById(id);
        if (el) el.value = val ?? '';
    }

    static getVal(id) {
        const el = document.getElementById(id);
        if (!el) {
            Logger.warn(`Element with ID "${id}" not found in DOM`);
            return '0';
        }
        return el.value || '0';
    }

    static updateTotalExpenses() {
        const general = parseFloat(this.getVal('inputExpensesGeneral')) || 0;
        const utilities = parseFloat(this.getVal('inputExpensesUtilities')) || 0;
        const travel = parseFloat(this.getVal('inputExpensesTravel')) || 0;
        const misc = parseFloat(this.getVal('inputExpensesMisc')) || 0;
        const gifts = parseFloat(this.getVal('inputGifts')) || 0;
        const vehicle = parseFloat(this.getVal('inputVehicle')) || 0;

        const total = general + utilities + travel + misc + gifts + vehicle;
        const formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(total);

        document.querySelectorAll('.total-expenses-display').forEach(el => {
            el.textContent = formatted;
        });
    }

    static showSection(sectionId, element) {
        // Hide all sections
        const sections = document.querySelectorAll('.settings-section');
        sections.forEach(s => s.classList.remove('active'));

        // Show target section
        const target = document.getElementById(`settings-${sectionId}`);
        if (target) {
            target.classList.add('active');
        }

        // Update nav styling
        const navItems = document.querySelectorAll('.settings-nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        if (element) {
            element.classList.add('active');
        }
    }

    static toggleSpouseFields() {
        const checkbox = document.getElementById('hasSpouse');
        const fields = document.getElementById('spouseFields');
        if (checkbox && fields) {
            fields.style.display = checkbox.checked ? 'block' : 'none';
        }
    }

    static toggleHomeFields() {
        const checkbox = document.getElementById('ownsHome');
        const fields = document.getElementById('homeFields');
        if (checkbox && fields) {
            fields.style.display = checkbox.checked ? 'block' : 'none';
        }
    }

    static updateAllocDisplay() {
        const stocks = parseInt(document.getElementById('inputGlideStocks')?.value || 0);
        const bonds = parseInt(document.getElementById('inputGlideBonds')?.value || 0);
        const cash = parseInt(document.getElementById('inputGlideCash')?.value || 0);
        const crypto = parseInt(document.getElementById('inputGlideCrypto')?.value || 0);
        const total = stocks + bonds + cash + crypto;

        const totalEl = document.getElementById('allocTotal');
        if (totalEl) {
            totalEl.textContent = total + '%';
            totalEl.style.color = total === 100 ? '#10b981' : '#ef4444';
        }
    }

    static close() {
        document.getElementById('settingsOverlay')?.classList.remove('active');
    }

    static reset() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            localStorage.clear();
            location.reload();
        }
    }

    static importSettings() {
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
                    this.save();
                    this.notify('Settings imported successfully!');
                    location.reload();
                } catch (err) {
                    Logger.error('Import failed:', err);
                    this.notify('Error importing settings', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    static exportSettings() {
        const data = JSON.stringify(config, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `RetireFire_Settings_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    static cloneScenario() {
        const sc = config.currentScenario;
        this.setVal('customScenarioName', `${sc.charAt(0).toUpperCase() + sc.slice(1)} Clone`);
        this.setVal('customReturn', config.settings.rates[sc] || 7);
        this.setVal('customInflation', config.settings.inflation[sc] || 2.5);
        this.setVal('customCOLA', config.settings.socialSecurity.cola || 2.0);
    }

    static createCustomScenario() {
        const name = this.getVal('customScenarioName').trim().toLowerCase().replace(/\s+/g, '-');
        if (!name) {
            alert('Please enter a scenario name');
            return;
        }

        const rate = parseFloat(this.getVal('customReturn'));
        const inflation = parseFloat(this.getVal('customInflation'));
        const cola = parseFloat(this.getVal('customCOLA'));

        // Save to config
        config.settings.rates[name] = rate;
        config.settings.inflation[name] = inflation;
        config.settings.socialSecurity.cola = cola; // Note: COLA is currently global in SS settings

        // Switch and recalculate
        config.currentScenario = name;

        // Update comparison UI if needed
        config.comparisonEnabled[name] = true;

        if (window.recalculate) window.recalculate();
        if (window.showNotification) window.showNotification(`Scenario "${name}" created and selected!`);
        this.close();
    }

}
