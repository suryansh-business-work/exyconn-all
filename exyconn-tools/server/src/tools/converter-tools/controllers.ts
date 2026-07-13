import { Request, Response } from "express";
import * as services from "./services";

export const convertCsvToMarkdown = async (req: Request, res: Response) => {
  try {
    const { content, hasHeader = true } = req.body;
    const markdown = services.csvToMarkdown(content, hasHeader);
    res.json({ success: true, data: { markdown } });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Conversion failed";
    res.status(500).json({ success: false, error: message });
  }
};

export const convertJsonToMarkdown = async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    const markdown = services.jsonToMarkdown(content);
    res.json({ success: true, data: { markdown } });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Conversion failed";
    res.status(500).json({ success: false, error: message });
  }
};

export const convertHtmlToMarkdown = async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    const markdown = services.htmlToMarkdown(content);
    res.json({ success: true, data: { markdown } });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Conversion failed";
    res.status(500).json({ success: false, error: message });
  }
};

export const convertWebpageToMarkdown = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    const result = await services.webpageToMarkdown(url);
    res.json({ success: true, data: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Conversion failed";
    res.status(500).json({ success: false, error: message });
  }
};

export const convertDocxToMarkdown = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "No file uploaded" });
    }
    const markdown = await services.docxToMarkdown(req.file.buffer);
    res.json({ success: true, data: { markdown } });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Conversion failed";
    res.status(500).json({ success: false, error: message });
  }
};

export const convertRtfToMarkdown = async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    const markdown = services.rtfToMarkdown(content);
    res.json({ success: true, data: { markdown } });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Conversion failed";
    res.status(500).json({ success: false, error: message });
  }
};

export const convertXmlToMarkdown = async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    const markdown = services.xmlToMarkdown(content);
    res.json({ success: true, data: { markdown } });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Conversion failed";
    res.status(500).json({ success: false, error: message });
  }
};

export const convertTextToMarkdown = async (req: Request, res: Response) => {
  try {
    const { content, options } = req.body;
    const markdown = services.textToMarkdown(content, options);
    res.json({ success: true, data: { markdown } });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Conversion failed";
    res.status(500).json({ success: false, error: message });
  }
};

export const convertPdfToMarkdown = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "No file uploaded" });
    }
    const markdown = await services.pdfToMarkdown(req.file.buffer);
    res.json({ success: true, data: { markdown } });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Conversion failed";
    res.status(500).json({ success: false, error: message });
  }
};

export const convertNotionToMarkdown = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    const result = await services.notionToMarkdown(url);
    res.json({ success: true, data: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Conversion failed";
    res.status(500).json({ success: false, error: message });
  }
};

export const convertGoogleDocsToMarkdown = async (
  req: Request,
  res: Response,
) => {
  try {
    const { url } = req.body;
    const result = await services.googleDocsToMarkdown(url);
    res.json({ success: true, data: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Conversion failed";
    res.status(500).json({ success: false, error: message });
  }
};
