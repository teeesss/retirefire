/**
 * Chart.js Tooltip Configuration
 * Fixes ISSUE-027, 033, 036: Missing hover tooltips on charts
 */

export const tooltipConfig = {
    enabled: true,
    mode: 'index',
    intersect: false,
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    titleColor: '#fff',
    bodyColor: '#fff',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    padding: 12,
    cornerRadius: 8,
    displayColors: true,
    usePointStyle: true,
    callbacks: {
        title: function (context) {
            return context[0].label || '';
        },
        label: function (context) {
            const isPie = context.chart.config.type === 'pie' || context.chart.config.type === 'doughnut';
            const label = isPie ? context.label : (context.dataset.label || '');
            const value = isPie ? context.raw : context.parsed.y;

            let labelText = label ? `${label}: ` : '';

            if (value !== null && value !== undefined) {
                if (Math.abs(value) >= 1000000) {
                    labelText += '$' + (value / 1000000).toFixed(2) + 'M';
                } else if (Math.abs(value) >= 1000) {
                    labelText += '$' + (value / 1000).toFixed(1) + 'K';
                } else {
                    labelText += '$' + parseInt(value).toLocaleString();
                }
            }
            return labelText;
        }
    }
};

export const percentTooltipConfig = {
    ...tooltipConfig,
    callbacks: {
        ...tooltipConfig.callbacks,
        label: function (context) {
            const isPie = context.chart.config.type === 'pie' || context.chart.config.type === 'doughnut';
            const label = isPie ? context.label : (context.dataset.label || '');
            const value = isPie ? context.raw : context.parsed.y;

            let labelText = label ? `${label}: ` : '';
            if (value !== null) {
                labelText += value.toFixed(1) + '%';
            }
            return labelText;
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
