import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { officeToPdfController } from "./controllers";
import { OFFICE_EXTENSIONS } from "./services";

const router = Router();

// Configure multer for memory storage - office documents only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (_req, file, cb) => {
    cb(null, OFFICE_EXTENSIONS.has(path.extname(file.originalname).toLowerCase()));
  },
});

// POST /api/tools/office-tools/office-to-pdf
router.post("/office-to-pdf", upload.single("file"), officeToPdfController);

export default router;
