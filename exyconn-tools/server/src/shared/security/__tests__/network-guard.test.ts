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

const lookupMock = vi.mocked(dns.lookup) as unknown as ReturnType<typeof vi.fn>;
const requestMock = vi.mocked(axios.request);

afterEach(() => {
  lookupMock.mockReset();
  requestMock.mockReset();
});

describe("isPublicAddress", () => {
  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "172.20.0.5",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "224.0.0.1",
    "255.255.255.255",
    "::1",
    "::",
    "::ffff:127.0.0.1",
    "fd00::1",
    "fe80::1",
    "ff02::1",
    "2002:7f00:1::",
  ])("rejects %s", (address) => {
    expect(isPublicAddress(address)).toBe(false);
  });

  it.each(["93.184.216.34", "1.1.1.1", "2606:4700:4700::1111"])(
    "accepts %s",
    (address) => {
      expect(isPublicAddress(address)).toBe(true);
    },
  );

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
    "http://[::1]/",
    "http://169.254.169.254/latest/meta-data/",
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
      { address: "93.184.216.34", family: 4 },
      { address: "10.0.0.8", family: 4 },
    ]);
    await expect(resolvePublicAddresses("mixed.example")).rejects.toThrow(
      UnsafeTargetError,
    );
  });

  it("returns every address of a public name", async () => {
    lookupMock.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
    await expect(resolvePublicAddresses("example.com")).resolves.toEqual([
      "93.184.216.34",
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
    lookupMock.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
    const addresses = await new Promise((resolve) => {
      publicOnlyLookup("example.com", { all: true }, (_err, result) =>
        resolve(result),
      );
    });
    expect(addresses).toEqual([{ address: "93.184.216.34", family: 4 }]);
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
        location: "http://169.254.169.254/latest/meta-data/",
      }) as never,
    );
    await expect(safeRequest("https://example.com/")).rejects.toThrow(
      UnsafeTargetError,
    );
    expect(requestMock).toHaveBeenCalledTimes(1);
  });

  it("follows at most five redirects", async () => {
    requestMock.mockResolvedValue(
      response(301, { location: "https://example.com/loop" }) as never,
    );
    await expect(safeRequest("https://example.com/")).rejects.toThrow(
      "status code 301",
    );
    expect(requestMock).toHaveBeenCalledTimes(6);
  });

  it("never lets axios follow redirects or use a proxy itself", async () => {
    requestMock.mockResolvedValueOnce(response(200) as never);
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
