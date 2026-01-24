/**
 * Chart.js Tooltip Configuration
 * Fixes ISSUE-027, 033, 036: Missing hover tooltips on charts
 */

export const tooltipConfig = {
    enabled: true,
    mode: 'index',
    intersect: false,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    titleColor: '#fff',
    bodyColor: '#fff',
    borderColor: 'rgba(59, 130, 246, 0.5)',
    borderWidth: 1,
    padding: 12,
    displayColors: true,
    callbacks: {
        title: function (context) {
            if (context[0].label) {
                return context[0].label;
            }
            return '';
        },
        label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
                label += ': ';
            }
            if (context.parsed.y !== null) {
                // Format based on chart type
                const value = context.parsed.y;
                if (Math.abs(value) >= 1000000) {
                    label += '$' + (value / 1000000).toFixed(2) + 'M';
                } else if (Math.abs(value) >= 1000) {
                    label += '$' + (value / 1000).toFixed(1) + 'K';
                } else {
                    label += '$' + value.toLocaleString();
                }
            }
            return label;
        }
    }
};

export const percentTooltipConfig = {
    ...tooltipConfig,
    callbacks: {
        ...tooltipConfig.callbacks,
        label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
                label += ': ';
            }
            if (context.parsed.y !== null) {
                label += context.parsed.y.toFixed(1) + '%';
            }
            return label;
        }
    }
};

/**
 * Apply tooltip configuration to a chart options object
 */
export function applyTooltipConfig(options, usePercent = false) {
    if (!options.plugins) {
        options.plugins = {};
    }
    options.plugins.tooltip = usePercent ? percentTooltipConfig : tooltipConfig;
    return options;
}

/**
 * Enable tooltips on all existing charts
 */
export function enableTooltipsOnAllCharts(charts) {
    Object.values(charts).forEach(chart => {
        if (chart && chart.options && chart.options.plugins) {
            chart.options.plugins.tooltip = tooltipConfig;
            chart.update();
        }
    });
    console.log('✓ Tooltips enabled on all charts');
}
