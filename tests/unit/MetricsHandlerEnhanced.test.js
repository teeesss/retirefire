import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MetricsHandler } from '../../src/ui/MetricsHandler.js';
import { config } from '../../src/data/Config.js';
import { rawData } from '../../src/data/Store.js';

describe('MetricsHandler - New Insights (TASK-010)', () => {
    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = '<div id="coachMessageList"></div>';

        // Mock config
        config.currentScenario = 'average';
        config.settings = {
            personal: { age: 50 },
            assets: {
                allocation: {
                    stocks: 60,
                    bonds: 30,
                    cash: 10
                }
            }
        };

        // Mock rawData
        rawData.average = {
            accounts: {
                Investments: [100000, 105000, 110000]
            },
            drawdown: {
                InvestmentsTax: [1000, 1000, 1000],
                RetirementSavingsTax: [2000, 2000, 2000]
            }
        };
        rawData.monteCarlo = { successRate: 95 };
        rawData.years = [2026, 2027, 2028];
        rawData.ages = [50, 51, 52];
    });

    it('should generate Portfolio Drag insight for young investors with high conservative allocation', () => {
        config.settings.personal.age = 50;
        config.settings.assets.allocation = {
            stocks: 40,
            bonds: 35,
            cash: 25
        };

        MetricsHandler.updateCoach();

        const list = document.getElementById('coachMessageList');
        expect(list.innerHTML).toContain('Portfolio Drag');
        expect(list.innerHTML).toContain('60%'); // 35 + 25 = 60%
    });

    it('should NOT generate Portfolio Drag insight for older investors', () => {
        config.settings.personal.age = 60; // Over 55
        config.settings.assets.allocation = {
            stocks: 40,
            bonds: 40,
            cash: 20
        };

        MetricsHandler.updateCoach();

        const list = document.getElementById('coachMessageList');
        expect(list.innerHTML).not.toContain('Portfolio Drag');
    });

    it('should NOT generate Portfolio Drag insight for appropriate allocation', () => {
        config.settings.personal.age = 50;
        config.settings.assets.allocation = {
            stocks: 70,
            bonds: 20,
            cash: 10
        };

        MetricsHandler.updateCoach();

        const list = document.getElementById('coachMessageList');
        expect(list.innerHTML).not.toContain('Portfolio Drag');
    });

    it('should generate Inflation Risk insight for low real growth', () => {
        // Mock getNetWorthSeries to return low growth scenario
        vi.mock('../../src/state/DataUtils.js', () => ({
            getNetWorthSeries: vi.fn(() => [1000000, 1100000]) // Only 10% growth
        }));

        MetricsHandler.updateCoach();

        const list = document.getElementById('coachMessageList');
        // Low growth (10%) should trigger inflation warning
        expect(list.innerHTML).toContain('Inflation Risk');
    });

    it('should add hover effects to all insight cards', () => {
        config.settings.personal.age = 50;
        config.settings.assets.allocation = {
            stocks: 40,
            bonds: 50,
            cash: 10
        };

        MetricsHandler.updateCoach();

        const list = document.getElementById('coachMessageList');

        // Check for hover event handlers
        expect(list.innerHTML).toContain('onmouseover');
        expect(list.innerHTML).toContain('onmouseout');

        // Check for transition CSS
        expect(list.innerHTML).toContain('transition');
        expect(list.innerHTML).toContain('border-radius');
    });

    it('should make all insights clickable with scrollToSection', () => {
        rawData.monteCarlo = { successRate: 60 }; // Low success rate

        MetricsHandler.updateCoach();

        const list = document.getElementById('coachMessageList');

        // Check for onclick handlers
        expect(list.innerHTML).toContain('onclick');
        expect(list.innerHTML).toContain('scrollToSection');

        // Check for cursor pointer
        expect(list.innerHTML).toContain('cursor: pointer');
    });

    it('should handle missing data gracefully', () => {
        rawData.average = null;

        expect(() => {
            MetricsHandler.updateCoach();
        }).not.toThrow();
    });
});
