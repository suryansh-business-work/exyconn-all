import { Request, Response } from "express";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ToolUnavailableError } from "../../shared/services/process";
import { convertToPdf } from "./services";

const UNAVAILABLE_MESSAGE = "Office conversion service unavailable on this server";

export async function officeToPdfController(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ error: "No office document provided" });
  }

  const extension = path.extname(req.file.originalname).toLowerCase();
  // Unique working directory per request; soffice writes <basename>.pdf into it
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "office-to-pdf-"));
  const inputPath = path.join(workDir, `input${extension}`);
  const outputPath = path.join(workDir, "input.pdf");

  try {
    await fs.writeFile(inputPath, req.file.buffer);
    await convertToPdf(inputPath, workDir);
    const pdf = await fs.readFile(outputPath);

    const baseName = path.basename(req.file.originalname, extension);
    const safeName = `${baseName.replaceAll(/[^\w.-]/g, "_")}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
    return res.send(pdf);
  } catch (error) {
    if (error instanceof ToolUnavailableError) {
      return res.status(503).json({ error: UNAVAILABLE_MESSAGE });
    }
    console.error("Office to PDF error:", error);
    return res.status(500).json({ error: "Failed to convert document to PDF" });
  } finally {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
