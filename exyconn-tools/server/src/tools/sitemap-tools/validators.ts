import { body } from "express-validator";

export const validateSitemapValidator = [
  body("url")
    .isURL({ require_protocol: true })
    .withMessage("Valid sitemap URL with protocol required"),
];

export const extractUrlsValidator = [
  body("url")
    .isURL({ require_protocol: true })
    .withMessage("Valid sitemap URL required"),
  body("followIndex").optional().isBoolean(),
];

export const compareSitemapsValidator = [
  body("sitemap1Url")
    .isURL({ require_protocol: true })
    .withMessage("Valid sitemap1 URL required"),
  body("sitemap2Url")
    .isURL({ require_protocol: true })
    .withMessage("Valid sitemap2 URL required"),
];

export const insightsValidator = [
  body("url")
    .isURL({ require_protocol: true })
    .withMessage("Valid sitemap URL required"),
];

export const generateSitemapValidator = [
  body("urls").isArray({ min: 1 }).withMessage("At least one URL required"),
  body("urls.*.loc")
    .isURL({ require_protocol: true })
    .withMessage("Each URL must have valid loc"),
  body("includeLastmod").optional().isBoolean(),
  body("defaultChangefreq").optional().isString(),
  body("defaultPriority").optional().isFloat({ min: 0, max: 1 }),
];

export const generateIndexValidator = [
  body("sitemaps")
    .isArray({ min: 1 })
    .withMessage("At least one sitemap required"),
  body("sitemaps.*.loc")
    .isURL({ require_protocol: true })
    .withMessage("Each sitemap must have valid loc"),
];

export const generateRobotsValidator = [
  body("sitemaps").isArray().withMessage("Sitemaps must be an array"),
  body("userAgentRules")
    .isArray()
    .withMessage("User agent rules must be an array"),
  body("crawlDelay").optional().isInt({ min: 0 }),
];

export const splitSitemapValidator = [
  body("url")
    .isURL({ require_protocol: true })
    .withMessage("Valid sitemap URL required"),
  body("urlsPerFile").optional().isInt({ min: 100, max: 50000 }),
  body("baseFileName").optional().isString(),
];

export const frequencyValidator = [
  body("url")
    .isURL({ require_protocol: true })
    .withMessage("Valid sitemap URL required"),
];
