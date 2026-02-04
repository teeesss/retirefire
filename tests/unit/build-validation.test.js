/**
 * Build Validation Tests
 * Ensures the build output is correct and complete
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Build Validation', () => {
    describe('HTML Partials Integrity', () => {
        it('should not have closing body/html tags in partials', () => {
            const partials = [
                'src/partials/header.html',
                'src/partials/sidebar.html',
                'src/partials/dashboard-metrics.html',
                'src/partials/comprehensive-metrics.html',
                'src/partials/footer.html',
                'src/partials/settings-and-modals.html'
            ];

            partials.forEach(partial => {
                const content = readFileSync(resolve(partial), 'utf-8');

                // Check for closing body tag
                expect(content).not.toMatch(/<\/body>/i,
                    `${partial} should not contain </body> tag`);

                // Check for closing html tag
                expect(content).not.toMatch(/<\/html>/i,
                    `${partial} should not contain </html> tag`);
            });
        });

        it('should not have duplicate script tags in partials', () => {
            const partials = [
                'src/partials/settings-and-modals.html'
            ];

            partials.forEach(partial => {
                const content = readFileSync(resolve(partial), 'utf-8');

                // Check for script tag with src="/src/main.js"
                expect(content).not.toMatch(/<script[^>]*src="(?:\/)?src\/main\.js"/i,
                    `${partial} should not contain main.js script tag (should only be in index.html)`);
            });
        });

        it('should not have DOCTYPE in partials', () => {
            const partials = [
                'src/partials/header.html',
                'src/partials/sidebar.html',
                'src/partials/dashboard-metrics.html',
                'src/partials/comprehensive-metrics.html',
                'src/partials/footer.html',
                'src/partials/settings-and-modals.html'
            ];

            partials.forEach(partial => {
                const content = readFileSync(resolve(partial), 'utf-8');

                expect(content).not.toMatch(/<!DOCTYPE/i,
                    `${partial} should not contain DOCTYPE declaration`);
            });
        });


    });

    describe('Main index.html Structure', () => {
        it('should have exactly one script tag for main.js', () => {
            const content = readFileSync(resolve('index.html'), 'utf-8');
            const scriptMatches = content.match(/<script[^>]*src="(?:\/)?src\/main\.js"/gi);

            expect(scriptMatches).not.toBeNull();
            expect(scriptMatches?.length).toBe(1);
        });

        it('should have script tag after all load tags', () => {
            const content = readFileSync(resolve('index.html'), 'utf-8');

            const lastLoadIndex = content.lastIndexOf('<load src=');
            const scriptIndex = content.indexOf('<script type="module" src="src/main.js"');

            expect(scriptIndex).toBeGreaterThan(lastLoadIndex,
                'Script tag should come after all <load> tags');
        });

        it('should have exactly one closing body tag', () => {
            const content = readFileSync(resolve('index.html'), 'utf-8');
            const bodyMatches = content.match(/<\/body>/gi);

            expect(bodyMatches).not.toBeNull();
            expect(bodyMatches?.length).toBe(1);
        });

        it('should have exactly one closing html tag', () => {
            const content = readFileSync(resolve('index.html'), 'utf-8');
            const htmlMatches = content.match(/<\/html>/gi);

            expect(htmlMatches).not.toBeNull();
            expect(htmlMatches?.length).toBe(1);
        });
    });

    describe('Built Output Validation', () => {
        it('should have script tag in built index.html', () => {
            let content;
            try {
                content = readFileSync(resolve('dist/index.html'), 'utf-8');
            } catch {
                console.warn('dist/index.html not found - run npm run build first');
                return;
            }

            // Check for script tag (will be hashed in production)
            expect(content).toMatch(/<script[^>]*src="[^"]*main[^"]*\.js"/i,
                'Built index.html should contain main.js script tag');
        });

        it('should have only one closing body tag in built output', () => {
            let content;
            try {
                content = readFileSync(resolve('dist/index.html'), 'utf-8');
            } catch {
                console.warn('dist/index.html not found - run npm run build first');
                return;
            }

            const bodyMatches = content.match(/<\/body>/gi);
            expect(bodyMatches?.length).toBe(1,
                'Built index.html should have exactly one </body> tag');
        });

        it('should have only one closing html tag in built output', () => {
            let content;
            try {
                content = readFileSync(resolve('dist/index.html'), 'utf-8');
            } catch {
                console.warn('dist/index.html not found - run npm run build first');
                return;
            }

            const htmlMatches = content.match(/<\/html>/gi);
            expect(htmlMatches?.length).toBe(1,
                'Built index.html should have exactly one </html> tag');
        });

        it('should be larger than 100KB (confirms partials were injected)', () => {
            let content;
            try {
                content = readFileSync(resolve('dist/index.html'), 'utf-8');
            } catch {
                console.warn('dist/index.html not found - run npm run build first');
                return;
            }

            const sizeKB = Buffer.byteLength(content, 'utf-8') / 1024;
            expect(sizeKB).toBeGreaterThan(100,
                'Built index.html should be >100KB (source is ~2KB, built should be ~185KB)');
        });
    });
});
