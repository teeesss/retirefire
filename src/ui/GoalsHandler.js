import { config } from '../data/Config.js';
import { SettingsHandler } from './SettingsHandler.js';
import { DashboardDetails } from './DashboardDetails.js';
import { Logger } from '../utils/Logger.js';

export class GoalsHandler {
    static openGoalModal() {
        const modal = document.getElementById('goalModal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('active');

            // Set default year to 10 years from now
            const yearInput = document.getElementById('newGoalYear');
            if (yearInput) {
                yearInput.value = new Date().getFullYear() + 10;
            }
        }
    }

    static closeGoalModal() {
        const modal = document.getElementById('goalModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
    }

    static saveGoal() {
        const name = document.getElementById('newGoalName')?.value;
        const target = parseFloat(document.getElementById('newGoalAmount')?.value);
        const year = parseInt(document.getElementById('newGoalYear')?.value);

        if (!name || isNaN(target) || isNaN(year)) {
            SettingsHandler.notify('Please fill all goal fields correctly.', 'error');
            return;
        }

        // Add to config.goals
        config.goals = config.goals || [];
        config.goals.push({
            name,
            target,
            year,
            current: 0 // Will be calculated by render
        });

        // Persist
        SettingsHandler.save();

        // Update UI
        DashboardDetails.renderGoals();

        // Reset and close
        if (document.getElementById('newGoalName')) document.getElementById('newGoalName').value = '';
        this.closeGoalModal();

        SettingsHandler.notify('Goal added successfully!');
        Logger.debug('✅ Goal added:', { name, target, year });
    }

    static removeGoal(index) {
        if (confirm('Are you sure you want to remove this goal?')) {
            config.goals.splice(index, 1);
            SettingsHandler.save();
            DashboardDetails.renderGoals();
            SettingsHandler.notify('Goal removed.');
        }
    }
}
