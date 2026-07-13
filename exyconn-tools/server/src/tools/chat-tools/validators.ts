import { body } from "express-validator";

export const scrapeWebsiteValidator = [
  body("url")
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("Valid URL with http/https is required"),
];

export const extractDocumentValidator = [
  body("fileData").notEmpty().withMessage("File data is required"),
  body("mimeType").notEmpty().withMessage("Mime type is required"),
];
