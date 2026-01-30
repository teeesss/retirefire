/**
 * Shared helpers for Chart.js initialization
 */

export function getSafeCtx(id) {
    const canvas = document.getElementById(id);
    if (!canvas) return null;
    return canvas.getContext('2d');
}

/**
 * Standard colors for consistency
 */
export const chartColors = {
    optimistic: '#10b981',
    average: '#3b82f6',
    pessimistic: '#ef4444',
    retirement: '#8b5cf6',
    investment: '#22c55e',
    cash: '#f59e0b',
    housing: '#ec4899',
    hsa: '#06b6d4',
    other: '#6b7280',
    debt: '#ef4444'
};

/**
 * Validates data for a chart. Returns true if data is valid.
 */
export function validateData(data, label = 'Chart') {
    if (!data || data.length === 0) {
        console.warn(`[${label}] No data provided.`);
        return false;
    }
    if (data.every(v => v === 0 || v === null || v === undefined)) {
        console.warn(`[${label}] All data points are zero or null.`);
        return false;
    }
    return true;
}
