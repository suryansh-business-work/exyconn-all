import { Request, Response } from "express";
import { findSitemaps } from "./services";
import { findSitemapsSchema } from "./validators";

export async function findSitemapsController(req: Request, res: Response) {
  try {
    const result = findSitemapsSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: result.error.issues,
      });
    }

    const { url, checkCommonPaths, parseRobotsTxt, maxDepth } = result.data;

    const sitemapResult = await findSitemaps(
      url,
      checkCommonPaths,
      parseRobotsTxt,
      maxDepth,
    );

    return res.json({
      success: true,
      data: sitemapResult,
    });
  } catch (error) {
    console.error("Sitemap finder error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to find sitemaps",
    });
  }
}
