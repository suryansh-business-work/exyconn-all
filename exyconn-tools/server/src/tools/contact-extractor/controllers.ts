import { Request, Response } from "express";
import { extractContacts } from "./services";
import { extractContactsSchema } from "./validators";

export async function extractContactsController(req: Request, res: Response) {
  try {
    const result = extractContactsSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: result.error.issues,
      });
    }

    const { url, maxPages, followLinks } = result.data;

    const extractionResult = await extractContacts(url, maxPages, followLinks);

    return res.json({
      success: true,
      data: extractionResult,
    });
  } catch (error) {
    console.error("Contact extraction error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to extract contacts",
    });
  }
}
