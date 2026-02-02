import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SecureStorage } from '../../src/utils/SecureStorage.js';

// Mock localStorage for Node.js environment
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();

global.localStorage = localStorageMock;

describe('SecureStorage', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
    });

    describe('Encryption and Decryption', () => {
        it('should encrypt data before storing', () => {
            const testData = {
                income: 150000,
                netWorth: 500000,
                ssn: '123-45-6789' // Sensitive data
            };

            SecureStorage.save(testData);

            const raw = localStorage.getItem('retirementPlannerConfig');
            expect(raw).toBeTruthy();

            // Verify data is encrypted (not plaintext)
            expect(raw).not.toContain('150000');
            expect(raw).not.toContain('500000');
            expect(raw).not.toContain('123-45-6789');
            expect(raw).not.toContain('income');
            expect(raw).not.toContain('netWorth');
        });

        it('should decrypt data correctly', () => {
            const testData = {
                income: 150000,
                netWorth: 500000,
                name: 'Test User'
            };

            SecureStorage.save(testData);
            const loaded = SecureStorage.load();

            expect(loaded).toEqual(testData);
            expect(loaded.income).toBe(150000);
            expect(loaded.netWorth).toBe(500000);
            expect(loaded.name).toBe('Test User');
        });

        it('should handle complex nested objects', () => {
            const complexData = {
                settings: {
                    personal: {
                        age: 45,
                        retireAge: 65,
                        spouse: {
                            age: 43,
                            retireAge: 65
                        }
                    },
                    income: {
                        salary: 150000,
                        bonuses: [10000, 15000, 20000]
                    }
                },
                goals: [
                    { name: 'Vacation Home', target: 500000 },
                    { name: 'College Fund', target: 200000 }
                ]
            };

            SecureStorage.save(complexData);
            const loaded = SecureStorage.load();

            expect(loaded).toEqual(complexData);
            expect(loaded.settings.personal.spouse.age).toBe(43);
            expect(loaded.settings.income.bonuses).toEqual([10000, 15000, 20000]);
            expect(loaded.goals[1].target).toBe(200000);
        });
    });

    describe('Error Handling', () => {
        it('should return null if no data exists', () => {
            const loaded = SecureStorage.load();
            expect(loaded).toBeNull();
        });

        it('should return null if decryption fails', () => {
            // Manually set corrupted encrypted data
            localStorage.setItem('retirementPlannerConfig', 'corrupted-data-not-encrypted');

            const loaded = SecureStorage.load();
            expect(loaded).toBeNull();
        });

        it('should handle invalid JSON gracefully', () => {
            // This shouldn't happen with encryption, but test defensive coding
            localStorage.setItem('retirementPlannerConfig', 'U2FsdGVkX1+invalid');

            const loaded = SecureStorage.load();
            expect(loaded).toBeNull();
        });
    });

    describe('Storage Size Management', () => {
        it('should calculate storage size correctly', () => {
            const testData = { test: 'data' };
            SecureStorage.save(testData);

            const size = SecureStorage.getStorageSize();
            expect(size).toBeGreaterThan(0);
            expect(size).toBeLessThan(1); // Small data should be < 1KB
        });

        it('should detect when approaching quota', () => {
            const smallData = { test: 'small' };
            SecureStorage.save(smallData);

            expect(SecureStorage.isApproachingQuota()).toBe(false);
        });

        it('should warn about large data', () => {
            // Create large data object (> 4MB)
            const largeArray = new Array(500000).fill('x'.repeat(10));
            const largeData = { bigArray: largeArray };

            // This should trigger a warning but still save
            const consoleSpy = vi.spyOn(console, 'warn');
            SecureStorage.save(largeData);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Large data detected')
            );
        });
    });

    describe('Data Compression', () => {
        it('should compress data by removing rawData', () => {
            const dataWithRaw = {
                settings: { age: 45 },
                rawData: {
                    years: new Array(45).fill(0),
                    netWorths: new Array(45).fill(1000000)
                }
            };

            const compressed = SecureStorage.compressData(dataWithRaw);

            expect(compressed.settings).toBeDefined();
            expect(compressed.rawData).toBeUndefined();
        });

        it('should remove cached/computed values', () => {
            const dataWithCache = {
                settings: {
                    age: 45,
                    _cache: { computed: 'value' },
                    _computed: { temp: 'data' }
                }
            };

            const compressed = SecureStorage.compressData(dataWithCache);

            expect(compressed.settings.age).toBe(45);
            expect(compressed.settings._cache).toBeUndefined();
            expect(compressed.settings._computed).toBeUndefined();
        });
    });

    describe('Clear Functionality', () => {
        it('should clear stored data', () => {
            const testData = { test: 'data' };
            SecureStorage.save(testData);

            expect(localStorage.getItem('retirementPlannerConfig')).toBeTruthy();

            SecureStorage.clear();

            expect(localStorage.getItem('retirementPlannerConfig')).toBeNull();
        });
    });

    describe('Migration from Plaintext', () => {
        it('should migrate plaintext data to encrypted', () => {
            const plaintextData = { income: 100000, age: 45 };
            localStorage.setItem('retirementPlannerConfig_plaintext', JSON.stringify(plaintextData));

            const migrated = SecureStorage.migrateFromPlaintext();

            expect(migrated).toBe(true);
            expect(localStorage.getItem('retirementPlannerConfig_plaintext')).toBeNull();

            const loaded = SecureStorage.load();
            expect(loaded).toEqual(plaintextData);
        });

        it('should return false if no plaintext data exists', () => {
            const migrated = SecureStorage.migrateFromPlaintext();
            expect(migrated).toBe(false);
        });

        it('should handle migration errors gracefully', () => {
            localStorage.setItem('retirementPlannerConfig_plaintext', 'invalid-json');

            const migrated = SecureStorage.migrateFromPlaintext();
            expect(migrated).toBe(false);
        });
    });

    describe('XSS Protection', () => {
        it('should safely store and retrieve data with special characters', () => {
            const dataWithSpecialChars = {
                name: '<script>alert("XSS")</script>',
                description: 'Test & <b>bold</b>',
                goal: '"><img src=x onerror=alert(1)>'
            };

            SecureStorage.save(dataWithSpecialChars);
            const loaded = SecureStorage.load();

            // Data should be preserved exactly as-is (encryption handles it)
            expect(loaded).toEqual(dataWithSpecialChars);

            // Verify it's not stored as plaintext
            const raw = localStorage.getItem('retirementPlannerConfig');
            expect(raw).not.toContain('<script>');
            expect(raw).not.toContain('alert');
        });
    });

    describe('Concurrent Save Protection', () => {
        it('should handle rapid successive saves', async () => {
            const data1 = { version: 1 };
            const data2 = { version: 2 };
            const data3 = { version: 3 };

            SecureStorage.save(data1);
            SecureStorage.save(data2);
            SecureStorage.save(data3);

            const loaded = SecureStorage.load();
            expect(loaded.version).toBe(3); // Last save wins
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty object', () => {
            SecureStorage.save({});
            const loaded = SecureStorage.load();
            expect(loaded).toEqual({});
        });

        it('should handle null values in data', () => {
            const dataWithNull = { value: null, nested: { also: null } };
            SecureStorage.save(dataWithNull);
            const loaded = SecureStorage.load();
            expect(loaded).toEqual(dataWithNull);
        });

        it('should handle arrays', () => {
            const arrayData = { items: [1, 2, 3, 'four', { five: 5 }] };
            SecureStorage.save(arrayData);
            const loaded = SecureStorage.load();
            expect(loaded).toEqual(arrayData);
        });

        it('should handle boolean values', () => {
            const boolData = { enabled: true, disabled: false };
            SecureStorage.save(boolData);
            const loaded = SecureStorage.load();
            expect(loaded).toEqual(boolData);
        });

        it('should handle very large numbers', () => {
            const bigNumbers = {
                large: 999999999999,
                negative: -999999999999,
                decimal: 123456.789012
            };
            SecureStorage.save(bigNumbers);
            const loaded = SecureStorage.load();
            expect(loaded).toEqual(bigNumbers);
        });
    });
});
