import { Router } from "express";
import {
  extractUrlsController,
  scanPagesController,
  analyzeStructureController,
} from "./controllers";
import {
  extractUrlsValidator,
  scanPagesValidator,
  analyzeStructureValidator,
} from "./validators";
import { validate } from "../../shared/middleware";

const router = Router();

router.post(
  "/extract-urls",
  extractUrlsValidator,
  validate,
  extractUrlsController,
);
router.post("/scan-pages", scanPagesValidator, validate, scanPagesController);
router.post(
  "/analyze-structure",
  analyzeStructureValidator,
  validate,
  analyzeStructureController,
);

export default router;
