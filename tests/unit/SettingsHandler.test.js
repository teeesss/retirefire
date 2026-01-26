import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsHandler } from '../../src/ui/SettingsHandler';
import { config } from '../../src/data/Config';

describe('SettingsHandler', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <input id="inputName" />
            <input id="inputAge" />
            <input id="inputRetireAge" />
            <input id="inputLongevity" />
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
