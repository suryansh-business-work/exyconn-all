import { Router } from "express";
import {
  validateSitemapController,
  extractUrlsController,
  compareSitemapsController,
  insightsController,
  generateSitemapController,
  generateIndexController,
  generateRobotsController,
  splitSitemapController,
  frequencyAnalysisController,
} from "./controllers";
import {
  validateSitemapValidator,
  extractUrlsValidator,
  compareSitemapsValidator,
  insightsValidator,
  generateSitemapValidator,
  generateIndexValidator,
  generateRobotsValidator,
  splitSitemapValidator,
  frequencyValidator,
} from "./validators";
import { validate } from "../../shared/middleware";

const router = Router();

router.post(
  "/validate",
  validateSitemapValidator,
  validate,
  validateSitemapController,
);
router.post(
  "/extract-urls",
  extractUrlsValidator,
  validate,
  extractUrlsController,
);
router.post(
  "/compare",
  compareSitemapsValidator,
  validate,
  compareSitemapsController,
);
router.post("/insights", insightsValidator, validate, insightsController);
router.post(
  "/generate",
  generateSitemapValidator,
  validate,
  generateSitemapController,
);
router.post(
  "/generate-index",
  generateIndexValidator,
  validate,
  generateIndexController,
);
router.post(
  "/generate-robots",
  generateRobotsValidator,
  validate,
  generateRobotsController,
);
router.post("/split", splitSitemapValidator, validate, splitSitemapController);
router.post(
  "/frequency",
  frequencyValidator,
  validate,
  frequencyAnalysisController,
);

export default router;
