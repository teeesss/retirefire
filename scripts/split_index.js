const fs = require('fs');

// Read file
const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split(/\r?\n/); // Handle CRLF or LF

// Line numbers from Select-String (1-based)
// <style> starts at 13 (implied from view)
// </style> at 2518
// <script> at 5278

const cssStartLine = 13; // 1-based, points to <style>
const cssEndLine = 2518; // 1-based, points to </style>
const jsStartLine = 5278; // 1-based, points to <script>

// Extract CSS (exclude <style> tags)
// Slice indices are 0-based.
// Start index: cssStartLine (line 14) -> index 13
// End index: cssEndLine - 1 (line 2517) -> index 2517 (slice excludes end)
const cssLines = lines.slice(cssStartLine, cssEndLine - 1);
const tailwindDirectives = "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n";
fs.writeFileSync('src/style.css', tailwindDirectives + cssLines.join('\n'));

// Extract JS
// Start index: jsStartLine (line 5279) -> index 5278
// Check if last line is </script> or </html>
// We'll just take until end and user can clean up the suffix if needed, or I check last lines.
// Assuming last few lines are </script></body></html>
const jsLines = lines.slice(jsStartLine);
// Remove last few lines if they are closing tags.
// I'll trim from the end in the script logic below.
while (jsLines.length > 0 && (jsLines[jsLines.length - 1].includes('</script>') || jsLines[jsLines.length - 1].includes('</body>') || jsLines[jsLines.length - 1].includes('</html>') || jsLines[jsLines.length - 1].trim() === '')) {
    jsLines.pop();
}

fs.writeFileSync('src/main.js', "import './style.css';\n\n" + jsLines.join('\n'));

// Extract HTML
// Head: 0 to cssStartLine - 1 (index 12)
// Body: cssEndLine (index 2518) to jsStartLine - 1 (index 5277)
const headLines = lines.slice(0, cssStartLine - 1);
const bodyLines = lines.slice(cssEndLine, jsStartLine - 1);

const newHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Retirement Financial Planner Pro - Comprehensive Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
</head>
<body>
${bodyLines.join('\n')}
    <script type="module" src="/src/main.js"></script>
</body>
</html>`;

fs.writeFileSync('index_vite.html', newHtml);

console.log("Split complete!");
