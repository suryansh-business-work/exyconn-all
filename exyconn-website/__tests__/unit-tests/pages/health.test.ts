import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "../../../src/pages/health";

const health = async () => {
  const response = await GET();
  return { response, body: (await response.json()) as Record<string, unknown> };
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("GET /health", () => {
  it("reports the website as up, never from a cache", async () => {
    vi.useFakeTimers({ now: new Date("2026-10-07T15:00:00Z"), toFake: ["Date"] });
    vi.stubEnv("NODE_ENV", "staging");

    const { response, body } = await health();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(response.headers.get("Cache-Control")).toBe("no-cache, no-store, must-revalidate");
    expect(body).toMatchObject({
      status: "ok",
      service: "exyconn-website",
      port: 4000,
      domain: "exyconn.com",
      environment: "staging",
      timestamp: "2026-10-07T15:00:00.000Z",
    });
    expect(body.uptime).toEqual(expect.any(Number));
    expect(body.memory).toEqual({
      heapUsed: expect.stringMatching(/^\d+MB$/),
      heapTotal: expect.stringMatching(/^\d+MB$/),
    });
  });

  it("calls an unnamed environment production", async () => {
    vi.stubEnv("NODE_ENV", "");
    expect((await health()).body.environment).toBe("production");
  });
});
