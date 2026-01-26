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
