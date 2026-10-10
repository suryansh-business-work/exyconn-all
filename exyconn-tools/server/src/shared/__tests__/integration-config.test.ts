import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const lean = vi.fn();
  const findOne = vi.fn(() => ({ lean }));
  return {
    lean,
    findOne,
    connect: vi.fn(),
    model: vi.fn(() => ({ findOne })),
    models: {} as Record<string, unknown>,
    Schema: vi.fn(),
  };
});

vi.mock("mongoose", () => ({
  default: {
    connect: mocks.connect,
    model: mocks.model,
    models: mocks.models,
  },
  Schema: mocks.Schema,
}));

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-10T10:00:00Z"));
  mocks.lean.mockReset();
  mocks.findOne.mockClear();
  mocks.connect.mockReset().mockResolvedValue(undefined);
  mocks.model.mockClear();
  mocks.Schema.mockClear();
  for (const key of Object.keys(mocks.models)) {
    delete mocks.models[key];
  }
  vi.stubEnv("MONGODB_URI", "mongodb://db.test/portal");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("integration config", () => {
  it("reads the active email account from the portal's collection and caches it for a minute", async () => {
    const email = { host: "smtp.test", port: 587 };
    mocks.lean.mockResolvedValue(email);
    const { getActiveEmailConfig } =
      await import("../services/integration-config.js");

    await expect(getActiveEmailConfig()).resolves.toBe(email);
    await expect(getActiveEmailConfig()).resolves.toBe(email);

    expect(mocks.connect).toHaveBeenCalledWith("mongodb://db.test/portal");
    expect(mocks.findOne).toHaveBeenCalledTimes(1);
    expect(mocks.findOne).toHaveBeenCalledWith({ isActive: true });

    vi.setSystemTime(new Date("2026-10-10T10:01:01Z"));
    await getActiveEmailConfig();
    expect(mocks.findOne).toHaveBeenCalledTimes(2);
  });

  it("reads the image account the same way, from its own collection", async () => {
    mocks.lean.mockResolvedValue({ publicKey: "pub" });
    const { getActiveImageConfig } =
      await import("../services/integration-config.js");

    await expect(getActiveImageConfig()).resolves.toEqual({ publicKey: "pub" });
    expect(mocks.Schema).toHaveBeenCalledTimes(2);
    expect(mocks.Schema.mock.calls.map((call) => call[1])).toEqual([
      { collection: "emailconfigs", strict: false },
      { collection: "imageconfigs", strict: false },
    ]);
  });

  it("reuses models mongoose already holds", async () => {
    const existing = { findOne: mocks.findOne };
    mocks.models.EmailConfig = existing;
    mocks.models.ImageConfig = existing;
    mocks.lean.mockResolvedValue({ host: "h" });
    const { getActiveEmailConfig } =
      await import("../services/integration-config.js");

    await getActiveEmailConfig();

    expect(mocks.model).not.toHaveBeenCalled();
  });

  it("explains how to fix it when no account is active", async () => {
    mocks.lean.mockResolvedValue(null);
    const { getActiveImageConfig } =
      await import("../services/integration-config.js");

    await expect(getActiveImageConfig()).rejects.toThrow(
      "No active image configuration. Add one in the portal under Admin > Environment Variables.",
    );
  });

  it("refuses to connect without MONGODB_URI, and retries rather than caching the failure", async () => {
    vi.stubEnv("MONGODB_URI", "");
    const { getActiveEmailConfig } =
      await import("../services/integration-config.js");

    await expect(getActiveEmailConfig()).rejects.toThrow(
      "MONGODB_URI is not set",
    );

    vi.stubEnv("MONGODB_URI", "mongodb://db.test/portal");
    mocks.lean.mockResolvedValue({ host: "h" });
    await expect(getActiveEmailConfig()).resolves.toEqual({ host: "h" });
  });
});
