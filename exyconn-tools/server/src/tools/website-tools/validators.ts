import { body } from "express-validator";

export const extractUrlsValidator = [
  body("url")
    .isURL({ require_protocol: true })
    .withMessage("Valid URL with protocol is required"),
  body("maxUrls")
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage("maxUrls must be between 1 and 1000"),
];

export const scanPagesValidator = [
  body("url")
    .isURL({ require_protocol: true })
    .withMessage("Valid URL with protocol is required"),
  body("maxPages")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("maxPages must be between 1 and 50"),
];

export const analyzeStructureValidator = [
  body("url")
    .isURL({ require_protocol: true })
    .withMessage("Valid URL with protocol is required"),
  body("maxPages")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("maxPages must be between 1 and 50"),
];
