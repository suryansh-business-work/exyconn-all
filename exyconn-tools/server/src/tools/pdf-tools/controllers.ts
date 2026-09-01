import { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  CommandFailedError,
  ToolUnavailableError,
} from "../../shared/services/process";
import { decryptPdf, encryptPdf } from "./services";

const UNAVAILABLE_MESSAGE = "PDF encryption service unavailable on this server";

function tmpPdfPath(suffix: string): string {
  return path.join(os.tmpdir(), `pdf-tools-${randomUUID()}-${suffix}.pdf`);
}

async function cleanup(...paths: string[]): Promise<void> {
  await Promise.all(
    paths.map((p) => fs.rm(p, { force: true }).catch(() => undefined)),
  );
}

function sendPdf(res: Response, buffer: Buffer, filename: string) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.send(buffer);
}

export async function protectPdfController(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ error: "No PDF file provided" });
  }

  const { userPassword } = req.body;
  if (!userPassword || typeof userPassword !== "string") {
    return res.status(400).json({ error: "userPassword is required" });
  }

  const ownerPassword =
    typeof req.body.ownerPassword === "string" && req.body.ownerPassword
      ? req.body.ownerPassword
      : userPassword;

  const inputPath = tmpPdfPath("in");
  const outputPath = tmpPdfPath("out");
  try {
    await fs.writeFile(inputPath, req.file.buffer);
    await encryptPdf(inputPath, outputPath, userPassword, ownerPassword);
    const encrypted = await fs.readFile(outputPath);
    return sendPdf(res, encrypted, "protected.pdf");
  } catch (error) {
    if (error instanceof ToolUnavailableError) {
      return res.status(503).json({ error: UNAVAILABLE_MESSAGE });
    }
    console.error("PDF protect error:", error);
    return res.status(500).json({ error: "Failed to protect PDF" });
  } finally {
    await cleanup(inputPath, outputPath);
  }
}

export async function unlockPdfController(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ error: "No PDF file provided" });
  }

  const { password } = req.body;
  if (!password || typeof password !== "string") {
    return res.status(400).json({ error: "password is required" });
  }

  const inputPath = tmpPdfPath("in");
  const outputPath = tmpPdfPath("out");
  try {
    await fs.writeFile(inputPath, req.file.buffer);
    await decryptPdf(inputPath, outputPath, password);
    const decrypted = await fs.readFile(outputPath);
    return sendPdf(res, decrypted, "unlocked.pdf");
  } catch (error) {
    if (error instanceof ToolUnavailableError) {
      return res.status(503).json({ error: UNAVAILABLE_MESSAGE });
    }
    if (error instanceof CommandFailedError) {
      return res.status(400).json({ error: "Incorrect password" });
    }
    console.error("PDF unlock error:", error);
    return res.status(500).json({ error: "Failed to unlock PDF" });
  } finally {
    await cleanup(inputPath, outputPath);
  }
}
