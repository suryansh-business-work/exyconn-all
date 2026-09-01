import { Router } from "express";
import multer from "multer";
import { protectPdfController, unlockPdfController } from "./controllers";

const router = Router();

// Configure multer for memory storage - PDFs only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (_req, file, cb) => {
    cb(
      null,
      file.mimetype === "application/pdf" ||
        file.originalname.toLowerCase().endsWith(".pdf"),
    );
  },
});

// POST /api/tools/pdf-tools/protect
router.post("/protect", upload.single("file"), protectPdfController);

// POST /api/tools/pdf-tools/unlock
router.post("/unlock", upload.single("file"), unlockPdfController);

export default router;
