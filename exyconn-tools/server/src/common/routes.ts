import { Router, Request, Response } from "express";
import multer from "multer";
import { uploadImage, deleteToolsImage } from "../shared/services/imagekit";
import { sendEmail } from "../shared/services/email";
import {
  createSignatureEmailLimiters,
  createUploadLimiter,
} from "../shared/middleware/limits";
import {
  MAX_UPLOAD_BYTES,
  detectImageType,
  safeFileName,
  toolsFolder,
} from "./image-upload";
import {
  SIGNATURE_EMAIL_SUBJECT,
  buildSignatureEmail,
  signatureTestSchema,
} from "./signature-email";

const FILE_ID = /^\w{1,64}$/;

/**
 * Shared endpoints the public tools site calls: image uploads for the signature builder
 * and its test email. Everything here is unauthenticated, so each route is narrow —
 * images only, under /tools only, to one recipient with fixed wording — and rate limited.
 * Built per app so limiter state never leaks between app instances.
 */
export function createCommonRouter(): Router {
  const router = Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  });
  const uploadLimiter = createUploadLimiter();

  router.post(
    "/imagekit/upload",
    uploadLimiter,
    upload.single("file"),
    async (req: Request, res: Response) => {
      if (!req.file) {
        res.status(400).json({ success: false, error: "No file provided" });
        return;
      }
      const type = detectImageType(req.file.mimetype, req.file.buffer);
      if (!type) {
        res.status(400).json({
          success: false,
          error: "Please upload a PNG, JPEG, GIF or WebP image",
        });
        return;
      }

      const result = await uploadImage(
        req.file.buffer,
        safeFileName(
          req.body.fileName ?? req.file.originalname,
          type.extension,
        ),
        toolsFolder(req.body.folder),
      );
      res.status(result.success ? 200 : 502).json(result);
    },
  );

  router.delete(
    "/imagekit/delete/:fileId",
    uploadLimiter,
    async (req: Request, res: Response) => {
      const fileId = String(req.params.fileId);
      if (!FILE_ID.test(fileId)) {
        res.status(400).json({ success: false, error: "Invalid file id" });
        return;
      }
      const result = await deleteToolsImage(fileId);
      if (result === "deleted") {
        res.json({ success: true });
      } else if (result === "forbidden") {
        res
          .status(403)
          .json({ success: false, error: "This file cannot be deleted" });
      } else {
        res.status(502).json({ success: false, error: "Delete failed" });
      }
    },
  );

  router.post(
    "/email/send-signature-test",
    ...createSignatureEmailLimiters(),
    async (req: Request, res: Response) => {
      const parsed = signatureTestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: parsed.error.issues[0]?.message ?? "Invalid request",
        });
        return;
      }

      const { to, signatureHtml, senderName } = parsed.data;
      const result = await sendEmail({
        to,
        subject: SIGNATURE_EMAIL_SUBJECT,
        html: buildSignatureEmail(signatureHtml, senderName),
      });

      if (result.success) {
        res.json({ ...result, message: "Test email sent successfully!" });
      } else {
        res.status(502).json(result);
      }
    },
  );

  return router;
}
