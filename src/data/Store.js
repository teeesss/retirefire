import { SimulationEngine } from '../engine/SimulationEngine.js';
import { config } from './Config.js';

export let rawData = SimulationEngine.run();

export function updateRawData() {
    rawData = SimulationEngine.run();
}
