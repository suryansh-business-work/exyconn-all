import { Router } from "express";
import multer from "multer";
import * as controllers from "./controllers";
import * as validators from "./validators";
import { validate } from "../../shared/middleware";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

// Text-based conversions
router.post(
  "/csv-to-markdown",
  validators.csvToMarkdownValidator,
  validate,
  controllers.convertCsvToMarkdown,
);
router.post(
  "/json-to-markdown",
  validators.jsonToMarkdownValidator,
  validate,
  controllers.convertJsonToMarkdown,
);
router.post(
  "/html-to-markdown",
  validators.htmlToMarkdownValidator,
  validate,
  controllers.convertHtmlToMarkdown,
);
router.post(
  "/rtf-to-markdown",
  validators.rtfToMarkdownValidator,
  validate,
  controllers.convertRtfToMarkdown,
);
router.post(
  "/xml-to-markdown",
  validators.xmlToMarkdownValidator,
  validate,
  controllers.convertXmlToMarkdown,
);
router.post(
  "/text-to-markdown",
  validators.textToMarkdownValidator,
  validate,
  controllers.convertTextToMarkdown,
);

// URL-based conversions
router.post(
  "/webpage-to-markdown",
  validators.webpageToMarkdownValidator,
  validate,
  controllers.convertWebpageToMarkdown,
);
router.post(
  "/notion-to-markdown",
  validators.notionToMarkdownValidator,
  validate,
  controllers.convertNotionToMarkdown,
);
router.post(
  "/google-docs-to-markdown",
  validators.googleDocsToMarkdownValidator,
  validate,
  controllers.convertGoogleDocsToMarkdown,
);

// File upload conversions
router.post(
  "/pdf-to-markdown",
  upload.single("file"),
  controllers.convertPdfToMarkdown,
);
router.post(
  "/docx-to-markdown",
  upload.single("file"),
  controllers.convertDocxToMarkdown,
);

export default router;
