import { SimulationEngine } from '../engine/SimulationEngine.js';
import { config } from './Config.js';

export let rawData = SimulationEngine.run();

export function updateRawData() {
    console.log('🔄 updateRawData() called');
    console.log('  - Before:', rawData.average ? 'exists' : 'null');
    const oldId = rawData.average?.netWorth?.[0] || 0;

    rawData = SimulationEngine.run();

    const newId = rawData.average?.netWorth?.[0] || 0;
    console.log('  - After:', rawData.average ? 'exists' : 'null');
    console.log('  - Data changed:', oldId !== newId);
    console.log('  - Baseline:', rawData.baseline ? 'exists' : 'null');
    console.log('  - rothConversions:', rawData.average?.rothConversions ?
        `${rawData.average.rothConversions.amounts?.length || 0} years` : 'missing');
}
