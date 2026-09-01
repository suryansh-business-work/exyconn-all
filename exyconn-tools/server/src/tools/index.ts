import { Router } from "express";
import logoSetRoutes from "./logo-maker/routes";
import imageToolsRoutes from "./image-tools/routes";
import pdfToolsRoutes from "./pdf-tools/routes";
import officeToolsRoutes from "./office-tools/routes";
import contactExtractorRoutes from "./contact-extractor/routes";
import sitemapFinderRoutes from "./sitemap-finder/routes";
import chatToolsRoutes from "./chat-tools/routes";
import websiteToolsRoutes from "./website-tools/routes";
import sitemapToolsRoutes from "./sitemap-tools/routes";
import converterToolsRoutes from "./converter-tools/routes";
import domainToolsRoutes from "./domain-tools/routes";
import seoToolsRoutes from "./seo-tools/routes";

const router = Router();

// Mount tool-specific routes
router.use("/logo-set", logoSetRoutes);
router.use("/image-tools", imageToolsRoutes);
router.use("/pdf-tools", pdfToolsRoutes);
router.use("/office-tools", officeToolsRoutes);
router.use("/contact-extractor", contactExtractorRoutes);
router.use("/sitemap-finder", sitemapFinderRoutes);
router.use("/chat-tools", chatToolsRoutes);
router.use("/website-tools", websiteToolsRoutes);
router.use("/sitemap-tools", sitemapToolsRoutes);
router.use("/converter-tools", converterToolsRoutes);
router.use("/domain-tools", domainToolsRoutes);
router.use("/seo-tools", seoToolsRoutes);

// Add more tool routes here as they are developed:
// router.use('/image-resizer', imageResizerRoutes);
// router.use('/compressor', compressorRoutes);
// router.use('/color-palette', colorPaletteRoutes);
// router.use('/cropper', cropperRoutes);
// router.use('/background-remover', backgroundRemoverRoutes);
// router.use('/converter', converterRoutes);
// router.use('/filters', filtersRoutes);

export default router;
