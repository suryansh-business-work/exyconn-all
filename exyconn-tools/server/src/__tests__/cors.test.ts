import { describe, it, expect, afterEach, vi } from "vitest";
import request from "supertest";

/**
 * The dev allowlist used to enumerate specific localhost ports, so the UI broke
 * whenever Vite fell back to a different one. Loopback is now allowed on any
 * port outside production — these tests pin both halves of that rule.
 */
async function freshApp(nodeEnv: string | undefined) {
  vi.resetModules();
  const previous = process.env.NODE_ENV;
  if (nodeEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = nodeEnv;
  }
  // Extension required: under NodeNext a dynamic import() stays a real ESM
  // import, unlike the static imports elsewhere which compile to require().
  const { createApp } = await import("../app.js");
  const app = createApp();
  return { app, restore: () => { process.env.NODE_ENV = previous; } };
}

describe("CORS origins", () => {
  let restore: (() => void) | undefined;

  afterEach(() => {
    restore?.();
    restore = undefined;
  });

  it("allows a loopback origin on an arbitrary port in development", async () => {
    const ctx = await freshApp("development");
    restore = ctx.restore;

    const res = await request(ctx.app)
      .get("/health")
      .set("Origin", "http://localhost:4011");

    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:4011");
  });

  it("allows the preflight a browser sends before a POST", async () => {
    const ctx = await freshApp("development");
    restore = ctx.restore;

    const res = await request(ctx.app)
      .options("/api/tools/image-tools/remove-background")
      .set("Origin", "http://127.0.0.1:53123")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "content-type");

    expect(res.status).toBeLessThan(300);
    expect(res.headers["access-control-allow-origin"]).toBe("http://127.0.0.1:53123");
  });

  it("still allows production domains in production", async () => {
    const ctx = await freshApp("production");
    restore = ctx.restore;

    const res = await request(ctx.app)
      .get("/health")
      .set("Origin", "https://tools.exyconn.com");

    expect(res.headers["access-control-allow-origin"]).toBe("https://tools.exyconn.com");
  });

  it("does NOT trust loopback in production", async () => {
    const ctx = await freshApp("production");
    restore = ctx.restore;

    const res = await request(ctx.app)
      .get("/health")
      .set("Origin", "http://localhost:4011");

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("rejects an unrelated external origin in development", async () => {
    const ctx = await freshApp("development");
    restore = ctx.restore;

    const res = await request(ctx.app)
      .get("/health")
      .set("Origin", "https://evil.example.com");

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
