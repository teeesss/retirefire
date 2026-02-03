import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (file === 'node_modules' || file === '.git' || file === 'dist' || file === '.idea' || file === '.vscode' || file === 'coverage' || file === 'playwright-report' || file === 'test-results' || file === 'text-validation.test.js' || file === '.agent' || file === 'ISSUE_RESOLUTION.md') return;

        // Exclude historical docs directory
        if (dirPath.includes('docs') && dirPath.includes('completed')) return;

        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
            // Only check JS, HTML, MD files
            if (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.md')) {
                arrayOfFiles.push(fullPath);
            }
        }
    });

    return arrayOfFiles;
}

describe('Text Validation Scan', () => {
    const rootDir = path.resolve(__dirname, '../../');
    const files = getAllFiles(rootDir, []);

    console.log(`Scanning ${files.length} files for corrupted text...`);

    // Patterns to look for
    const badPatterns = [
        'âœ', // Garbled encoding
        'Ã©', // Garbled accents
        'ï»¿', // BOM
        'undefined undefined', // JS string template error
        '[object Object]', // JS string conversion error
        // 'NaN', // DISABLED: Too many false positives in documentation
        // 'null', // DISABLED: Too many false positives in documentation
        'PLACEHOLDER_', // Template placeholders left behind
        'ΓÜû∩╕Å', // Garbled Warning Emoji ⚠️
        'ΓÜá∩╕Å', // Garbled Alert Emoji 
        '≡ƒÅ¢∩╕Å', // Garbled Icon
        '≡ƒë', // Garbled generic
        'â€™', // Garbled apostrophe
        '≡ƒ', // Generic "Mojibake" start
        'ΓÜ', // Generic "Mojibake" start
        '├ó┼ô', // Corrupted UTF-8
        '╬ô├£├╗Γê⌐Γòò├à' // Corrupted characters finding
    ];

    files.forEach(file => {
        it(`should not contain erroneous text in ${path.basename(file)}`, () => {
            const content = fs.readFileSync(file, 'utf8');

            badPatterns.forEach(pattern => {
                // Skip 'null' and 'NaN' checks in JS code files as they are valid keywords
                if ((pattern === 'null' || pattern === 'NaN') && file.endsWith('.js')) return;

                const match = content.includes(pattern);
                if (match) {
                    // Get line number for better debugging
                    const lines = content.split('\n');
                    lines.forEach((line, idx) => {
                        if (line.includes(pattern)) {
                            console.error(`Found "${pattern}" in ${path.basename(file)}:${idx + 1}`);
                        }
                    });
                }
                expect(match, `Found erroneous text "${pattern}" in ${path.basename(file)}`).toBe(false);
            });
        });
    });
});
