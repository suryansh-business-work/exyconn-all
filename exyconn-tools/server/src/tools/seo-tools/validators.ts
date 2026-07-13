import { z } from "zod";
import { body } from "express-validator";

// URL validator for SEO tools
export const urlValidator = [
  body("url")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("URL is required")
    .isURL({ require_protocol: true })
    .withMessage("A valid URL with protocol (http/https) is required"),
];

// Domain validator for SEO tools
export const domainValidator = [
  body("domain")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Domain is required"),
];

// Keyword validator
export const keywordValidator = [
  body("keyword")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Keyword is required"),
];

// Text content validator
export const textValidator = [
  body("text")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Text content is required"),
];

// SERP simulator validator
export const serpSimulatorValidator = [
  body("title")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Title is required"),
  body("description")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Description is required"),
  body("url")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("URL is required"),
];

// Zod schemas for deeper validation
export const seoCheckSchema = z.object({
  url: z.string().url("Valid URL required"),
});

export const keywordSchema = z.object({
  keyword: z.string().min(1, "Keyword is required").max(200),
  location: z.string().optional(),
  language: z.string().optional(),
});

export const textContentSchema = z.object({
  text: z.string().min(10, "Text must be at least 10 characters"),
});

export const serpSimulatorSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  url: z.string().url(),
});
