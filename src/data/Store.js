import { Logger } from '../utils/Logger.js';
import { SimulationEngine } from '../engine/SimulationEngine.js';

export let rawData = SimulationEngine.run();

export function updateRawData() {
    Logger.debug('🔄 updateRawData() called');
    const oldNW = rawData.average?.netWorth?.[rawData.average.netWorth.length - 1] || 0;

    rawData = SimulationEngine.run();

    const newNW = rawData.average?.netWorth?.[rawData.average.netWorth.length - 1] || 0;
    Logger.debug('  - Before Final NW:', oldNW.toLocaleString());
    Logger.debug('  - After Final NW:', newNW.toLocaleString());
    Logger.debug('  - Data Changed:', oldNW !== newNW);
    Logger.debug('  - Baseline:', rawData.baseline ? 'exists' : 'null');
    Logger.debug('  - rothConversions:', rawData.average?.rothConversions ?
        `${rawData.average.rothConversions.amounts?.filter(a => a > 0).length} active years` : 'missing');
}
