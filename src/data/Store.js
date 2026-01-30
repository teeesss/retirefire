import { SimulationEngine } from '../engine/SimulationEngine.js';
import { config } from './Config.js';

export let rawData = SimulationEngine.run();

export function updateRawData() {
    console.log('🔄 updateRawData() called');
    const oldNW = rawData.average?.netWorth?.[rawData.average.netWorth.length - 1] || 0;

    rawData = SimulationEngine.run();

    const newNW = rawData.average?.netWorth?.[rawData.average.netWorth.length - 1] || 0;
    console.log('  - Before Final NW:', oldNW.toLocaleString());
    console.log('  - After Final NW:', newNW.toLocaleString());
    console.log('  - Data Changed:', oldNW !== newNW);
    console.log('  - Baseline:', rawData.baseline ? 'exists' : 'null');
    console.log('  - rothConversions:', rawData.average?.rothConversions ?
        `${rawData.average.rothConversions.amounts?.filter(a => a > 0).length} active years` : 'missing');
}
