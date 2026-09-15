import express, { Express } from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import toolsRouter from "./tools";
import { createCommonRouter } from "./common/routes";
import { requestLogger, responseTime, errorHandler } from "./shared/middleware";
import {
  createApiLimiter,
  createConcurrencyLimit,
  createHeavyLimiter,
} from "./shared/middleware/limits";
import {
  createHealthHandler,
  createRootHandler,
  RootConfig,
  apiDocsHandler,
} from "./shared/handlers";

// Load environment variables
dotenv.config();

export const PORT = process.env.PORT || 4002;

const isProduction = process.env.NODE_ENV === "production";

/**
 * Any loopback origin, on any port.
 *
 * The allowlist used to enumerate "common dev ports", which broke as soon as
 * Vite fell back to another port because the configured one was busy — the UI
 * then failed every request with an opaque CORS error. Loopback is only trusted
 * outside production.
 */
const LOOPBACK_ORIGIN = /^http:\/\/(?:localhost|127\.0\.0\.1|\[::1\]):\d+$/;

/**
 * Browsers may call this API only from the tools site and the main site. Nothing here
 * uses cookies, so credentials stay off.
 */
const allowedOrigins = new Set([
  "https://tools.exyconn.com",
  "https://www.tools.exyconn.com",
  "https://exyconn.com",
  "https://www.exyconn.com",
]);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Requests without an Origin (curl, uptime monitors) are not browser cross-origin calls.
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    if (!isProduction && LOOPBACK_ORIGIN.test(origin)) {
      return callback(null, true);
    }
    // No CORS headers: the browser blocks the response without this server erroring.
    return callback(null, false);
  },
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Accept", "X-Requested-With"],
  credentials: false,
  maxAge: 86400, // Cache preflight for 24 hours
};

const rootConfig: RootConfig = {
  name: "exyconn-tools-server",
  version: "1.0.0",
  port: PORT,
  domain: "tools-api.exyconn.com",
  description: "Exyconn Creative Tools API Server",
  uiUrl: "https://tools.exyconn.com",
  serverUrl: "https://tools-api.exyconn.com",
  endpoints: {
    health: "/health",
    api: "/api",
    tools: "/api/tools",
    common: "/api/common",
  },
};

/** Routes whose JSON bodies carry base64 images or whole documents. */
const LARGE_JSON_PATHS = [
  "/api/tools/logo-set",
  "/api/tools/image-tools",
  "/api/tools/chat-tools/extract-document",
  "/api/tools/converter-tools",
];

/** CPU-heavy or upload-heavy tools get a much tighter per-IP budget. */
const HEAVY_PATHS = [
  "/api/tools/logo-set",
  "/api/tools/image-tools",
  "/api/tools/pdf-tools",
  "/api/tools/office-tools",
  "/api/tools/converter-tools",
];

/** ONNX background removal and LibreOffice: at most two running at once. */
const EXCLUSIVE_JOB_PATHS = [
  "/api/tools/logo-set/remove-background",
  "/api/tools/logo-set/remove-background-base64",
  "/api/tools/image-tools/remove-background",
  "/api/tools/office-tools/office-to-pdf",
];
const MAX_CONCURRENT_JOBS = 2;

export function createApp(): Express {
  const app = express();

  // One hop: the host nginx. Rate limits then key on the visitor's IP, not nginx's.
  app.set("trust proxy", 1);
  // same-site: tools.exyconn.com reads binary responses (upscaled images, PDFs) from here.
  app.use(helmet({ crossOriginResourcePolicy: { policy: "same-site" } }));
  app.use(cors(corsOptions));

  // Handle preflight requests for all routes (Express 5 compatible)
  app.options("/{*path}", cors(corsOptions));

  // Health stays outside the limiters so monitors and the container healthcheck never 429.
  app.get("/health", createHealthHandler());

  app.use(createApiLimiter());
  app.use(HEAVY_PATHS, createHeavyLimiter());
  app.use(EXCLUSIVE_JOB_PATHS, createConcurrencyLimit(MAX_CONCURRENT_JOBS));

  app.use(LARGE_JSON_PATHS, express.json({ limit: "10mb" }));
  app.use(express.json({ limit: "1mb" }));
  app.use(requestLogger);
  app.use(responseTime);

  app.get("/", createRootHandler(rootConfig));

  // API info endpoint
  app.get("/api", apiDocsHandler);

  // Mount common routes
  app.use("/api/common", createCommonRouter());

  // Mount tools router
  app.use("/api/tools", toolsRouter);

  // Error handling middleware
  app.use(errorHandler);

  return app;
}
