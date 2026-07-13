import { Request, Response } from "express";
import {
  seoCheck,
  serpSimulator,
  checkPlagiarism,
  generateSummary,
  rewriteText,
  generateGBPDescription,
  keywordSuggest,
  backlinkAnalyze,
  trafficAnalyze,
  competitorAnalyze,
  searchPlaces,
} from "./services";

export async function seoCheckerController(req: Request, res: Response) {
  try {
    const { url } = req.body;
    const result = await seoCheck(url);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "SEO check failed",
    });
  }
}

export function serpSimulatorController(req: Request, res: Response) {
  try {
    const { title, description, url } = req.body;
    const result = serpSimulator(title, description, url);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "SERP simulation failed",
    });
  }
}

export function plagiarismCheckerController(req: Request, res: Response) {
  try {
    const { text } = req.body;
    const result = checkPlagiarism(text);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Plagiarism check failed",
    });
  }
}

export function summaryGeneratorController(req: Request, res: Response) {
  try {
    const { text, maxSentences } = req.body;
    const result = generateSummary(text, maxSentences);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Summary generation failed",
    });
  }
}

export function rewriteTextController(req: Request, res: Response) {
  try {
    const { text, style } = req.body;
    const result = rewriteText(text, style);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Text rewrite failed",
    });
  }
}

export function gbpDescriptionController(req: Request, res: Response) {
  try {
    const { businessName, businessType, location, services, uniquePoints } = req.body;
    const result = generateGBPDescription(businessName, businessType, location, services || [], uniquePoints || []);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "GBP description generation failed",
    });
  }
}

export async function keywordSuggestController(req: Request, res: Response) {
  try {
    const { keyword } = req.body;
    const result = await keywordSuggest(keyword);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Keyword suggestion failed",
    });
  }
}

export async function backlinkAnalyzeController(req: Request, res: Response) {
  try {
    const { url } = req.body;
    const result = await backlinkAnalyze(url);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Backlink analysis failed",
    });
  }
}

export async function trafficAnalyzeController(req: Request, res: Response) {
  try {
    const { url } = req.body;
    const result = await trafficAnalyze(url);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Traffic analysis failed",
    });
  }
}

export async function competitorAnalyzeController(req: Request, res: Response) {
  try {
    const { url } = req.body;
    const result = await competitorAnalyze(url);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Competitor analysis failed",
    });
  }
}

export async function placeSearchController(req: Request, res: Response) {
  try {
    const { query, apiKey } = req.body;
    if (!apiKey) {
      res.status(400).json({ success: false, error: "Google Places API key is required. Configure it in the Secrets drawer." });
      return;
    }
    const result = await searchPlaces(query, apiKey);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Place search failed",
    });
  }
}
