import * as fs from "fs";

export function readPublicHtml(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}

export function injectPublicWindowData(
  html: string,
  data: any | null | undefined,
): string {
  if (data === null || data === undefined) {
    return html;
  }

  const scriptTag = `<script>window.__DATA__ = ${JSON.stringify(data)};</script>`;
  if (html.includes("</head>")) {
    return html.replace("</head>", `${scriptTag}\n</head>`);
  }
  return html + `\n${scriptTag}\n`;
}
