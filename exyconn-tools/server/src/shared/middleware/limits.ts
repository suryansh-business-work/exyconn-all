import { Request, Response, NextFunction, RequestHandler } from "express";
import rateLimit from "express-rate-limit";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

interface LimitOptions {
  windowMs: number;
  limit: number;
  message: string;
  /** Count every caller together instead of per IP. */
  global?: boolean;
}

/**
 * A per-IP (or global) limiter answering 429 with the same `{ success, error }` shape the
 * tools UI already reads. The stores are in memory: tools-api runs as a single container.
 * Needs `trust proxy` so the IP is the visitor's, not the host nginx's.
 */
export function createLimiter({
  windowMs,
  limit,
  message,
  global,
}: LimitOptions): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    ...(global ? { keyGenerator: () => "global" } : {}),
    handler: (_req: Request, res: Response) => {
      res.status(429).json({ success: false, error: message });
    },
  });
}

const TRY_LATER = "Too many requests, please try again later.";

export const createApiLimiter = () =>
  createLimiter({
    windowMs: FIFTEEN_MINUTES_MS,
    limit: 300,
    message: TRY_LATER,
  });

/** Background removal, office/PDF conversion, image and document converters. */
export const createHeavyLimiter = () =>
  createLimiter({
    windowMs: FIFTEEN_MINUTES_MS,
    limit: 20,
    message: TRY_LATER,
  });

export const createUploadLimiter = () =>
  createLimiter({
    windowMs: FIFTEEN_MINUTES_MS,
    limit: 20,
    message: TRY_LATER,
  });

export const createSignatureEmailLimiters = (): RequestHandler[] => [
  createLimiter({
    windowMs: ONE_HOUR_MS,
    limit: 3,
    message:
      "You can send up to 3 test emails an hour. Please try again later.",
  }),
  createLimiter({
    windowMs: ONE_DAY_MS,
    limit: 20,
    global: true,
    message: "The test email service is busy today. Please try again tomorrow.",
  }),
];

/**
 * Caps how many CPU-bound jobs (ONNX background removal, LibreOffice) run at once, so a
 * burst of uploads cannot starve the rest of the API. Extra requests get a 503 at once
 * instead of queueing behind minutes of work.
 */
export function createConcurrencyLimit(maxActive: number): RequestHandler {
  let active = 0;
  return (_req: Request, res: Response, next: NextFunction) => {
    if (active >= maxActive) {
      res.status(503).json({
        success: false,
        error:
          "The server is busy processing other files. Please try again in a minute.",
      });
      return;
    }
    active++;
    let released = false;
    const release = () => {
      if (!released) {
        released = true;
        active--;
      }
    };
    res.on("finish", release);
    res.on("close", release);
    next();
  };
}
