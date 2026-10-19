/** The calculator's portal operations: each sends its variables and returns its slice of `data`. */
import { beforeEach, describe, expect, it, vi } from "vitest";

const portalRequest = vi.hoisted(() => vi.fn());
vi.mock("../../../../src/lib/portal/client", () => ({ portalRequest }));

import {
  createGccShare,
  emailGccEstimate,
  getSharedGccEstimate,
  revokeGccShare,
} from "../../../../src/lib/portal/gcc";

const captcha = { token: "q-1", answer: "5" };
const lastCall = () => portalRequest.mock.calls.at(-1) as [string, Record<string, unknown>];

beforeEach(() => {
  portalRequest.mockReset();
});

describe("GCC portal operations", () => {
  it("emails an estimate and returns where it went", async () => {
    portalRequest.mockResolvedValue({ emailGccEstimate: { sentTo: "cfo@example.com" } });
    const input = { to: "cfo@example.com", estimateJson: "{}", note: "Hi" };
    expect(await emailGccEstimate(input, captcha)).toBe("cfo@example.com");
    expect(lastCall()[0]).toContain("emailGccEstimate(input: $input, captcha: $captcha)");
    expect(lastCall()[1]).toEqual({ input, captcha });
  });

  it("creates a share link and returns its token, key and expiry", async () => {
    const link = { token: "t", revokeKey: "k", expiresAt: "2026-11-01T00:00:00Z" };
    portalRequest.mockResolvedValue({ createGccShare: link });
    const input = { estimateJson: "{}", expiresInDays: 30, consent: true };
    expect(await createGccShare(input, captcha)).toEqual(link);
    expect(lastCall()[0]).toContain("createGccShare(input: $input, captcha: $captcha)");
    expect(lastCall()[1]).toEqual({ input, captcha });
  });

  it("reads a shared estimate, or null for a dead link", async () => {
    const shared = { estimateJson: "{}", expiresAt: "2026-11-01T00:00:00Z" };
    portalRequest.mockResolvedValueOnce({ sharedGccEstimate: shared });
    expect(await getSharedGccEstimate("abc")).toEqual(shared);
    expect(lastCall()[1]).toEqual({ token: "abc" });
    portalRequest.mockResolvedValueOnce({ sharedGccEstimate: null });
    expect(await getSharedGccEstimate("gone")).toBeNull();
  });

  it("revokes a link with its key and reports whether it did", async () => {
    portalRequest.mockResolvedValueOnce({ revokeGccShare: true });
    expect(await revokeGccShare("abc", "key")).toBe(true);
    expect(lastCall()[0]).toContain("revokeGccShare(token: $token, revokeKey: $revokeKey)");
    expect(lastCall()[1]).toEqual({ token: "abc", revokeKey: "key" });
    portalRequest.mockResolvedValueOnce({ revokeGccShare: false });
    expect(await revokeGccShare("abc", "wrong")).toBe(false);
  });

  it("lets a portal failure through to the caller", async () => {
    portalRequest.mockRejectedValue(new Error("Portal request failed: down"));
    await expect(revokeGccShare("abc", "key")).rejects.toThrow("down");
  });
});
