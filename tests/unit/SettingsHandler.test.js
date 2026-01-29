/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsHandler } from '../../src/ui/SettingsHandler.js';
import { config } from '../../src/data/Config.js';

describe('SettingsHandler', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <input id="inputName" />
            <input id="inputAge" />
            <input id="inputRetireAge" />
            <input id="inputLongevity" />
            <input id="inputState" />
            <input id="inputFilingStatus" />
            <input id="inputWorkIncome" />
            <input id="inputIncomeGrowth" />
            <input id="input401kContrib" />
            <input id="inputEmployerMatch" />
            <input id="inputRothContrib" />
            <input id="inputHSAContrib" />
            <input id="inputExpensesGeneral" />
            <input id="inputExpensesTravel" />
            <input id="inputExpensesUtilities" />
            <input id="inputExpensesMisc" />
            <input id="inputRetirement" />
            <input id="inputRoth" />
            <input id="inputHSA" />
            <input id="inputInvestments" />
            <input id="inputCash" />
            <input id="inputOtherAssets" />
            <input id="inputBTC" />
            <input id="inputETH" />
            <input id="inputSOL" />
            <input id="inputGlideStocks" />
            <input id="inputGlideBonds" />
            <input id="inputGlideCash" />
            <input id="inputGlideCrypto" />
            <input id="inputReturnOpt" />
            <input id="inputReturnAvg" />
            <input id="inputReturnPes" />
            <input id="inputReturnBonds" />
            <input id="inputReturnCash" />
            <input id="inputHomeValue" />
            <input id="inputMortgageBalance" />
            <input id="inputHomeAppreciation" />
            <input id="inputMortgageRate" />
            <input id="inputMortgagePayment" />
            <input id="inputMortgageYears" />
            <input id="inputPropertyTax" />
            <input id="inputHomeMaint" />
            <input id="inputHomeInsurance" />
            <input id="inputPlanToSell" />
            <input id="inputSellYear" />
            <input id="inputSaleCosts" />
            <input id="inputFutureRent" />
            <input id="inputRentInflation" />
            <input id="inputPlanToBuy" />
            <input id="inputBuyYear" />
            <input id="inputNewHomeValue" />
            <input id="inputNewMortgageAmount" />
            <input id="inputNewMortgageRate" />
            <input id="inputNewMortgageYears" />
            <input id="inputRothConversion" />
            <input id="inputRothConvStart" />
            <input id="inputRothConvEnd" />
            <input id="inputRothConvBracket" />
            <input id="inputWithdrawalStrategy" />
            <input id="inputSSAge" />
            <input id="inputSS62" />
            <input id="inputSS67" />
            <input id="inputSS70" />
            <input id="inputSSCola" />
            <input id="goalRetirementNW" />
            <input id="goalAge70NW" />
            <input id="goalLegacy" />
            <input id="goalRetireIncome" />
            <input id="inputFedBracket" />
            <input id="inputPhase1Mult" />
            <input id="inputPhase2Mult" />
            <input id="ownsHome" type="checkbox" />
            <div id="settingsOverlay"></div>
            <button id="applySettingsBtn"><span id="applyBtnIcon"></span><span id="applyBtnText"></span></button>
        `;
        config.settings.personal = { name: 'Test', age: 40, retireAge: 65, longevity: 90 };
        vi.spyOn(SettingsHandler, 'save').mockImplementation(() => { });
        vi.spyOn(SettingsHandler, 'notify').mockImplementation(() => { });
        // Mock validate directly if logic is complex or DOM dependent
        // But better to test usage
        window.recalculate = vi.fn();
    });

    it('should populate UI from config', () => {
        SettingsHandler.populateUI();
        expect(document.getElementById('inputName').value).toBe('Test');
        expect(document.getElementById('inputAge').value).toBe('40');
    });

    it('should validate invalid age inputs', () => {
        document.getElementById('inputAge').value = '101';
        // Mock getElementById to return values for validation if needed
        // Here we rely on JSDOM
        const isValid = SettingsHandler.validate();
        expect(isValid).toBe(false);
    });

    it('should validate retirement age logic', () => {
        // Must set valid values for other fields first
        document.getElementById('inputAge').value = '40';
        document.getElementById('inputLongevity').value = '90';

        document.getElementById('inputRetireAge').value = '35'; // Invalid: < Age
        const isValid = SettingsHandler.validate();
        expect(isValid).toBe(false);
    });

    it('should apply valid settings', () => {
        document.getElementById('inputAge').value = '41';
        document.getElementById('inputRetireAge').value = '65';
        document.getElementById('inputLongevity').value = '95';

        SettingsHandler.apply();
        expect(config.settings.personal.age).toBe(41);
        expect(window.recalculate).toHaveBeenCalled();
    });
});
