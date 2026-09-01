import { Request, Response } from "express";
import { removeBackgroundFromDataUrl } from "../logo-maker/services";
import { OutputTooLargeError, upscaleImage } from "./services";

export async function upscaleController(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const { scale } = req.body;
    if (scale !== "2" && scale !== "4") {
      return res.status(400).json({ error: "scale must be '2' or '4'" });
    }

    const result = await upscaleImage(
      req.file.buffer,
      Number.parseInt(scale, 10),
      req.file.mimetype,
    );

    res.setHeader("Content-Type", result.contentType);
    return res.send(result.buffer);
  } catch (error) {
    if (error instanceof OutputTooLargeError) {
      return res.status(413).json({ error: error.message });
    }
    console.error("Image upscale error:", error);
    return res.status(500).json({
      error: "Failed to upscale image",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function removeBackgroundController(req: Request, res: Response) {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image data provided" });
    }

    const dataUrl = await removeBackgroundFromDataUrl(image);
    if (!dataUrl) {
      return res.status(400).json({ error: "Invalid image data format" });
    }

    return res.json({ success: true, image: dataUrl });
  } catch (error) {
    console.error("Error removing background:", error);
    return res.status(500).json({
      error: "Failed to remove background",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
