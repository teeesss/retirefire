import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.js'],
        exclude: ['node_modules', 'dist', 'tests/e2e/settings.test.js'],
        testTimeout: 30000,
        hookTimeout: 30000,
        pool: 'threads',
        poolOptions: {
            threads: {
                singleThread: false,
                isolate: true
            }
        },
        maxConcurrency: 1,
        fileParallelism: false,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'tests/',
                'dist/',
                '*.config.js'
            ]
        }
    }
});
