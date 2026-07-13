import { body } from "express-validator";

export const csvToMarkdownValidator = [
  body("content").isString().notEmpty().withMessage("CSV content is required"),
  body("hasHeader").optional().isBoolean(),
];

export const jsonToMarkdownValidator = [
  body("content").isString().notEmpty().withMessage("JSON content is required"),
];

export const htmlToMarkdownValidator = [
  body("content").isString().notEmpty().withMessage("HTML content is required"),
];

export const webpageToMarkdownValidator = [
  body("url").isURL().withMessage("Valid URL is required"),
];

export const rtfToMarkdownValidator = [
  body("content").isString().notEmpty().withMessage("RTF content is required"),
];

export const xmlToMarkdownValidator = [
  body("content").isString().notEmpty().withMessage("XML content is required"),
];

export const textToMarkdownValidator = [
  body("content").isString().notEmpty().withMessage("Text content is required"),
  body("options").optional().isObject(),
  body("options.detectHeadings").optional().isBoolean(),
  body("options.detectLists").optional().isBoolean(),
  body("options.detectLinks").optional().isBoolean(),
  body("options.detectCodeBlocks").optional().isBoolean(),
];

export const notionToMarkdownValidator = [
  body("url").isURL().withMessage("Valid Notion URL is required"),
];

export const googleDocsToMarkdownValidator = [
  body("url").isURL().withMessage("Valid Google Docs URL is required"),
];
