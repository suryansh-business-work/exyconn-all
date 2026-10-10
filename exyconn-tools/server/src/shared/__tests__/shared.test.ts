import { afterEach, describe, expect, it, vi } from "vitest";
import { EventEmitter } from "node:events";
import type { NextFunction, Request, Response } from "express";
import { body } from "express-validator";
import { MulterError } from "multer";
import { clientErrorMessage, PublicError } from "../errors";
import { toText } from "../text";
import { apiDocsHandler } from "../handlers/api-docs";
import { createHealthHandler, createRootHandler } from "../handlers/health";
import {
  errorHandler,
  requestLogger,
  responseTime,
  validate,
} from "../middleware";
import { createConcurrencyLimit } from "../middleware/limits";

function fakeResponse() {
  const res = new EventEmitter() as EventEmitter & {
    statusCode?: number;
    body?: unknown;
    status: (code: number) => typeof res;
    json: (body: unknown) => typeof res;
  };
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body: unknown) => {
    res.body = body;
    return res;
  };
  return res;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("clientErrorMessage", () => {
  it("returns the fallback for anything that is not an Error", () => {
    expect(clientErrorMessage("boom", "Something failed")).toBe(
      "Something failed",
    );
  });

  it("shows the raw message outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(
      clientErrorMessage(new Error("/srv/app/secret.js missing"), "fallback"),
    ).toBe("/srv/app/secret.js missing");
  });

  it("keeps messages written for users, and target-site network failures, in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(
      clientErrorMessage(
        new PublicError("That address is blocked"),
        "fallback",
      ),
    ).toBe("That address is blocked");
    const dns = Object.assign(new Error("getaddrinfo ENOTFOUND example.com"), {
      code: "ENOTFOUND",
    });
    expect(clientErrorMessage(dns, "fallback")).toBe(
      "getaddrinfo ENOTFOUND example.com",
    );
  });

  it("hides internal errors in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(clientErrorMessage(new Error("ENOENT /srv/app/x"), "fallback")).toBe(
      "fallback",
    );
    const odd = Object.assign(new Error("code is not a target one"), {
      code: "EACCES",
    });
    expect(clientErrorMessage(odd, "fallback")).toBe("fallback");
  });
});

describe("toText", () => {
  it("keeps strings and writes scalars as they read", () => {
    expect(toText("a")).toBe("a");
    expect(toText(4)).toBe("4");
    expect(toText(false)).toBe("false");
    expect(toText(10n)).toBe("10");
  });

  it("names null and undefined rather than dropping them", () => {
    expect(toText(null)).toBe("null");
    expect(toText(undefined)).toBe("undefined");
  });

  it("writes structured values as JSON, never [object Object]", () => {
    expect(toText({ a: [1, 2] })).toBe('{"a":[1,2]}');
    expect(toText(() => 1)).toBe("");
  });
});

describe("handlers", () => {
  it("answers liveness with only a status", () => {
    const res = fakeResponse();
    createHealthHandler()({} as Request, res as unknown as Response);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("describes the service at the root, with links built from the server URL", () => {
    const res = fakeResponse();
    createRootHandler({
      name: "Tools",
      version: "1.2.3",
      port: 4000,
      domain: "tools.test",
      description: "Creative tools",
      uiUrl: "https://ui.test",
      serverUrl: "https://api.test",
      endpoints: { api: "/api" },
    })({} as Request, res as unknown as Response);

    expect(res.body).toMatchObject({
      name: "Tools",
      version: "1.2.3",
      description: "Creative tools",
      status: "running",
      endpoints: { api: "/api" },
      links: {
        ui: "https://ui.test",
        api: "https://api.test",
        health: "https://api.test/health",
      },
    });
    expect(
      Number.isNaN(Date.parse((res.body as { timestamp: string }).timestamp)),
    ).toBe(false);
  });

  it("lists every tool endpoint as a POST under its slug", () => {
    const res = fakeResponse();
    apiDocsHandler({} as Request, res as unknown as Response);
    const body = res.body as {
      common: { endpoints: string[] };
      tools: { slug: string; endpoints: string[] }[];
    };

    expect(body.common.endpoints).toContain(
      "POST /api/common/email/send-signature-test",
    );
    const pdf = body.tools.find((tool) => tool.slug === "pdf-tools");
    expect(pdf?.endpoints).toEqual([
      "POST /api/tools/pdf-tools/protect",
      "POST /api/tools/pdf-tools/unlock",
    ]);
  });
});

describe("middleware", () => {
  it("validate passes a request with no validation errors on", async () => {
    const next = vi.fn();
    validate(
      {} as Request,
      fakeResponse() as unknown as Response,
      next as NextFunction,
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("validate answers 400 with the failed checks and does not continue", async () => {
    const req = { body: {} } as Request;
    await body("name").notEmpty().withMessage("name is required").run(req);
    const res = fakeResponse();
    const next = vi.fn();

    validate(req, res as unknown as Response, next as NextFunction);

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      errors: [{ path: "name", msg: "name is required" }],
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("errorHandler keeps the message of a client error, and maps upload limits", () => {
    const tooBig = fakeResponse();
    errorHandler(
      new MulterError("LIMIT_FILE_SIZE"),
      {} as Request,
      tooBig as unknown as Response,
      vi.fn(),
    );
    expect(tooBig.statusCode).toBe(413);

    const unexpected = fakeResponse();
    errorHandler(
      new MulterError("LIMIT_UNEXPECTED_FILE"),
      {} as Request,
      unexpected as unknown as Response,
      vi.fn(),
    );
    expect(unexpected.statusCode).toBe(400);

    const badJson = fakeResponse();
    const parseError = Object.assign(new Error("Unexpected token"), {
      statusCode: 400,
    });
    errorHandler(
      parseError,
      {} as Request,
      badJson as unknown as Response,
      vi.fn(),
    );
    expect(badJson.statusCode).toBe(400);
    expect(badJson.body).toEqual({ error: "Unexpected token" });
  });

  it("errorHandler answers anything else generically and logs it", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubEnv("NODE_ENV", "production");
    const res = fakeResponse();
    const server = Object.assign(new Error("db password leaked"), {
      status: 503,
    });

    errorHandler(server, {} as Request, res as unknown as Response, vi.fn());

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      error: "Internal Server Error",
      message: "Unknown error occurred",
    });
    expect(log).toHaveBeenCalled();
  });

  it("requestLogger logs the method and path then continues", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const next = vi.fn();
    requestLogger(
      { method: "GET", path: "/health" } as Request,
      {} as Response,
      next as NextFunction,
    );
    expect(log).toHaveBeenCalledWith(expect.stringContaining("GET /health"));
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("responseTime logs the duration once the response finishes", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const res = fakeResponse();
    const next = vi.fn();
    responseTime(
      { method: "POST", path: "/api/x" } as Request,
      res as unknown as Response,
      next as NextFunction,
    );
    expect(next).toHaveBeenCalledTimes(1);
    expect(log).not.toHaveBeenCalled();

    res.emit("finish");

    expect(log).toHaveBeenCalledWith(
      expect.stringMatching(/POST \/api\/x - \d+ms/),
    );
  });
});

describe("createConcurrencyLimit", () => {
  it("lets jobs through up to the limit, answers 503 beyond it, and frees a slot when one ends", () => {
    const limit = createConcurrencyLimit(1);
    const next = vi.fn();
    const first = fakeResponse();
    const second = fakeResponse();
    const third = fakeResponse();

    limit({} as Request, first as unknown as Response, next as NextFunction);
    limit({} as Request, second as unknown as Response, next as NextFunction);

    expect(next).toHaveBeenCalledTimes(1);
    expect(second.statusCode).toBe(503);
    expect(second.body).toEqual({
      success: false,
      error:
        "The server is busy processing other files. Please try again in a minute.",
    });

    first.emit("finish");
    first.emit("close");
    limit({} as Request, third as unknown as Response, next as NextFunction);

    expect(next).toHaveBeenCalledTimes(2);
  });
});
