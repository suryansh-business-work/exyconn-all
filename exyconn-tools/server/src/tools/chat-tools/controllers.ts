import { Request, Response } from "express";
import { scrapeWebsite, extractTextFromBase64 } from "./services";

export const scrapeWebsiteController = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const content = await scrapeWebsite(url);
    return res.json({ success: true, content, url });
  } catch (error) {
    console.error("Website scraping error:", error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to scrape website",
    });
  }
};

export const extractDocumentTextController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { fileData, mimeType, fileName } = req.body;

    if (!fileData || !mimeType) {
      return res
        .status(400)
        .json({ error: "File data and mime type are required" });
    }

    const text = await extractTextFromBase64(fileData, mimeType);
    return res.json({ success: true, text, fileName });
  } catch (error) {
    console.error("Document extraction error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to extract text",
    });
  }
};
