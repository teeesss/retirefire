import { config } from '../data/Config.js';
import { formatCurrency } from '../utils/Formatters.js';

export class CryptoHandler {
    static async syncPrices() {
        // console.log('🔄 Syncing Crypto Prices...');
        const prices = { BTC: 93000, ETH: 3200, SOL: 130 };

        try {
            const fetchPrice = async (ticker) => {
                const response = await fetch(`https://api.coinbase.com/v2/prices/${ticker}-USD/spot`);
                const data = await response.json();
                return parseFloat(data.data.amount);
            };

            prices.BTC = await fetchPrice('BTC');
            prices.ETH = await fetchPrice('ETH');
            prices.SOL = await fetchPrice('SOL');
            console.log('✅ Prices Sync Success:', prices);
        } catch (e) {
            console.warn('⚠️ Coinbase API sync failed, using defaults.', e);
        }

        config.cryptoPrices = prices;
        this.updateTotal();
        this.updateLabels(prices);

        return prices;
    }

    static updateTotal() {
        const p = config.cryptoPrices;
        const s = config.settings.assets;
        const total = (s.btc * p.BTC) + (s.eth * p.ETH) + (s.sol * p.SOL);

        const el = document.getElementById('inputCrypto');
        if (el) el.value = Math.round(total);
    }

    static updateLabels(prices) {
        const btcLab = document.getElementById('btcPriceLabel');
        const ethLab = document.getElementById('ethPriceLabel');
        const solLab = document.getElementById('solPriceLabel');

        if (btcLab) btcLab.textContent = 'Price: ' + formatCurrency(prices.BTC, false);
        if (ethLab) ethLab.textContent = 'Price: ' + formatCurrency(prices.ETH, false);
        if (solLab) solLab.textContent = 'Price: ' + formatCurrency(prices.SOL, false);
    }
}
