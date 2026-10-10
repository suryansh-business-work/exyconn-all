import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PortalRequestError, portalRequest } from "../../../../src/lib/portal/client";

const PORTAL_URL = "https://portal.test/graphql";
const FIXTURES = fileURLToPath(new URL("./portal-fixture.ts", import.meta.url));

const answer = (body: unknown, status = 200) => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetch);
  return fetch;
};

beforeEach(() => {
  vi.stubEnv("PUBLIC_PORTAL_GRAPHQL_URL", PORTAL_URL);
  vi.stubEnv("PORTAL_FIXTURES", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("portal requests", () => {
  it("posts the operation and its variables as JSON and returns the data", async () => {
    const fetch = answer({ data: { publicNavLinks: [] } });

    await expect(portalRequest("query { publicNavLinks { id } }", { a: 1 })).resolves.toEqual({
      publicNavLinks: [],
    });
    expect(fetch).toHaveBeenCalledWith(PORTAL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "query { publicNavLinks { id } }", variables: { a: 1 } }),
    });
  });

  it("sends empty variables when none are given", async () => {
    const fetch = answer({ data: { ok: true } });
    await portalRequest("query { ok }");
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      query: "query { ok }",
      variables: {},
    });
  });

  it("throws on an HTTP failure", async () => {
    answer({}, 502);
    await expect(portalRequest("query { x }")).rejects.toThrow("Portal request failed: HTTP 502");
  });

  it("throws a PortalRequestError carrying every message and code", async () => {
    answer({
      errors: [
        { message: "Wrong answer", extensions: { code: "CAPTCHA_FAILED" } },
        { message: "Also this" },
      ],
    });

    const error = await portalRequest("mutation { x }").catch((error_: unknown) => error_);
    expect(error).toBeInstanceOf(PortalRequestError);
    expect(error).toMatchObject({
      name: "PortalRequestError",
      message: "Portal request failed: Wrong answer; Also this",
      codes: ["CAPTCHA_FAILED", ""],
    });
  });

  it("treats an empty error list as success", async () => {
    answer({ errors: [], data: { ok: true } });
    await expect(portalRequest("query { ok }")).resolves.toEqual({ ok: true });
  });

  it("throws when the portal answers without data", async () => {
    answer({});
    await expect(portalRequest("query { x }")).rejects.toThrow("Portal request returned no data.");
  });

  it("refuses to run without the portal URL", async () => {
    vi.stubEnv("PUBLIC_PORTAL_GRAPHQL_URL", "");
    const fetch = answer({ data: {} });
    await expect(portalRequest("query { x }")).rejects.toThrow(
      "PUBLIC_PORTAL_GRAPHQL_URL is not set"
    );
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("local design fixtures", () => {
  it("answers from the fixtures module instead of the portal in development", async () => {
    vi.stubEnv("PORTAL_FIXTURES", FIXTURES);
    const fetch = answer({ data: {} });

    await expect(portalRequest("query { publicTools { id } }", { slug: "x" })).resolves.toEqual({
      echoed: { query: "query { publicTools { id } }", variables: { slug: "x" } },
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("where the portal URL comes from", () => {
  it("falls back to the process environment when the build env does not carry it", async () => {
    vi.stubEnv("PUBLIC_PORTAL_GRAPHQL_URL", undefined);
    vi.stubGlobal("process", {
      ...process,
      env: { ...process.env, PUBLIC_PORTAL_GRAPHQL_URL: "https://runtime.test/graphql" },
    });
    const fetch = answer({ data: { ok: true } });

    await portalRequest("query { ok }");

    expect(fetch.mock.calls[0][0]).toBe("https://runtime.test/graphql");
  });

  it("ignores PORTAL_FIXTURES outside development, so a production build always asks the portal", async () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("PORTAL_FIXTURES", FIXTURES);
    const fetch = answer({ data: { fromPortal: true } });

    await expect(portalRequest("query { x }")).resolves.toEqual({ fromPortal: true });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe("PortalRequestError", () => {
  it("is an Error with the portal's codes", () => {
    const error = new PortalRequestError("refused", ["BAD_USER_INPUT"]);
    expect(error).toBeInstanceOf(Error);
    expect(error.codes).toEqual(["BAD_USER_INPUT"]);
  });
});
