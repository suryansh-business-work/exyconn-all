import axios from "axios";
import { PublicError } from "../../shared/errors";
import { safeRequest } from "../../shared/security/safe-http";
import { extractPdfText } from "../../shared/pdf-text";
import * as cheerio from "cheerio";

export const scrapeWebsite = async (url: string): Promise<string> => {
  try {
    const response = await safeRequest<string>(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);

    // Remove unwanted elements
    $("script, style, nav, footer, header, aside, iframe, noscript").remove();
    $('[role="navigation"], [role="banner"], [role="contentinfo"]').remove();

    // Extract main content
    let content = "";

    // Try to find main content areas
    const mainSelectors = [
      "main",
      "article",
      '[role="main"]',
      ".content",
      "#content",
      ".post",
    ];
    for (const selector of mainSelectors) {
      const main = $(selector);
      if (main.length > 0) {
        content = main.text();
        break;
      }
    }

    // Fallback to body if no main content found
    if (!content) {
      content = $("body").text();
    }

    // Clean up the text
    content = content
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n/g, "\n")
      .trim();

    // Limit content length
    if (content.length > 15000) {
      content = content.substring(0, 15000) + "...";
    }

    return content;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new PublicError(`Failed to fetch website: ${error.message}`);
    }
    throw error;
  }
};

export const extractTextFromBase64 = async (
  base64Data: string,
  mimeType: string,
): Promise<string> => {
  const buffer = Buffer.from(base64Data, "base64");

  if (mimeType === "application/pdf") {
    return extractPDFText(buffer);
  } else if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    return extractWordText(buffer);
  } else if (mimeType === "text/plain") {
    return buffer.toString("utf-8");
  }

  throw new PublicError(`Unsupported file type: ${mimeType}`);
};

const extractPDFText = async (buffer: Buffer): Promise<string> => {
  const { text } = await extractPdfText(buffer);
  return text.trim();
};

const extractWordText = async (buffer: Buffer): Promise<string> => {
  // Using mammoth for Word document text extraction
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
};
