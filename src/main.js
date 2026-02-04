import './style.css';
import './dashboard-layout.css';

import { AppController } from './core/AppController.js';
import { GlobalBridge } from './core/GlobalBridge.js';
import { destroyAllCharts } from './state/ChartStore.js';
import { Logger } from './utils/Logger.js';

// Initialize Global Bindings (for HTML onclick handlers)
GlobalBridge.init();

// Initialize Application on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
    Logger.debug('🏁 Bootstrapping RetireFire...');
    AppController.init();
});

// Vite HMR Cleanups
if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        Logger.debug('Vite HMR: Cleaning up charts...');
        destroyAllCharts();
    });
}