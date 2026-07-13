import { Router } from "express";
import {
  seoCheckerController,
  serpSimulatorController,
  plagiarismCheckerController,
  summaryGeneratorController,
  rewriteTextController,
  gbpDescriptionController,
  keywordSuggestController,
  backlinkAnalyzeController,
  trafficAnalyzeController,
  competitorAnalyzeController,
  placeSearchController,
} from "./controllers";
import {
  urlValidator,
  keywordValidator,
  textValidator,
  serpSimulatorValidator,
} from "./validators";
import { validate } from "../../shared/middleware";

const router = Router();

// SEO Checker - analyzes URL for SEO issues
router.post("/seo-check", urlValidator, validate, seoCheckerController);

// SERP Simulator - preview how a page appears in Google
router.post("/serp-simulator", serpSimulatorValidator, validate, serpSimulatorController);

// Plagiarism Checker - basic text uniqueness analysis
router.post("/plagiarism-check", textValidator, validate, plagiarismCheckerController);

// Summary Generator - extractive text summarization
router.post("/summary", textValidator, validate, summaryGeneratorController);

// Text Rewriter - text analysis and suggestions
router.post("/rewrite", textValidator, validate, rewriteTextController);

// GBP Description Generator
router.post("/gbp-description", gbpDescriptionController);

// Keyword Suggest - Google Autocomplete suggestions
router.post("/keyword-suggest", keywordValidator, validate, keywordSuggestController);

// Backlink Analyzer - real link analysis from page
router.post("/backlink-analyze", urlValidator, validate, backlinkAnalyzeController);

// Traffic Analyzer - real page metrics
router.post("/traffic-analyze", urlValidator, validate, trafficAnalyzeController);

// Competitor Analyzer - find related sites
router.post("/competitor-analyze", urlValidator, validate, competitorAnalyzeController);

// Place Search - search Google Places by business name
router.post("/place-search", placeSearchController);

export default router;
