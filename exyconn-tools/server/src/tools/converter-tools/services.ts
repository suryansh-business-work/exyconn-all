import axios from "axios";
import * as cheerio from "cheerio";
import TurndownService from "turndown";
import mammoth from "mammoth";

// Initialize Turndown for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "_",
  strongDelimiter: "**",
});

// Add rules for better conversion
turndownService.addRule("strikethrough", {
  filter: ["del", "s", "strike"],
  replacement: (content) => `~~${content}~~`,
});

/**
 * Convert CSV to Markdown table
 */
export function csvToMarkdown(
  csvContent: string,
  hasHeader: boolean = true,
): string {
  const lines = csvContent.trim().split("\n");
  if (lines.length === 0) return "";

  const rows = lines.map((line) => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        cells.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    return cells;
  });

  if (rows.length === 0) return "";

  const maxCols = Math.max(...rows.map((r) => r.length));
  const normalizedRows = rows.map((r) => {
    while (r.length < maxCols) r.push("");
    return r;
  });

  let markdown = "";
  const header = hasHeader
    ? normalizedRows[0]
    : normalizedRows[0].map((_, i) => `Column ${i + 1}`);
  const dataRows = hasHeader ? normalizedRows.slice(1) : normalizedRows;

  markdown += "| " + header.join(" | ") + " |\n";
  markdown += "| " + header.map(() => "---").join(" | ") + " |\n";

  for (const row of dataRows) {
    markdown += "| " + row.join(" | ") + " |\n";
  }

  return markdown;
}

/**
 * Convert JSON to Markdown
 */
export function jsonToMarkdown(
  jsonContent: string,
  indent: number = 0,
): string {
  const data = JSON.parse(jsonContent);
  return convertJsonValue(data, indent);
}

function convertJsonValue(value: unknown, indent: number = 0): string {
  const prefix = "  ".repeat(indent);

  if (value === null) return `${prefix}\`null\`\n`;
  if (typeof value === "undefined") return `${prefix}\`undefined\`\n`;
  if (typeof value === "boolean") return `${prefix}\`${value}\`\n`;
  if (typeof value === "number") return `${prefix}\`${value}\`\n`;
  if (typeof value === "string") return `${prefix}${value}\n`;

  if (Array.isArray(value)) {
    if (value.length === 0) return `${prefix}*(empty array)*\n`;

    // Check if array of objects with same keys - render as table
    if (
      value.every(
        (item) =>
          typeof item === "object" && item !== null && !Array.isArray(item),
      )
    ) {
      const keys = [
        ...new Set(
          value.flatMap((item) => Object.keys(item as Record<string, unknown>)),
        ),
      ];
      if (keys.length > 0 && keys.length <= 10) {
        let table = `${prefix}| ${keys.join(" | ")} |\n`;
        table += `${prefix}| ${keys.map(() => "---").join(" | ")} |\n`;
        for (const item of value) {
          const row = keys.map((k) => {
            const v = (item as Record<string, unknown>)[k];
            return v === undefined ? "" : String(v);
          });
          table += `${prefix}| ${row.join(" | ")} |\n`;
        }
        return table;
      }
    }

    let md = "";
    value.forEach((item, i) => {
      md += `${prefix}- **Item ${i + 1}**\n`;
      md += convertJsonValue(item, indent + 1);
    });
    return md;
  }

  if (typeof value === "object") {
    let md = "";
    const obj = value as Record<string, unknown>;
    for (const [key, val] of Object.entries(obj)) {
      if (typeof val === "object" && val !== null) {
        md += `${prefix}### ${key}\n\n`;
        md += convertJsonValue(val, indent);
      } else {
        md += `${prefix}- **${key}**: ${val}\n`;
      }
    }
    return md;
  }

  return `${prefix}${String(value)}\n`;
}

/**
 * Convert HTML to Markdown
 */
export function htmlToMarkdown(htmlContent: string): string {
  // Clean up HTML before conversion
  const $ = cheerio.load(htmlContent);

  // Remove scripts and styles
  $("script, style, noscript").remove();

  // Get body or full content
  const body = $("body").html() || $.html();

  return turndownService.turndown(body);
}

/**
 * Convert webpage URL to Markdown
 */
export async function webpageToMarkdown(
  url: string,
): Promise<{ markdown: string; title: string }> {
  const response = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; MarkdownConverter/1.0)",
    },
    timeout: 30000,
  });

  const $ = cheerio.load(response.data);

  // Remove unwanted elements
  $(
    "script, style, noscript, nav, footer, header, aside, .sidebar, .menu, .advertisement, .ad, #comments",
  ).remove();

  // Get title
  const title =
    $("title").text().trim() || $("h1").first().text().trim() || "Untitled";

  // Get main content
  const mainContent =
    $("main").html() ||
    $("article").html() ||
    $('[role="main"]').html() ||
    $("body").html() ||
    "";

  const markdown = turndownService.turndown(mainContent);

  return { markdown: `# ${title}\n\n${markdown}`, title };
}

/**
 * Convert DOCX buffer to Markdown
 */
export async function docxToMarkdown(buffer: Buffer): Promise<string> {
  const result = await mammoth.convertToHtml({ buffer });
  return turndownService.turndown(result.value);
}

/**
 * Convert RTF to Markdown (basic conversion)
 */
export function rtfToMarkdown(rtfContent: string): string {
  // Basic RTF to text conversion
  let text = rtfContent;

  // Remove RTF header
  text = text.replace(/^\{\\rtf1[^}]*\}/gm, "");

  // Remove control words
  text = text.replace(/\\[a-z]+\d*\s?/gi, "");

  // Remove braces
  text = text.replace(/[{}]/g, "");

  // Convert common RTF formatting
  text = text.replace(/\\par\s*/g, "\n\n");
  text = text.replace(/\\line\s*/g, "\n");
  text = text.replace(/\\tab\s*/g, "\t");

  // Clean up special characters
  text = text.replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );

  // Clean up whitespace
  text = text
    .split("\n")
    .map((line) => line.trim())
    .join("\n");
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

/**
 * Convert XML to Markdown
 */
export function xmlToMarkdown(xmlContent: string): string {
  const $ = cheerio.load(xmlContent, { xmlMode: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function processNode(node: any, depth: number = 0): string {
    if (node.type === "text") {
      const text = node.data?.trim();
      return text ? text + "\n" : "";
    }

    if (node.type === "tag") {
      const el = node;
      const tagName = el.name;
      const prefix = "  ".repeat(depth);
      let md = "";

      // Add heading for tag
      if (depth === 0) {
        md += `## ${tagName}\n\n`;
      } else {
        md += `${prefix}- **${tagName}**`;
      }

      // Add attributes
      const attrs = el.attribs;
      if (Object.keys(attrs).length > 0) {
        const attrStr = Object.entries(attrs)
          .map(([k, v]) => `${k}="${v}"`)
          .join(", ");
        md += ` _(${attrStr})_`;
      }

      // Process children
      const children = el.children || [];
       
      const textChildren = children.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (c: any) => c.type === "text" && c.data?.trim(),
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tagChildren = children.filter((c: any) => c.type === "tag");

      if (textChildren.length > 0 && tagChildren.length === 0) {
        const text = textChildren
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((c: any) => c.data?.trim())
          .join(" ");
        md += `: ${text}\n`;
      } else {
        md += "\n";
        for (const child of children) {
          md += processNode(child, depth + 1);
        }
      }

      return md;
    }

    return "";
  }

  const root = $.root().children();
  let markdown = "";
  root.each((_, el) => {
    markdown += processNode(el);
  });

  return markdown.trim() || "*Empty XML document*";
}

/**
 * Convert plain text to Markdown
 */
export function textToMarkdown(
  textContent: string,
  options: {
    detectHeadings?: boolean;
    detectLists?: boolean;
    detectLinks?: boolean;
    detectCodeBlocks?: boolean;
  } = {},
): string {
  const {
    detectHeadings = true,
    detectLists = true,
    detectLinks = true,
    detectCodeBlocks = true,
  } = options;

  let markdown = textContent;

  // Detect and convert URLs to markdown links
  if (detectLinks) {
    markdown = markdown.replace(/(https?:\/\/[^\s]+)/g, "[$1]($1)");
  }

  // Detect headings (lines that are all caps or followed by === or ---)
  if (detectHeadings) {
    const lines = markdown.split("\n");
    const processed: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = lines[i + 1];

      if (nextLine && /^=+$/.test(nextLine.trim())) {
        processed.push(`# ${line}`);
        i++; // Skip the === line
      } else if (
        nextLine &&
        /^-+$/.test(nextLine.trim()) &&
        nextLine.trim().length >= 3
      ) {
        processed.push(`## ${line}`);
        i++; // Skip the --- line
      } else if (
        /^[A-Z][A-Z\s]+$/.test(line.trim()) &&
        line.trim().length > 3
      ) {
        processed.push(`## ${line.trim()}`);
      } else {
        processed.push(line);
      }
    }
    markdown = processed.join("\n");
  }

  // Detect lists (lines starting with *, -, numbers, or letters)
  if (detectLists) {
    markdown = markdown.replace(/^(\d+)\.\s+/gm, "$1. ");
    markdown = markdown.replace(/^[•●○]\s+/gm, "- ");
    markdown = markdown.replace(/^[a-z]\)\s+/gim, "- ");
  }

  // Detect code blocks (lines with consistent indentation of 4+ spaces)
  if (detectCodeBlocks) {
    const lines = markdown.split("\n");
    const processed: string[] = [];
    let inCodeBlock = false;

    for (const line of lines) {
      const isIndented = /^(\t| {4})/.test(line);

      if (isIndented && !inCodeBlock) {
        processed.push("```");
        inCodeBlock = true;
      } else if (!isIndented && inCodeBlock && line.trim() !== "") {
        processed.push("```");
        inCodeBlock = false;
      }

      processed.push(isIndented ? line.replace(/^(\t| {4})/, "") : line);
    }

    if (inCodeBlock) {
      processed.push("```");
    }

    markdown = processed.join("\n");
  }

  return markdown;
}

/**
 * Convert PDF buffer to Markdown
 */
export async function pdfToMarkdown(buffer: Buffer): Promise<string> {
  // Dynamic import for pdf-parse
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");
  const data = await pdfParse(buffer);

  let markdown = "";

  // Add metadata if available
  if (data.info?.Title) {
    markdown += `# ${data.info.Title}\n\n`;
  }

  if (data.info?.Author) {
    markdown += `**Author:** ${data.info.Author}\n\n`;
  }

  // Process text content
  const text = data.text;
  markdown += textToMarkdown(text, {
    detectHeadings: true,
    detectLists: true,
    detectLinks: true,
    detectCodeBlocks: false,
  });

  return markdown;
}

/**
 * Extract content from Notion public page
 */
export async function notionToMarkdown(
  notionUrl: string,
): Promise<{ markdown: string; title: string }> {
  // Fetch the Notion page HTML
  const response = await axios.get(notionUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; MarkdownConverter/1.0)",
    },
    timeout: 30000,
  });

  const $ = cheerio.load(response.data);

  // Remove scripts and styles
  $("script, style, noscript").remove();

  // Get title
  const title =
    $("title").text().replace(" | Notion", "").trim() ||
    $("h1").first().text().trim() ||
    "Untitled";

  // Get main content area
  const content =
    $(".notion-page-content").html() ||
    $("article").html() ||
    $("main").html() ||
    $("body").html();

  const markdown = turndownService.turndown(content || "");

  return { markdown: `# ${title}\n\n${markdown}`, title };
}

/**
 * Convert Google Docs shared link to Markdown
 */
export async function googleDocsToMarkdown(
  docsUrl: string,
): Promise<{ markdown: string; title: string }> {
  // Convert to export URL
  const docIdMatch = docsUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!docIdMatch) {
    throw new Error("Invalid Google Docs URL");
  }

  const docId = docIdMatch[1];
  const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=html`;

  const response = await axios.get(exportUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; MarkdownConverter/1.0)",
    },
    timeout: 30000,
  });

  const $ = cheerio.load(response.data);

  // Get title
  const title = $("title").text().trim() || "Google Doc";

  // Remove styles
  $("style").remove();

  const bodyHtml = $("body").html() || "";
  const markdown = turndownService.turndown(bodyHtml);

  return { markdown: `# ${title}\n\n${markdown}`, title };
}
