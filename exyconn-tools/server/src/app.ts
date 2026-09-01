import express, { Express } from "express";
import cors from "cors";
import dotenv from "dotenv";
import toolsRouter from "./tools";
import commonRouter from "./common/routes";
import { requestLogger, responseTime, errorHandler } from "./shared/middleware";
import {
  createHealthHandler,
  createRootHandler,
  HealthConfig,
  apiDocsHandler,
} from "./shared/handlers";

// Load environment variables
dotenv.config();

export const PORT = process.env.PORT || 4002;

// CORS configuration for production and development
const allowedOrigins = [
  // Local development - all common dev ports
  "http://localhost:4001",
  "http://localhost:4002",
  "http://localhost:4014",
  "http://localhost:4015",
  "http://localhost:4016",
  "http://127.0.0.1:4001",
  "http://127.0.0.1:4002",
  "http://127.0.0.1:4014",
  "http://127.0.0.1:4015",
  "http://127.0.0.1:4016",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  // Production domains - Tools
  "https://tools.exyconn.com",
  "https://www.tools.exyconn.com",
  "https://tools-api.exyconn.com",
  "https://www.tools-api.exyconn.com",
  // Production domains - Main site
  "https://exyconn.com",
  "https://www.exyconn.com",
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow all subdomains of exyconn.com
    if (origin.endsWith(".exyconn.com") || origin === "https://exyconn.com") {
      return callback(null, true);
    }
    console.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error("Not allowed by CORS"), false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  credentials: true,
  maxAge: 86400, // Cache preflight for 24 hours
};

// Standardized Health Configuration
const healthConfig: HealthConfig = {
  name: 'exyconn-tools-server',
  version: '1.0.0',
  port: PORT,
  domain: 'tools-api.exyconn.com',
  description: 'Exyconn Creative Tools API Server',
  uiUrl: 'https://tools.exyconn.com',
  serverUrl: 'https://tools-api.exyconn.com',
  criticalPackages: ['express', '@imgly/background-removal-node', 'axios', 'imagekit'],
};

export function createApp(): Express {
  const app = express();

  // Apply CORS middleware
  app.use(cors(corsOptions));

  // Handle preflight requests for all routes (Express 5 compatible)
  app.options("/{*path}", cors(corsOptions));

  app.use(express.json({ limit: "10mb" }));
  app.use(requestLogger);
  app.use(responseTime);

  // Health check endpoint
  app.get("/health", createHealthHandler(healthConfig));

  // Root endpoint
  app.get("/", createRootHandler({
    ...healthConfig,
    endpoints: {
      health: '/health',
      api: '/api',
      tools: '/api/tools',
      common: '/api/common',
    },
  }));

  // API info endpoint
  app.get("/api", apiDocsHandler);

  // Mount common routes
  app.use("/api/common", commonRouter);

  // Mount tools router
  app.use("/api/tools", toolsRouter);

  // Error handling middleware
  app.use(errorHandler);

  return app;
}
