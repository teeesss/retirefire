/**
 * Global store for Chart.js instances to allow destruction and updates
 */
export const charts = {};

// Expose to window for legacy support and tooltips
if (typeof window !== 'undefined') {
    window.charts = charts;
}

/**
 * Safely destroy an existing chart before recreating it.
 * @param {string} chartKey - The key in the charts object
 */
export function destroyChart(chartKey) {
    if (charts[chartKey]) {
        try {
            charts[chartKey].destroy();
            delete charts[chartKey];
            return true;
        } catch (e) {
            console.warn(`Failed to destroy chart ${chartKey}:`, e.message);
        }
    }
    return false;
}

/**
 * Destroy all existing charts
 */
export function destroyAllCharts() {
    Object.keys(charts).forEach(key => destroyChart(key));
}
