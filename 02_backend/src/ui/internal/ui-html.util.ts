import * as fs from 'fs';

export function readHtml(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

export function injectWindowData(html: string, data: any | null | undefined): string {
  if (data === null || data === undefined) {
    return html;
  }
  const scriptTag = `<script>window.__DATA__ = ${JSON.stringify(data)};</script>`;
  if (html.includes('</head>')) {
    return html.replace('</head>', `${scriptTag}\n</head>`);
  }
  return html + `\n${scriptTag}\n`;
}

