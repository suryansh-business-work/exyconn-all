import { PDFParse } from "pdf-parse";

export interface PdfText {
  text: string;
  title?: string;
  author?: string;
}

/**
 * The text of a PDF, page by page without pdf-parse's "-- 1 of 1 --" footers, plus the
 * title and author from its info dictionary when it has them.
 */
export async function extractPdfText(buffer: Buffer): Promise<PdfText> {
  const parser = new PDFParse({ data: buffer });
  try {
    const content = await parser.getText();
    const details = await parser.getInfo();
    const info = details.info as
      { Title?: string; Author?: string } | undefined;
    return {
      text: content.pages.map((page) => page.text).join("\n"),
      title: info?.Title,
      author: info?.Author,
    };
  } finally {
    await parser.destroy();
  }
}
