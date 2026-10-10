import express, { type Express, type Router } from "express";
import { errorHandler } from "../../shared/middleware";

/** A bare app around one tool router: JSON bodies, the router, the shared error handler. */
export function mountRouter(router: Router, path = "/"): Express {
  const app = express();
  app.use(express.json({ limit: "10mb" }));
  app.use(path, router);
  app.use(errorHandler);
  return app;
}
