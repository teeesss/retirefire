import { config } from '../data/Config.js';
import { rawData } from '../data/Store.js';

/**
 * Core data transformation utilities used across the application
 */

export function calculateNetWorth(scenario, yearIndex) {
    const accounts = rawData[scenario]?.accounts;
    if (!accounts) return 0;
    let total = 0;
    for (let key in accounts) {
        if (key === 'Debt') continue; // Mortgage is in Housing equity
        if (accounts[key]?.[yearIndex] !== undefined) {
            total += accounts[key][yearIndex];
        }
    }
    return total;
}

export function getNetWorthSeries(scenario) {
    return rawData.years.map((_, i) => calculateNetWorth(scenario, i));
}

export function getTotalIncome(scenario, yearIndex, includeDrawdown = true) {
    const income = rawData[scenario]?.income;
    if (!income) return 0;
    let total = 0;
    for (let key in income) {
        if (!includeDrawdown && (key === 'Drawdown' || key.endsWith('Drawdown'))) continue;
        if (income[key]?.[yearIndex]) total += income[key][yearIndex];
    }
    return total;
}

export function getTotalExpenses(scenario, yearIndex) {
    const expenses = rawData[scenario]?.expenses;
    if (!expenses) return 0;
    let total = 0;
    for (let key in expenses) {
        if (expenses[key]?.[yearIndex]) total += expenses[key][yearIndex];
    }
    return total;
}

export function getTotalTaxes(scenario, yearIndex) {
    const taxes = rawData[scenario]?.taxes;
    if (!taxes) return 0;
    return (taxes.Federal?.[yearIndex] || 0) + (taxes.FICA?.[yearIndex] || 0) + (taxes.CapGains?.[yearIndex] || 0) + (taxes.State?.[yearIndex] || 0);
}
