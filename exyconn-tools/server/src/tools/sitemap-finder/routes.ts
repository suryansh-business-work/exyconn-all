import { Router } from "express";
import { findSitemapsController } from "./controllers";

const router = Router();

// POST /api/tools/sitemap-finder/find
router.post("/find", findSitemapsController);

export default router;
