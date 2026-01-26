import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            // Only check JS, HTML, MD files
            if (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.md')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
}

describe('Text Validation Scan', () => {
    // Files to ignore (binaries, node_modules handled by test runner exclusion if needed, but here we scan src)
    const srcDir = path.resolve(__dirname, '../../src');
    const files = getAllFiles(srcDir, []);

    // Patterns to look for
    const badPatterns = [
        'âœ', // Garbled encoding
        'Ã©', // Garbled accents
        'ï»¿', // BOM
        'undefined undefined', // JS string template error
        '[object Object]', // JS string conversion error
        'NaN', // Calculation error visible in text
        'null', // Null string output
        'PLACEHOLDER_', // Template placeholders left behind
        'ΓÜû∩╕Å', // Garbled Warning Emoji ⚠️
        'ΓÜá∩╕Å', // Garbled Alert Emoji 
        '≡ƒÅ¢∩╕Å', // Garbled Icon
        '≡ƒë', // Garbled generic
        'â€™', // Garbled apostrophe
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
