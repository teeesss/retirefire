/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GapCalculator } from '../../src/ui/GapCalculator.js';
import { config } from '../../src/data/Config.js';
import { rawData } from '../../src/data/Store.js';

describe('GapCalculator', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <input id="calcTargetIncome" value="10000">
            <div id="calcProjectedIncome"></div>
            <div id="calcResultValue"></div>
            <div id="calcResultLabel"></div>
            <div id="calcProgressBar" style="width: 0%"></div>
        `;

        // Reset config and rawData
        config.currentScenario = 'average';
        config.startAge = 50;
        config.settings = {
            personal: { age: 50, retireAge: 60 }
        };

        // Mock rawData
        rawData.years = Array.from({ length: 46 }, (_, i) => 2026 + i);
        rawData.ages = Array.from({ length: 46 }, (_, i) => 50 + i);
        rawData.average = {
            income: {
                Work: Array(46).fill(0),
                SocialSecurity: Array(46).fill(0),
                Drawdown: Array(46).fill(0),
                RMD: Array(46).fill(0)
            }
        };
    });

    it('should calculate surplus when projected > target', () => {
        // Set retirement income at age 60 (index 10) to $12,000/mo ($144,000/yr)
        rawData.average.income.SocialSecurity[10] = 144000;

        GapCalculator.update();

        expect(document.getElementById('calcProjectedIncome').textContent).toBe('$12,000');
        expect(document.getElementById('calcResultLabel').textContent).toBe('Surplus');
        expect(document.getElementById('calcResultValue').textContent).toBe('+$2,000');
        expect(document.getElementById('calcProgressBar').style.width).toBe('100%');
    });

    it('should calculate shortfall when projected < target', () => {
        // Set retirement income at age 60 (index 10) to $8,000/mo ($96,000/yr)
        rawData.average.income.SocialSecurity[10] = 96000;

        GapCalculator.update();

        expect(document.getElementById('calcProjectedIncome').textContent).toBe('$8,000');
        expect(document.getElementById('calcResultLabel').textContent).toBe('Shortfall');
        expect(document.getElementById('calcResultValue').textContent).toBe('-$2,000');
        expect(document.getElementById('calcProgressBar').style.width).toBe('80%');
    });

    it('should handle zero target income', () => {
        document.getElementById('calcTargetIncome').value = "0";
        rawData.average.income.SocialSecurity[10] = 50000;

        GapCalculator.update();

        expect(document.getElementById('calcProgressBar').style.width).toBe('100%');
    });
});
