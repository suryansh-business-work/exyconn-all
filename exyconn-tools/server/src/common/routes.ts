import { Router, Request, Response } from "express";
import multer from "multer";
import {
  uploadImage,
  getAuthenticationParameters,
  deleteImage,
} from "../shared/services/imagekit";
import {
  sendEmail,
  verifyConnection,
  getDefaultFromAddress,
} from "../shared/services/email";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// ============== ImageKit Routes ==============

// Get ImageKit auth parameters (for client-side uploads)
router.get("/imagekit/auth", async (req: Request, res: Response) => {
  try {
    const authParams = await getAuthenticationParameters();
    res.json({ success: true, ...authParams });
  } catch (error) {
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get auth params",
    });
  }
});

// Upload image via server
router.post(
  "/imagekit/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: "No file provided" });
        return;
      }

      const folder = req.body.folder || "/tools";
      const fileName = req.body.fileName || req.file.originalname;

      const result = await uploadImage(req.file.buffer, fileName, folder);

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      });
    }
  },
);

// Upload base64 image
router.post("/imagekit/upload-base64", async (req: Request, res: Response) => {
  try {
    const { base64, fileName, folder } = req.body;

    if (!base64) {
      res
        .status(400)
        .json({ success: false, error: "No base64 data provided" });
      return;
    }

    const result = await uploadImage(
      base64,
      fileName || "image.png",
      folder || "/tools",
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    });
  }
});

// Delete image
router.delete(
  "/imagekit/delete/:fileId",
  async (req: Request, res: Response) => {
    try {
      const fileId = req.params.fileId as string;
      const success = await deleteImage(fileId);
      res.json({ success });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Delete failed",
      });
    }
  },
);

// ============== Email Routes ==============

// Verify SMTP connection
router.get("/email/verify", async (req: Request, res: Response) => {
  try {
    const isConnected = await verifyConnection();
    res.json({ success: true, connected: isConnected });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Verification failed",
    });
  }
});

// Send email
router.post("/email/send", async (req: Request, res: Response) => {
  try {
    const { to, subject, text, html, from, replyTo } = req.body;

    if (!to || !subject) {
      res.status(400).json({
        success: false,
        error: "Missing required fields: to, subject",
      });
      return;
    }

    const result = await sendEmail({ to, subject, text, html, from, replyTo });

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    });
  }
});

// Send test email with signature preview
router.post(
  "/email/send-signature-test",
  async (req: Request, res: Response) => {
    try {
      const { to, signatureHtml, senderName } = req.body;

      if (!to || !signatureHtml) {
        res.status(400).json({
          success: false,
          error: "Missing required fields: to, signatureHtml",
        });
        return;
      }

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <p>Hi there,</p>
  <p>This is a test email to preview your new email signature. Here's how it looks:</p>
  <br/>
  <p>Best regards,</p>
  <br/>
  ${signatureHtml}
</body>
</html>
    `;

      const result = await sendEmail({
        to,
        subject: "Test Email Signature Preview",
        html: htmlContent,
        from: senderName
          ? `"${senderName}" <${await getDefaultFromAddress()}>`
          : undefined,
      });

      if (result.success) {
        res.json({ ...result, message: "Test email sent successfully!" });
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to send test email",
      });
    }
  },
);

export default router;
