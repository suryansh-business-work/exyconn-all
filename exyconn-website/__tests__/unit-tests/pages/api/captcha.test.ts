import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getCaptcha = vi.hoisted(() => vi.fn());
vi.mock("../../../../src/lib/portal", () => ({ getCaptcha }));

import { GET } from "../../../../src/pages/api/captcha";
import { readJson, routeContext } from "../route-helpers";

const get = async () => GET(routeContext(new Request("https://exyconn.com/api/captcha")));

beforeEach(() => {
  getCaptcha.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/captcha", () => {
  it("hands out a fresh question that no cache may keep", async () => {
    getCaptcha.mockResolvedValue({ token: "q-1", question: "What is 3 + 4?" });

    const response = await get();

    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(await readJson(response)).toEqual({
      status: 200,
      body: { token: "q-1", question: "What is 3 + 4?" },
    });
  });

  it("answers 503, logged, when the portal cannot give one", async () => {
    getCaptcha.mockRejectedValueOnce(new Error("portal down"));
    expect(await readJson(await get())).toEqual({
      status: 503,
      body: { error: "Could not load the security check" },
    });
    expect(console.error).toHaveBeenCalledWith("Could not load a captcha:", "portal down");

    getCaptcha.mockRejectedValueOnce("timeout");
    expect((await get()).status).toBe(503);
    expect(console.error).toHaveBeenCalledWith("Could not load a captcha:", "timeout");
  });
});
