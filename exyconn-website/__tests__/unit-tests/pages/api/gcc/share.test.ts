/** POST /api/gcc/share: create (captcha + consent), read and revoke read-only estimate links. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const portal = vi.hoisted(() => ({
  createGccShare: vi.fn(),
  getSharedGccEstimate: vi.fn(),
  revokeGccShare: vi.fn(),
}));
vi.mock("../../../../../src/lib/portal", async () => {
  const { PortalRequestError } = await vi.importActual<
    typeof import("../../../../../src/lib/portal/client")
  >("../../../../../src/lib/portal/client");
  return { ...portal, PortalRequestError };
});

import { POST } from "../../../../../src/pages/api/gcc/share";
import { gccLimits, resetGccLimits } from "../../../../../src/lib/gcc/route";
import { VISITOR, postRequest, readJson, routeContext } from "../../route-helpers";

const TOKEN = "a1".repeat(32);
const KEY = "b2".repeat(32);
const NOT_FOUND = {
  status: 404,
  body: { error: "not-found", message: "This link has expired or was removed." },
};
const CREATE = {
  action: "create",
  captchaToken: "q-1",
  captchaAnswer: "5",
  consent: true,
  expiresInDays: 30,
  estimate: { name: "Pune GCC" },
};

const post = async (body: unknown) =>
  readJson(await POST(routeContext(postRequest("/api/gcc/share", body))));

beforeEach(() => {
  resetGccLimits();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("POST /api/gcc/share", () => {
  it.each([
    ["is not JSON", "{"],
    ["names no action", {}],
    ["names an unknown action", { action: "update" }],
  ])("refuses a request that %s", async (_what, body) => {
    expect(await post(body)).toEqual({
      status: 400,
      body: { error: "invalid", message: "The request could not be read." },
    });
  });

  describe("create", () => {
    it("stores the estimate as JSON and returns the link", async () => {
      const link = { token: TOKEN, revokeKey: KEY, expiresAt: "2026-11-18T00:00:00Z" };
      portal.createGccShare.mockResolvedValue(link);
      expect(await post(CREATE)).toEqual({ status: 200, body: link });
      expect(portal.createGccShare).toHaveBeenCalledWith(
        { estimateJson: '{"name":"Pune GCC"}', expiresInDays: 30, consent: true },
        { token: "q-1", answer: "5" }
      );
    });

    it.each([
      ["question", { captchaToken: "" }],
      ["answer", { captchaAnswer: " " }],
    ])("asks for the security %s first", async (_what, change) => {
      expect(await post({ ...CREATE, ...change })).toEqual({
        status: 400,
        body: { error: "captcha", message: "Please answer the security question." },
      });
      expect(portal.createGccShare).not.toHaveBeenCalled();
    });

    it.each([
      ["consent is missing", { consent: "yes" }],
      ["no expiry is chosen", { expiresInDays: "30" }],
    ])("refuses when %s", async (_what, change) => {
      expect(await post({ ...CREATE, ...change })).toEqual({
        status: 400,
        body: {
          error: "invalid",
          message: "Agree to the estimate being stored and choose when the link expires.",
        },
      });
    });

    it("limits each visitor to ten links an hour", async () => {
      for (let i = 0; i < 10; i += 1) {
        gccLimits.shareCreate.allow(VISITOR);
      }
      expect((await post(CREATE)).status).toBe(429);
      expect(portal.createGccShare).not.toHaveBeenCalled();
    });

    it("reports a portal failure as the service being unavailable", async () => {
      portal.createGccShare.mockRejectedValue(new Error("socket hang up"));
      expect((await post(CREATE)).status).toBe(503);
      expect(console.error).toHaveBeenCalledWith("GCC share link failed:", "socket hang up");
    });
  });

  describe("read", () => {
    it("returns a live shared estimate", async () => {
      const shared = { estimateJson: "{}", expiresAt: "2026-11-18T00:00:00Z" };
      portal.getSharedGccEstimate.mockResolvedValue(shared);
      expect(await post({ action: "read", token: TOKEN })).toEqual({ status: 200, body: shared });
      expect(portal.getSharedGccEstimate).toHaveBeenCalledWith(TOKEN);
    });

    it("answers not found for a dead link, and for a malformed token without asking", async () => {
      portal.getSharedGccEstimate.mockResolvedValue(null);
      expect(await post({ action: "read", token: TOKEN })).toEqual(NOT_FOUND);
      expect(await post({ action: "read", token: "nope" })).toEqual(NOT_FOUND);
      expect(portal.getSharedGccEstimate).toHaveBeenCalledTimes(1);
    });

    it("limits how often a visitor reads links", async () => {
      for (let i = 0; i < 60; i += 1) {
        gccLimits.shareRead.allow(VISITOR);
      }
      expect((await post({ action: "read", token: TOKEN })).status).toBe(429);
    });
  });

  describe("revoke", () => {
    it("revokes a link with its key", async () => {
      portal.revokeGccShare.mockResolvedValue(true);
      expect(await post({ action: "revoke", token: TOKEN, revokeKey: KEY })).toEqual({
        status: 200,
        body: {},
      });
      expect(portal.revokeGccShare).toHaveBeenCalledWith(TOKEN, KEY);
    });

    it("answers not found for a wrong key, and for malformed secrets without asking", async () => {
      portal.revokeGccShare.mockResolvedValue(false);
      expect(await post({ action: "revoke", token: TOKEN, revokeKey: KEY })).toEqual(NOT_FOUND);
      expect(await post({ action: "revoke", token: "bad", revokeKey: KEY })).toEqual(NOT_FOUND);
      expect(await post({ action: "revoke", token: TOKEN, revokeKey: "bad" })).toEqual(NOT_FOUND);
      expect(portal.revokeGccShare).toHaveBeenCalledTimes(1);
    });

    it("shares the read allowance", async () => {
      for (let i = 0; i < 60; i += 1) {
        gccLimits.shareRead.allow(VISITOR);
      }
      expect((await post({ action: "revoke", token: TOKEN, revokeKey: KEY })).status).toBe(429);
    });
  });
});
