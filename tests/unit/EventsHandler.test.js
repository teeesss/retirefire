import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventsHandler } from '../../src/ui/EventsHandler';
import { config } from '../../src/data/Config';

describe('EventsHandler', () => {
    beforeEach(() => {
        config.events = [];
        config.recurringEvents = [];
        document.body.innerHTML = `
            <input id="eventYear" value="2030" />
            <input id="eventDescription" value="Boat Purchase" />
            <input id="eventAmount" value="50000" />
            <select id="eventType"><option value="expense" selected>Expense</option><option value="income">Income</option></select>
            <tbody id="eventsTableBody"></tbody>
            <tbody id="recurringEventsTableBody"></tbody>
        `;
        // Mock notifications and global functions
        vi.spyOn(EventsHandler, 'notify').mockImplementation(() => { });
        vi.spyOn(EventsHandler, 'save').mockImplementation(() => { });
        window.recalculate = vi.fn();
    });

    it('should add a one-time event', () => {
        EventsHandler.addEvent();
        expect(config.events).toHaveLength(1);
        expect(config.events[0]).toEqual({
            year: 2030,
            description: 'Boat Purchase',
            amount: 50000,
            type: 'expense'
        });
    });

    it('should remove a one-time event', () => {
        config.events = [{ year: 2030, description: 'Test', amount: 100, type: 'expense' }];
        EventsHandler.renderTable();
        const btn = document.querySelector('#eventsTableBody button');
        EventsHandler.removeEvent(btn);
        expect(config.events).toHaveLength(0);
    });

    it('should reject invalid events', () => {
        document.getElementById('eventAmount').value = '';
        EventsHandler.addEvent();
        expect(config.events).toHaveLength(0);
    });
});
