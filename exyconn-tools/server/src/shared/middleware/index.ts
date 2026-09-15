import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { MulterError } from "multer";
import { clientErrorMessage } from "../errors";

// Validation middleware
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

type HttpError = Error & { status?: number; statusCode?: number; expose?: boolean };

function clientStatus(err: HttpError): number | undefined {
  if (err instanceof MulterError) {
    return err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
  }
  const status = err.status ?? err.statusCode;
  return status !== undefined && status >= 400 && status < 500 ? status : undefined;
}

// Error handling middleware: client errors (bad JSON, too large, bad upload) keep their
// message; anything else is logged here and answered generically.
export const errorHandler = (
  err: HttpError,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const status = clientStatus(err);
  if (status) {
    res.status(status).json({ error: err.message });
    return;
  }
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: clientErrorMessage(err, "Unknown error occurred"),
  });
};

// Request logging middleware
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
};

// API response time middleware
export const responseTime = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[Response Time] ${req.method} ${req.path} - ${duration}ms`);
  });
  next();
};
