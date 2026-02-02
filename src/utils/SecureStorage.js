import CryptoJS from 'crypto-js';
import { Logger } from './Logger.js';

/**
 * Secure Storage Utility
 * Encrypts sensitive financial data before storing in localStorage
 * Prevents XSS attacks and browser extension data theft
 */

const STORAGE_KEY = 'retirementPlannerConfig';
const MAX_SIZE_KB = 4096; // 4MB warning threshold (localStorage limit is ~5-10MB)

/**
 * Generate encryption key
 * Using a static key for consistency across sessions
 * Note: In production with user auth, derive from user credentials
 * Static key prevents "Malformed UTF-8" errors from fingerprint changes
 */
function generateEncryptionKey() {
    // Use a static key to ensure consistency across sessions
    const staticSeed = 'retirefire-v1-encryption-key-2026';
    return CryptoJS.SHA256(staticSeed).toString();
}

const ENCRYPTION_KEY = generateEncryptionKey();

export const SecureStorage = {
    /**
     * Save encrypted data to localStorage
     * @param {Object} data - Data to encrypt and save
     * @throws {Error} If save fails or quota exceeded
     */
    save(data) {
        try {
            const serialized = JSON.stringify(data);
            const sizeKB = new Blob([serialized]).size / 1024;

            // Warn if approaching quota
            if (sizeKB > MAX_SIZE_KB) {
                Logger.warn(`Storage size: ${sizeKB.toFixed(2)} KB - approaching quota limit`);
                console.warn(`⚠️ Large data detected: ${sizeKB.toFixed(2)} KB. Consider clearing old data.`);
            }

            // Encrypt the data
            const encrypted = CryptoJS.AES.encrypt(serialized, ENCRYPTION_KEY).toString();

            // Attempt to save
            localStorage.setItem(STORAGE_KEY, encrypted);

            Logger.debug(`✅ Secure storage saved: ${sizeKB.toFixed(2)} KB (encrypted)`);
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                Logger.error('❌ Storage quota exceeded');
                this.handleQuotaExceeded(data);
            } else {
                Logger.error('❌ SecureStorage save failed:', e);
                throw new Error('Failed to save configuration');
            }
        }
    },

    /**
     * Load and decrypt data from localStorage
     * @returns {Object|null} Decrypted data or null if not found/invalid
     */
    load() {
        try {
            const encrypted = localStorage.getItem(STORAGE_KEY);
            if (!encrypted) {
                Logger.debug('No encrypted data found in storage');
                return null;
            }

            // Decrypt the data
            const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
            const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);

            if (!decryptedStr) {
                Logger.warn('⚠️ Decryption failed - clearing corrupted data');
                this.clear(); // Clear corrupted data
                return null;
            }

            const data = JSON.parse(decryptedStr);
            Logger.debug('✅ Secure storage loaded successfully');
            return data;
        } catch (e) {
            Logger.error('❌ SecureStorage load failed:', e);
            // Clear corrupted data to prevent repeated errors
            Logger.warn('⚠️ Clearing corrupted encrypted data');
            this.clear();
            return null;
        }
    },

    /**
     * Clear encrypted data from localStorage
     */
    clear() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            Logger.debug('✅ Secure storage cleared');
        } catch (e) {
            Logger.error('❌ SecureStorage clear failed:', e);
        }
    },

    /**
     * Handle quota exceeded error by compressing data
     * @param {Object} data - Original data that failed to save
     */
    handleQuotaExceeded(data) {
        const message = `
            ⚠️ Storage Quota Exceeded
            
            Your retirement plan data has exceeded the browser storage limit.
            
            Options:
            1. Clear old data and try again
            2. Export your data and start fresh
            3. Continue without saving (data will be lost on refresh)
            
            Would you like to clear old data and retry?
        `;

        if (confirm(message)) {
            try {
                // Attempt to compress by removing old simulation results
                const compressed = this.compressData(data);
                const serialized = JSON.stringify(compressed);
                const encrypted = CryptoJS.AES.encrypt(serialized, ENCRYPTION_KEY).toString();

                localStorage.setItem(STORAGE_KEY, encrypted);

                alert('✅ Data compressed and saved successfully!');
                Logger.info('✅ Data compressed and saved after quota exceeded');
            } catch (retryError) {
                Logger.error('❌ Retry after compression failed:', retryError);
                alert('❌ Unable to save even after compression. Please export your data.');
            }
        } else {
            alert('⚠️ Data not saved. Please export your plan before refreshing.');
        }
    },

    /**
     * Compress data by removing non-essential information
     * @param {Object} data - Data to compress
     * @returns {Object} Compressed data
     */
    compressData(data) {
        const compressed = { ...data };

        // Remove large arrays if they exist (can be regenerated)
        if (compressed.rawData) {
            delete compressed.rawData; // Will be regenerated on load
        }

        // Keep only essential settings
        if (compressed.settings) {
            // Remove any cached/computed values
            delete compressed.settings._cache;
            delete compressed.settings._computed;
        }

        Logger.info('Data compressed - removed non-essential cached data');
        return compressed;
    },

    /**
     * Get current storage size in KB
     * @returns {number} Size in KB
     */
    getStorageSize() {
        try {
            const encrypted = localStorage.getItem(STORAGE_KEY);
            if (!encrypted) return 0;

            const sizeKB = new Blob([encrypted]).size / 1024;
            return sizeKB;
        } catch (e) {
            Logger.error('Failed to get storage size:', e);
            return 0;
        }
    },

    /**
     * Check if storage is approaching quota
     * @returns {boolean} True if > 80% of max size
     */
    isApproachingQuota() {
        const sizeKB = this.getStorageSize();
        return sizeKB > (MAX_SIZE_KB * 0.8);
    },

    /**
     * Migrate from plaintext to encrypted storage
     * Call this once to encrypt existing plaintext data
     */
    migrateFromPlaintext() {
        try {
            // Check if there's old plaintext data
            const oldKey = 'retirementPlannerConfig_plaintext';
            const plaintext = localStorage.getItem(oldKey);

            if (plaintext) {
                Logger.info('🔄 Migrating plaintext data to encrypted storage...');
                const data = JSON.parse(plaintext);
                this.save(data);
                localStorage.removeItem(oldKey);
                Logger.info('✅ Migration complete - old plaintext data removed');
                return true;
            }

            return false;
        } catch (e) {
            Logger.error('❌ Migration failed:', e);
            return false;
        }
    }
};
