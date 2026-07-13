import { Router } from "express";
import {
  scrapeWebsiteController,
  extractDocumentTextController,
} from "./controllers";
import { scrapeWebsiteValidator, extractDocumentValidator } from "./validators";
import { validate } from "../../shared/middleware";

const router = Router();

router.post(
  "/scrape-website",
  scrapeWebsiteValidator,
  validate,
  scrapeWebsiteController,
);
router.post(
  "/extract-document",
  extractDocumentValidator,
  validate,
  extractDocumentTextController,
);

export default router;
