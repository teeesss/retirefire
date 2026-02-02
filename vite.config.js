import { defineConfig } from 'vite';
import htmlInject from 'vite-plugin-html-inject';

export default defineConfig({
    plugins: [htmlInject()],
    base: './',
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: 'index.html',
            },
        },
    },
    server: {
        open: true,
    },
    test: {
        exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**'],
        environment: 'jsdom'
    }
});
