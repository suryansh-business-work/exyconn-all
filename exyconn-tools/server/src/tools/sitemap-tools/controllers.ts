import { Request, Response } from "express";
import {
  validateSitemap,
  extractSitemapUrls,
  compareSitemaps,
  analyzeSitemapInsights,
  generateSitemap,
  generateSitemapIndex,
  generateRobotsTxt,
  splitSitemap,
  analyzeFrequency,
} from "./services";

export const validateSitemapController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { url } = req.body;
    const result = await validateSitemap(url);
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("Sitemap validation error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Validation failed",
    });
  }
};

export const extractUrlsController = async (req: Request, res: Response) => {
  try {
    const { url, followIndex = true } = req.body;
    const result = await extractSitemapUrls(url, followIndex);
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("URL extraction error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Extraction failed",
    });
  }
};

export const compareSitemapsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { sitemap1Url, sitemap2Url } = req.body;
    const result = await compareSitemaps(sitemap1Url, sitemap2Url);
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("Sitemap compare error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Comparison failed",
    });
  }
};

export const insightsController = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    const result = await analyzeSitemapInsights(url);
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("Sitemap insights error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Analysis failed",
    });
  }
};

export const generateSitemapController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { urls, includeLastmod, defaultChangefreq, defaultPriority } =
      req.body;
    const xml = generateSitemap({
      urls,
      includeLastmod,
      defaultChangefreq,
      defaultPriority,
    });
    return res.json({ success: true, xml, urlCount: urls.length });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Generation failed",
    });
  }
};

export const generateIndexController = async (req: Request, res: Response) => {
  try {
    const { sitemaps } = req.body;
    const xml = generateSitemapIndex({ sitemaps });
    return res.json({ success: true, xml, sitemapCount: sitemaps.length });
  } catch (error) {
    console.error("Index generation error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Generation failed",
    });
  }
};

export const generateRobotsController = async (req: Request, res: Response) => {
  try {
    const { sitemaps, userAgentRules, crawlDelay } = req.body;
    const content = generateRobotsTxt({ sitemaps, userAgentRules, crawlDelay });
    return res.json({ success: true, content });
  } catch (error) {
    console.error("Robots.txt generation error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Generation failed",
    });
  }
};

export const splitSitemapController = async (req: Request, res: Response) => {
  try {
    const { url, urlsPerFile = 10000, baseFileName = "sitemap" } = req.body;
    const result = await splitSitemap(url, urlsPerFile, baseFileName);
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("Sitemap split error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Split failed",
    });
  }
};

export const frequencyAnalysisController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { url } = req.body;
    const result = await analyzeFrequency(url);
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("Frequency analysis error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Analysis failed",
    });
  }
};
