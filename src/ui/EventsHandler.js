import { config } from '../data/Config.js';
import { formatCurrency } from '../utils/Formatters.js';

export class EventsHandler {
    static addEvent() {
        const year = parseInt(document.getElementById('eventYear')?.value);
        const description = document.getElementById('eventDescription')?.value;
        const amount = parseFloat(document.getElementById('eventAmount')?.value);
        const type = document.getElementById('eventType')?.value;

        if (!description || !amount) {
            this.notify('Please fill all fields', 'error');
            return;
        }

        config.events = config.events || [];
        config.events.push({ year, description, amount, type });
        this.renderTable();
        this.save();

        document.getElementById('eventDescription').value = '';
        document.getElementById('eventAmount').value = '';
        this.notify('Event added!');
    }

    static removeEvent(btn) {
        const row = btn.closest('tr');
        const index = Array.from(row.parentNode.children).indexOf(row);
        config.events.splice(index, 1);
        this.renderTable();
        this.save();
    }

    static addRecurringEvent() {
        const startAge = parseInt(document.getElementById('recurStartAge')?.value);
        const endAge = parseInt(document.getElementById('recurEndAge')?.value);
        const description = document.getElementById('recurDescription')?.value;
        const amount = parseFloat(document.getElementById('recurAmount')?.value);
        const type = document.getElementById('recurType')?.value;

        if (!description || isNaN(amount)) {
            this.notify('Please fill all fields', 'error');
            return;
        }

        config.recurringEvents = config.recurringEvents || [];
        config.recurringEvents.push({ startAge, endAge, description, amount, type });
        this.renderTable();
        this.save();

        document.getElementById('recurDescription').value = '';
        document.getElementById('recurAmount').value = '';
        this.notify('Recurring event added!');
        recalculate();
    }

    static removeRecurringEvent(index) {
        config.recurringEvents.splice(index, 1);
        this.renderTable();
        this.save();
        recalculate();
    }

    static renderTable() {
        // One-time events
        const tbody = document.getElementById('eventsTableBody');
        if (tbody && config.events) {
            tbody.innerHTML = config.events.map((event, i) => `
                <tr>
                    <td>${event.year}</td>
                    <td>${event.description}</td>
                    <td class="${event.type === 'income' ? 'positive' : 'negative'}">${event.type === 'income' ? '+' : '-'}${formatCurrency(Math.abs(event.amount), false)}</td>
                    <td>${event.type === 'income' ? 'Income' : 'Expense'}</td>
                    <td><button class="btn btn-sm btn-outline" onclick="removeEvent(this)">Remove</button></td>
                </tr>
            `).join('');
        }

        // Recurring events
        const recurTbody = document.getElementById('recurringEventsTableBody');
        if (recurTbody && config.recurringEvents) {
            recurTbody.innerHTML = config.recurringEvents.map((event, i) => `
                <tr>
                    <td>${event.startAge}-${event.endAge}</td>
                    <td>${event.description}</td>
                    <td class="${event.type === 'income' ? 'positive' : 'negative'}">${event.type === 'income' ? '+' : '-'}${formatCurrency(Math.abs(event.amount), false)}</td>
                    <td><button class="btn btn-sm btn-outline" onclick="removeRecurringEvent(${i})">Remove</button></td>
                </tr>
            `).join('');
        }
    }

    static save() {
        localStorage.setItem('retirementPlannerConfig', JSON.stringify(config));
    }

    static notify(message, type = 'success') {
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `<span>${type === 'success' ? '✓' : '⚠'}</span> ${message}`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}
