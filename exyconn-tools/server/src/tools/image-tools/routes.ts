import { Router } from "express";
import multer from "multer";
import { removeBackgroundController, upscaleController } from "./controllers";

const router = Router();

// Configure multer for memory storage - images only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype.startsWith("image/"));
  },
});

// POST /api/tools/image-tools/upscale
router.post("/upscale", upload.single("image"), upscaleController);

// POST /api/tools/image-tools/remove-background
router.post("/remove-background", removeBackgroundController);

export default router;
