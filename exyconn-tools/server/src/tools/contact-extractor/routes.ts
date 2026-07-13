import { Router } from "express";
import { extractContactsController } from "./controllers";

const router = Router();

// POST /api/tools/contact-extractor/extract
router.post("/extract", extractContactsController);

export default router;
