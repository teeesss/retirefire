export function formatCurrency(value, short = true) {
    if (value === undefined || value === null || isNaN(value)) return '$0';
    const absVal = Math.abs(value);
    if (short) {
        if (absVal >= 1000000000) return (value < 0 ? '-' : '') + '$' + (absVal / 1000000000).toFixed(1) + 'B';
        if (absVal >= 1000000) return (value < 0 ? '-' : '') + '$' + (absVal / 1000000).toFixed(1) + 'M';
        if (absVal >= 1000) return (value < 0 ? '-' : '') + '$' + (absVal / 1000).toFixed(0) + 'K';
    }
    return (value < 0 ? '-' : '') + '$' + absVal.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function formatPercent(value) {
    return (value * 100).toFixed(1) + '%';
}
