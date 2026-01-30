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
            // For Pie/Doughnut charts, label is handled differently
            const isPie = context.chart.config.type === 'pie' || context.chart.config.type === 'doughnut';
            let label = isPie ? context.label : (context.dataset.label || '');

            if (label) {
                label += ': ';
            }

            // Get value based on chart type
            const value = isPie ? context.raw : context.parsed.y;

            if (value !== null && value !== undefined) {
                if (Math.abs(value) >= 1000000) {
                    label += '$' + (value / 1000000).toFixed(2) + 'M';
                } else if (Math.abs(value) >= 1000) {
                    label += '$' + (value / 1000).toFixed(1) + 'K';
                } else {
                    label += '$' + parseInt(value).toLocaleString();
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
export function applyTooltipConfig(options, usePercent = false, isPie = false) {
    if (!options.plugins) {
        options.plugins = {};
    }
    options.plugins.tooltip = usePercent ? percentTooltipConfig : tooltipConfig;

    // For Pie charts, we need specific interaction settings
    if (isPie) {
        options.interaction = {
            mode: 'nearest',
            intersect: true
        };
        // Ensure tooltip title is hidden for Pie charts as the label contains the name
        options.plugins.tooltip.callbacks.title = () => '';
    }

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
