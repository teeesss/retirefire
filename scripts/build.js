const fs = require('fs');
const path = require('path');

function build() {
    const distPath = path.join(__dirname, '../dist');
    const sourceFile = path.join(__dirname, '../index.html');
    const targetFile = path.join(distPath, 'index.html');

    if (!fs.existsSync(distPath)) {
        fs.mkdirSync(distPath, { recursive: true });
    }

    fs.copyFileSync(sourceFile, targetFile);
    console.log(`Build complete: ${sourceFile} -> ${targetFile}`);
}

build();
