import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const mdPath = path.resolve('reports', 'live-schema-inventory.md');
const htmlPath = path.resolve('reports', 'temp-schema-inventory.html');
const pdfPath = path.resolve('reports', 'live-schema-inventory.pdf');

console.log('Reading markdown from:', mdPath);
const mdContent = fs.readFileSync(mdPath, 'utf8');

// Convert markdown to HTML using marked CLI
console.log('Converting Markdown to HTML with marked...');
const htmlBody = execSync('npx --no-install marked', {
  input: mdContent,
  encoding: 'utf8',
  maxBuffer: 10 * 1024 * 1024,
});

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ArenaAI - Live Supabase Schema Inventory</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

    @page {
      size: A4;
      margin: 16mm 14mm 16mm 14mm;
      @bottom-right {
        content: counter(page);
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        color: #64748b;
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.5;
      font-size: 9.5pt;
      margin: 0;
      padding: 0;
    }

    /* Cover / Header section */
    h1 {
      font-size: 20pt;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 2.5px solid #2563eb;
      padding-bottom: 8px;
      margin-top: 0;
      margin-bottom: 8px;
      letter-spacing: -0.02em;
    }

    p {
      margin-top: 4px;
      margin-bottom: 12px;
      color: #475569;
    }

    h2 {
      font-size: 14pt;
      font-weight: 600;
      color: #1e293b;
      margin-top: 24px;
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e2e8f0;
      page-break-after: avoid;
      break-after: avoid;
    }

    h3 {
      font-size: 11.5pt;
      font-weight: 600;
      color: #1d4ed8;
      background: #eff6ff;
      border-left: 4px solid #2563eb;
      padding: 6px 10px;
      margin-top: 22px;
      margin-bottom: 8px;
      border-radius: 0 4px 4px 0;
      page-break-after: avoid;
      break-after: avoid;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      margin-bottom: 16px;
      font-size: 8.5pt;
      page-break-inside: auto;
      break-inside: auto;
    }

    tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    th {
      background-color: #f1f5f9;
      color: #334155;
      font-weight: 600;
      text-align: left;
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
      font-size: 8.5pt;
      white-space: nowrap;
    }

    td {
      padding: 5px 8px;
      border: 1px solid #e2e8f0;
      color: #1e293b;
      vertical-align: top;
      word-break: break-word;
    }

    tr:nth-child(even) td {
      background-color: #f8fafc;
    }

    /* Monospace / Code pills */
    code {
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
      font-size: 8pt;
      background: #f1f5f9;
      color: #0f172a;
      padding: 1.5px 4px;
      border-radius: 3px;
      border: 1px solid #e2e8f0;
    }

    /* Advisory Callout Block */
    blockquote {
      margin: 12px 0;
      padding: 10px 14px;
      background: #ecfdf5;
      border-left: 4px solid #10b981;
      border-radius: 0 6px 6px 0;
      color: #065f46;
      font-size: 9pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    blockquote p {
      margin: 0;
      color: #065f46;
    }

    strong {
      color: #0f172a;
      font-weight: 600;
    }

    /* Specific column alignments in markdown tables */
    th:nth-child(2), td:nth-child(2) {
      font-weight: 500;
    }

    /* Foreign keys section */
    p > strong {
      display: inline-block;
      margin-top: 8px;
      color: #475569;
    }
  </style>
</head>
<body>
  ${htmlBody}
</body>
</html>`;

fs.writeFileSync(htmlPath, fullHtml, 'utf8');
console.log('Generated styled HTML at:', htmlPath);

// Find Chrome or Edge
const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];

const browserExe = chromePaths.find(p => fs.existsSync(p));
if (!browserExe) {
  console.error('Neither Google Chrome nor Microsoft Edge was found!');
  process.exit(1);
}

console.log('Using browser binary:', browserExe);
console.log('Printing to PDF...');

const cmd = `"${browserExe}" --headless --disable-gpu --run-all-compositor-stages-before-draw --no-pdf-header-footer --print-to-pdf="${pdfPath}" "file:///${htmlPath.replace(/\\\\/g, '/')}"`;

execSync(cmd, { stdio: 'inherit' });

console.log('Successfully generated PDF at:', pdfPath);

const stats = fs.statSync(pdfPath);
console.log(`PDF file size: ${(stats.size / 1024).toFixed(1)} KB`);
