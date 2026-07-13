import { Router, Request, Response } from "express";
import multer from "multer";
import { removeBackground } from "@imgly/background-removal-node";

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Background removal endpoint - accepts file upload
router.post(
  "/remove-background",
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      console.log(
        `Processing image: ${req.file.originalname}, size: ${req.file.size} bytes`,
      );

      // Convert buffer to Blob
      const blob = new Blob([new Uint8Array(req.file.buffer)], { type: req.file.mimetype });

      // Remove background using @imgly/background-removal-node
      const resultBlob = await removeBackground(blob, {
        progress: (key, current, total) => {
          console.log(
            `Progress [${key}]: ${Math.round((current / total) * 100)}%`,
          );
        },
      });

      // Convert result blob to buffer
      const arrayBuffer = await resultBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Send as base64 data URL
      const base64 = buffer.toString("base64");
      const dataUrl = `data:image/png;base64,${base64}`;

      console.log("Background removal completed successfully");
      res.json({ success: true, image: dataUrl });
    } catch (error) {
      console.error("Error removing background:", error);
      res.status(500).json({
        error: "Failed to remove background",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// Background removal endpoint - accepts base64 data URL
router.post(
  "/remove-background-base64",
  async (req: Request, res: Response) => {
    try {
      const { image } = req.body;

      if (!image) {
        return res.status(400).json({ error: "No image data provided" });
      }

      console.log("Processing base64 image...");

      // Extract base64 data from data URL
      const base64Match = image.match(/^data:image\/\w+;base64,(.+)$/);
      if (!base64Match) {
        return res.status(400).json({ error: "Invalid image data format" });
      }

      const base64Data = base64Match[1];
      const buffer = Buffer.from(base64Data, "base64");

      // Convert buffer to Blob
      const blob = new Blob([buffer], { type: "image/png" });

      // Remove background using @imgly/background-removal-node
      const resultBlob = await removeBackground(blob, {
        progress: (key, current, total) => {
          console.log(
            `Progress [${key}]: ${Math.round((current / total) * 100)}%`,
          );
        },
      });

      // Convert result blob to buffer
      const arrayBuffer = await resultBlob.arrayBuffer();
      const resultBuffer = Buffer.from(arrayBuffer);

      // Send as base64 data URL
      const resultBase64 = resultBuffer.toString("base64");
      const dataUrl = `data:image/png;base64,${resultBase64}`;

      console.log("Background removal completed successfully");
      res.json({ success: true, image: dataUrl });
    } catch (error) {
      console.error("Error removing background:", error);
      res.status(500).json({
        error: "Failed to remove background",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// Background removal endpoint using Remove.bg API
router.post(
  "/remove-background-removebg",
  async (req: Request, res: Response) => {
    try {
      const { image, apiKey } = req.body;

      if (!image) {
        return res.status(400).json({ error: "No image data provided" });
      }

      if (!apiKey) {
        return res.status(400).json({ error: "No Remove.bg API key provided" });
      }

      console.log("Processing image with Remove.bg API...");

      // Extract base64 data from data URL
      const base64Match = image.match(/^data:image\/\w+;base64,(.+)$/);
      if (!base64Match) {
        return res.status(400).json({ error: "Invalid image data format" });
      }

      const base64Data = base64Match[1];

      // Call Remove.bg API using JSON body with base64 data
      const removeBgResponse = await fetch(
        "https://api.remove.bg/v1.0/removebg",
        {
          method: "POST",
          headers: {
            "X-Api-Key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_file_b64: base64Data,
            size: "auto",
          }),
        },
      );

      if (!removeBgResponse.ok) {
        const errorText = await removeBgResponse.text();
        let errorMessage = "Remove.bg API error";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.errors?.[0]?.title || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        console.error("Remove.bg API error:", errorMessage);
        return res.status(removeBgResponse.status).json({
          error: "Remove.bg API error",
          message: errorMessage,
        });
      }

      // Get result as buffer and convert to base64
      const resultBuffer = await removeBgResponse.arrayBuffer();
      const resultBase64 = Buffer.from(resultBuffer).toString("base64");
      const dataUrl = `data:image/png;base64,${resultBase64}`;

      console.log("Background removal with Remove.bg completed successfully");
      res.json({ success: true, image: dataUrl });
    } catch (error) {
      console.error("Error removing background with Remove.bg:", error);
      res.status(500).json({
        error: "Failed to remove background",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

export default router;
