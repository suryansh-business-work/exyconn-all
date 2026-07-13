import { Request, Response } from "express";
import { extractUrls, scanPages, analyzeStructure } from "./services";

export const extractUrlsController = async (req: Request, res: Response) => {
  try {
    const { url, maxUrls = 500 } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const urls = await extractUrls(url, maxUrls);
    const internalCount = urls.filter((u) => u.type === "internal").length;
    const externalCount = urls.filter((u) => u.type === "external").length;
    const resourceCount = urls.filter((u) => u.isResource).length;

    return res.json({
      success: true,
      url,
      totalUrls: urls.length,
      internalCount,
      externalCount,
      resourceCount,
      urls,
    });
  } catch (error) {
    console.error("URL extraction error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to extract URLs",
    });
  }
};

export const scanPagesController = async (req: Request, res: Response) => {
  try {
    const { url, maxPages = 20 } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const pages = await scanPages(url, maxPages);

    return res.json({
      success: true,
      url,
      totalPages: pages.length,
      pages,
    });
  } catch (error) {
    console.error("Page scanning error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to scan pages",
    });
  }
};

export const analyzeStructureController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { url, maxPages = 30 } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const structure = await analyzeStructure(url, maxPages);

    return res.json({
      success: true,
      ...structure,
    });
  } catch (error) {
    console.error("Structure analysis error:", error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to analyze structure",
    });
  }
};
