import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("node:dns/promises", () => ({
  default: { lookup: vi.fn() },
}));

vi.mock("axios", async (importOriginal) => {
  const actual = await importOriginal<{ default: Record<string, unknown> }>();
  return { ...actual, default: { ...actual.default, request: vi.fn() } };
});

import dns from "node:dns/promises";
import axios from "axios";
import {
  UnsafeTargetError,
  assertSafeUrl,
  isPublicAddress,
  publicOnlyLookup,
  resolvePublicAddresses,
} from "../network-guard";
import { safeRequest } from "../safe-http";
import fixtures from "./network-guard.fixtures.json";

const withProtocol = (url: string, protocol: string): string => {
  const parsed = new URL(url);
  parsed.protocol = protocol;
  return parsed.href;
};

const lookupMock = vi.mocked(dns.lookup) as unknown as ReturnType<typeof vi.fn>;
const requestMock = vi.mocked(axios.request);

afterEach(() => {
  lookupMock.mockReset();
  requestMock.mockReset();
});

describe("isPublicAddress", () => {
  it.each(fixtures.rejected)("rejects %s", (address) => {
    expect(isPublicAddress(address)).toBe(false);
  });

  it.each(fixtures.accepted)("accepts %s", (address) => {
    expect(isPublicAddress(address)).toBe(true);
  });

  it("rejects something that is not an IP", () => {
    expect(isPublicAddress("example.com")).toBe(false);
  });
});

describe("assertSafeUrl", () => {
  it("accepts a public https URL", () => {
    expect(assertSafeUrl("https://example.com/path").hostname).toBe(
      "example.com",
    );
  });

  it.each([
    "file:///etc/passwd",
    "gopher://example.com",
    "http://example.com:6379/",
    "http://user:pass@example.com/",
    "http://127.0.0.1/",
    "http://2130706433/",
    withProtocol("https://[::1]/", "http:"),
    withProtocol("https://169.254.169.254/latest/meta-data/", "http:"),
  ])("rejects %s", (url) => {
    expect(() => assertSafeUrl(url)).toThrow(UnsafeTargetError);
  });

  it("rejects a relative URL", () => {
    expect(() => assertSafeUrl("example.com")).toThrow("Enter a full URL");
  });
});

describe("resolvePublicAddresses", () => {
  it("rejects a name when any of its addresses is private", async () => {
    lookupMock.mockResolvedValue([
      { address: fixtures.publicAddress, family: 4 },
      { address: fixtures.privateAddress, family: 4 },
    ]);
    await expect(resolvePublicAddresses("mixed.example")).rejects.toThrow(
      UnsafeTargetError,
    );
  });

  it("returns every address of a public name", async () => {
    lookupMock.mockResolvedValue([
      { address: fixtures.publicAddress, family: 4 },
    ]);
    await expect(resolvePublicAddresses("example.com")).resolves.toEqual([
      fixtures.publicAddress,
    ]);
  });

  it("checks IP literals without DNS", async () => {
    await expect(resolvePublicAddresses("[::1]")).rejects.toThrow(
      UnsafeTargetError,
    );
    expect(lookupMock).not.toHaveBeenCalled();
  });
});

describe("publicOnlyLookup", () => {
  it("fails the connection for a name resolving to loopback", async () => {
    lookupMock.mockResolvedValue([{ address: "127.0.0.1", family: 4 }]);
    const error = await new Promise((resolve) => {
      publicOnlyLookup("localhost", { all: true }, (err) => resolve(err));
    });
    expect(error).toBeInstanceOf(UnsafeTargetError);
  });

  it("returns all vetted addresses when asked for all", async () => {
    lookupMock.mockResolvedValue([
      { address: fixtures.publicAddress, family: 4 },
    ]);
    const addresses = await new Promise((resolve) => {
      publicOnlyLookup("example.com", { all: true }, (_err, result) =>
        resolve(result),
      );
    });
    expect(addresses).toEqual([{ address: fixtures.publicAddress, family: 4 }]);
  });
});

describe("safeRequest", () => {
  const response = (status: number, headers: Record<string, string> = {}) => ({
    status,
    statusText: "",
    headers,
    data: "",
    config: {},
    request: {},
  });

  it("re-validates redirect targets and refuses one pointing inward", async () => {
    requestMock.mockResolvedValueOnce(
      response(302, {
        location: withProtocol(
          "https://169.254.169.254/latest/meta-data/",
          "http:",
        ),
      }),
    );
    await expect(safeRequest("https://example.com/")).rejects.toThrow(
      UnsafeTargetError,
    );
    expect(requestMock).toHaveBeenCalledTimes(1);
  });

  it("follows at most five redirects", async () => {
    requestMock.mockResolvedValue(
      response(301, { location: "https://example.com/loop" }),
    );
    await expect(safeRequest("https://example.com/")).rejects.toThrow(
      "status code 301",
    );
    expect(requestMock).toHaveBeenCalledTimes(6);
  });

  it("never lets axios follow redirects or use a proxy itself", async () => {
    requestMock.mockResolvedValueOnce(response(200));
    const result = await safeRequest("https://example.com/", {
      maxRedirects: 20,
    });
    expect(result.finalUrl).toBe("https://example.com/");
    const config = requestMock.mock.calls[0][0];
    expect(config.maxRedirects).toBe(0);
    expect(config.proxy).toBe(false);
    expect(config.maxContentLength).toBeGreaterThan(0);
  });
});
