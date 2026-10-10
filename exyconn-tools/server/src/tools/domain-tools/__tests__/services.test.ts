import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type DnsCallback = (error: Error | null, result?: unknown) => void;

const mocks = vi.hoisted(() => {
  const dnsFn = () => vi.fn();
  return {
    dns: {
      resolveMx: dnsFn(),
      resolveTxt: dnsFn(),
      resolveNs: dnsFn(),
      resolveCname: dnsFn(),
      resolve4: dnsFn(),
      resolve6: dnsFn(),
      resolveSoa: dnsFn(),
      resolveSrv: dnsFn(),
      reverse: dnsFn(),
    },
    tlsConnect: vi.fn(),
    createConnection: vi.fn(),
    sockets: [] as unknown[],
    axiosGet: vi.fn(),
    safeRequest: vi.fn(),
    resolvePublicAddresses: vi.fn(),
  };
});

vi.mock("node:dns", () => ({ default: mocks.dns }));
vi.mock("node:tls", () => ({ default: { connect: mocks.tlsConnect } }));
vi.mock("node:net", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:net")>();
  const { EventEmitter: Emitter } = await import("node:events");
  class FakeSocket extends Emitter {
    connect = vi.fn();
    setTimeout = vi.fn();
    end = vi.fn();
    destroy = vi.fn();
    constructor() {
      super();
      mocks.sockets.push(this);
    }
  }
  return {
    default: {
      ...actual,
      createConnection: mocks.createConnection,
      Socket: FakeSocket,
    },
  };
});
vi.mock("axios", () => ({ default: { get: mocks.axiosGet } }));
vi.mock("../../../shared/security/safe-http", () => ({
  safeRequest: mocks.safeRequest,
}));
vi.mock("../../../shared/security/network-guard", () => ({
  resolvePublicAddresses: mocks.resolvePublicAddresses,
}));

import * as services from "../services";

type Lookup = (host: string) => unknown;

/** Makes one resolver answer from `lookup`; a returned Error is delivered as a failure. */
function resolver(fn: ReturnType<typeof vi.fn>, lookup: Lookup) {
  fn.mockImplementation((host: string, callback: DnsCallback) => {
    const answer = lookup(host);
    if (answer instanceof Error) {
      callback(answer);
    } else {
      callback(null, answer);
    }
  });
}

const NOT_FOUND = Object.assign(new Error("ENOTFOUND"), { code: "ENOTFOUND" });

beforeEach(() => {
  Object.values(mocks.dns).forEach((fn) => fn.mockReset());
  mocks.tlsConnect.mockReset();
  mocks.createConnection.mockReset();
  mocks.axiosGet.mockReset();
  mocks.safeRequest.mockReset();
  mocks.resolvePublicAddresses.mockReset().mockResolvedValue(["93.184.216.34"]);
  mocks.sockets.length = 0;
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-10T00:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("cleanDomain", () => {
  it("strips the protocol and anything after the first slash", () => {
    expect(services.cleanDomain("https://example.org/a/b")).toBe("example.org");
    expect(services.cleanDomain("http://example.org")).toBe("example.org");
    expect(services.cleanDomain("  example.org  ")).toBe("example.org");
  });

  it("only cuts a slash on the last line, as `.` does not cross a line break", () => {
    expect(services.cleanDomain("a.test/x\ny.test")).toBe("a.test/x\ny.test");
    expect(services.cleanDomain("a.test\nb.test/x")).toBe("a.test\nb.test");
  });
});

describe("DNS record checks", () => {
  it("lists MX records by priority", async () => {
    resolver(mocks.dns.resolveMx, () => [
      { exchange: "b", priority: 20 },
      { exchange: "a", priority: 10 },
    ]);

    await expect(
      services.checkMXRecords("https://example.org/"),
    ).resolves.toEqual({
      domain: "example.org",
      records: [
        { exchange: "a", priority: 10 },
        { exchange: "b", priority: 20 },
      ],
      count: 2,
    });
  });

  it("looks up every record type, an unknown one as empty", async () => {
    resolver(mocks.dns.resolve4, () => ["1.1.1.1"]);
    resolver(mocks.dns.resolve6, () => NOT_FOUND);
    resolver(mocks.dns.resolveMx, () => NOT_FOUND);
    resolver(mocks.dns.resolveTxt, () => NOT_FOUND);
    resolver(mocks.dns.resolveNs, () => NOT_FOUND);
    resolver(mocks.dns.resolveCname, () => NOT_FOUND);
    resolver(mocks.dns.resolveSoa, () => NOT_FOUND);
    resolver(mocks.dns.resolveSrv, () => NOT_FOUND);

    await expect(services.dnsLookup("example.org")).resolves.toEqual({
      domain: "example.org",
      A: ["1.1.1.1"],
      AAAA: [],
      MX: [],
      TXT: [],
      NS: [],
      CNAME: [],
      SOA: null,
      SRV: [],
    });
  });

  it("returns an empty list when the A lookup fails", async () => {
    resolver(mocks.dns.resolve4, () => NOT_FOUND);

    await expect(services.dnsLookup("example.org", "A")).resolves.toEqual({
      domain: "example.org",
      A: [],
    });
  });

  it("looks up one record type, and ignores a type it does not know", async () => {
    resolver(mocks.dns.resolveTxt, () => [["v=spf1 -all"]]);

    await expect(services.dnsLookup("example.org", "TXT")).resolves.toEqual({
      domain: "example.org",
      TXT: [["v=spf1 -all"]],
    });
    await expect(services.dnsLookup("example.org", "PTR")).resolves.toEqual({
      domain: "example.org",
    });
  });

  it("returns the successful answers of every lookup kind", async () => {
    resolver(mocks.dns.resolveSoa, () => ({ nsname: "ns1" }));
    await expect(
      services.dnsLookup("example.org", "SOA"),
    ).resolves.toMatchObject({
      SOA: { nsname: "ns1" },
    });
    resolver(mocks.dns.resolveSrv, () => [{ name: "s" }]);
    await expect(
      services.dnsLookup("example.org", "SRV"),
    ).resolves.toMatchObject({
      SRV: [{ name: "s" }],
    });
    resolver(mocks.dns.resolveMx, () => [{ exchange: "m", priority: 1 }]);
    await expect(
      services.dnsLookup("example.org", "MX"),
    ).resolves.toMatchObject({
      MX: [{ exchange: "m", priority: 1 }],
    });
    resolver(mocks.dns.resolve6, () => ["::1"]);
    await expect(
      services.dnsLookup("example.org", "AAAA"),
    ).resolves.toMatchObject({ AAAA: ["::1"] });
    resolver(mocks.dns.resolveNs, () => ["ns1"]);
    await expect(
      services.dnsLookup("example.org", "NS"),
    ).resolves.toMatchObject({ NS: ["ns1"] });
    resolver(mocks.dns.resolveCname, () => ["alias"]);
    await expect(
      services.dnsLookup("example.org", "CNAME"),
    ).resolves.toMatchObject({
      CNAME: ["alias"],
    });
  });

  it("resolves each nameserver's addresses, keeping one whose lookup fails", async () => {
    resolver(mocks.dns.resolveNs, () => ["ns1.test", "ns2.test"]);
    resolver(mocks.dns.resolve4, (host) =>
      host === "ns1.test" ? ["10.0.0.1"] : NOT_FOUND,
    );

    await expect(services.checkNameservers("example.org")).resolves.toEqual({
      domain: "example.org",
      nameservers: [
        { nameserver: "ns1.test", ips: ["10.0.0.1"] },
        { nameserver: "ns2.test", ips: [] },
      ],
      count: 2,
    });
  });

  it("calls a name with an address registered, and one without possibly available", async () => {
    resolver(mocks.dns.resolve4, () => ["1.2.3.4"]);
    await expect(
      services.checkDomainAvailability("taken.test"),
    ).resolves.toMatchObject({
      available: false,
      ips: ["1.2.3.4"],
    });

    resolver(mocks.dns.resolve4, () => NOT_FOUND);
    await expect(
      services.checkDomainAvailability("free.test"),
    ).resolves.toEqual({
      domain: "free.test",
      available: true,
      ips: [],
      message: "Domain might be available",
    });
  });

  it("reverses an address, or says there is no record", async () => {
    resolver(mocks.dns.reverse, () => ["host.test"]);
    await expect(services.reverseIPLookup("1.2.3.4")).resolves.toEqual({
      ip: "1.2.3.4",
      hostnames: ["host.test"],
      count: 1,
    });

    resolver(mocks.dns.reverse, () => NOT_FOUND);
    await expect(services.reverseIPLookup("1.2.3.4")).resolves.toEqual({
      ip: "1.2.3.4",
      hostnames: [],
      count: 0,
      message: "No reverse DNS records found",
    });
  });

  it("reports a CNAME, or that there is none", async () => {
    resolver(mocks.dns.resolveCname, () => ["target.test"]);
    await expect(services.checkCNAME("www.example.org")).resolves.toEqual({
      domain: "www.example.org",
      hasCNAME: true,
      records: ["target.test"],
    });

    resolver(mocks.dns.resolveCname, () => NOT_FOUND);
    await expect(services.checkCNAME("example.org")).resolves.toMatchObject({
      hasCNAME: false,
      message: "No CNAME records found",
    });
  });

  it("finds SPF, DKIM, DMARC and verification records", async () => {
    resolver(mocks.dns.resolveTxt, (host) => {
      if (host === "example.org") {
        return [
          ["v=spf1 include:_spf.test -all"],
          ["google-site-verification=abc"],
          ["other"],
        ];
      }
      if (host === "google._domainkey.example.org") {
        return [["v=DKIM1; k=rsa; ", "p=KEY"]];
      }
      if (host === "_dmarc.example.org") {
        return [["v=DMARC1; p=none"]];
      }
      return NOT_FOUND;
    });

    const result = await services.checkTXTRecords("example.org");

    expect(result.spf).toEqual(["v=spf1 include:_spf.test -all"]);
    expect(result.dkim).toEqual([
      { selector: "google", found: true, record: ["v=DKIM1; k=rsa; p=KEY"] },
    ]);
    expect(result.dmarc).toEqual(["v=DMARC1; p=none"]);
    expect(result.verificationRecords).toEqual([
      "v=spf1 include:_spf.test -all",
      "google-site-verification=abc",
    ]);
  });

  it("reports no DMARC record when the lookup fails", async () => {
    resolver(mocks.dns.resolveTxt, (host) =>
      host === "example.org" ? [["x"]] : NOT_FOUND,
    );

    await expect(
      services.checkTXTRecords("example.org"),
    ).resolves.toMatchObject({
      dmarc: [],
      dkim: [],
      spf: [],
    });
  });

  it("lists the common subdomains that resolve", async () => {
    resolver(mocks.dns.resolve4, (host) =>
      host === "www.example.org" || host === "api.example.org"
        ? ["9.9.9.9"]
        : NOT_FOUND,
    );

    const result = await services.findSubdomains("example.org");

    expect(result.totalFound).toBe(2);
    expect(result.subdomains.map((entry) => entry.subdomain)).toEqual([
      "www.example.org",
      "api.example.org",
    ]);
    expect(result.totalChecked).toBeGreaterThan(40);
  });
});

describe("blacklist check", () => {
  it("queries each blacklist with the reversed address", async () => {
    resolver(mocks.dns.resolve4, (host) => {
      if (host === "example.org") return ["1.2.3.4"];
      return host === "4.3.2.1.zen.spamhaus.org" ? ["127.0.0.2"] : NOT_FOUND;
    });

    const result = await services.checkBlacklist("example.org");

    expect(result).toMatchObject({
      ip: "1.2.3.4",
      listedCount: 1,
      isClean: false,
      totalChecked: 8,
    });
    expect(result.results.find((entry) => entry.listed)).toEqual({
      blacklist: "zen.spamhaus.org",
      listed: true,
      result: ["127.0.0.2"],
    });
  });

  it("is clean when nothing lists the address", async () => {
    resolver(mocks.dns.resolve4, (host) =>
      host === "example.org" ? ["1.2.3.4"] : NOT_FOUND,
    );

    await expect(services.checkBlacklist("example.org")).resolves.toMatchObject(
      { isClean: true },
    );
  });

  it("explains when the domain does not resolve", async () => {
    resolver(mocks.dns.resolve4, () => NOT_FOUND);

    await expect(services.checkBlacklist("nope.test")).rejects.toThrow(
      "Could not resolve domain to IP",
    );
  });
});

describe("whoisLookup", () => {
  const RDAP = {
    ldhName: "EXAMPLE.ORG",
    status: ["active"],
    events: [
      { eventAction: "registration", eventDate: "2016-10-10T00:00:00Z" },
      { eventAction: "expiration", eventDate: "2026-10-20T00:00:00Z" },
    ],
    nameservers: [{ ldhName: "ns1.test" }],
    entities: [
      {
        roles: ["registrar"],
        vcardArray: ["vcard", [["fn", {}, "text", "Big Registrar"]]],
      },
      {
        roles: ["registrant"],
        vcardArray: ["vcard", [["fn", {}, "text", "Ada"]]],
      },
    ],
  };

  it("summarises an RDAP answer", async () => {
    mocks.axiosGet.mockResolvedValue({ data: RDAP });

    const result = (await services.whoisLookup(
      "https://example.org",
    )) as Record<string, unknown>;

    expect(mocks.axiosGet).toHaveBeenCalledWith(
      "https://rdap.org/domain/example.org",
      {
        timeout: 15000,
      },
    );
    expect(result).toMatchObject({
      domain: "example.org",
      name: "EXAMPLE.ORG",
      nameservers: ["ns1.test"],
      registrar: "Big Registrar",
      registrant: "Ada",
    });
  });

  it("fills in defaults when RDAP leaves things out", async () => {
    mocks.axiosGet.mockResolvedValue({ data: {} });

    await expect(services.whoisLookup("example.org")).resolves.toMatchObject({
      name: "example.org",
      status: [],
      events: [],
      nameservers: [],
      registrar: "Unknown",
      registrant: "Private",
    });
  });

  function whoisSocket() {
    const socket = new EventEmitter() as EventEmitter & {
      write: ReturnType<typeof vi.fn>;
      end: ReturnType<typeof vi.fn>;
      setTimeout: ReturnType<typeof vi.fn>;
    };
    socket.write = vi.fn();
    socket.end = vi.fn();
    socket.setTimeout = vi.fn();
    mocks.createConnection.mockImplementation(
      (_port: number, _host: string, onConnect: () => void) => {
        queueMicrotask(onConnect);
        return socket;
      },
    );
    return socket;
  }

  it("falls back to a WHOIS query over TCP when RDAP fails", async () => {
    mocks.axiosGet.mockRejectedValue(new Error("rdap down"));
    const socket = whoisSocket();

    const pending = services.whoisLookup("ex\rample.org");
    await vi.advanceTimersByTimeAsync(0);
    socket.emit(
      "data",
      Buffer.from(
        "Domain Name: EXAMPLE.ORG\nNo colon here\nRegistrar: A: B\n:\n",
      ),
    );
    socket.emit("end");
    const result = (await pending) as {
      raw: string;
      parsed: Record<string, string>;
    };

    expect(socket.write).toHaveBeenCalledWith("example.org\r\n");
    expect(mocks.createConnection.mock.calls[0].slice(0, 2)).toEqual([
      43,
      "whois.verisign-grs.com",
    ]);
    expect(result.parsed).toEqual({
      "Domain Name": "EXAMPLE.ORG",
      Registrar: "A: B",
    });
  });

  it("rejects when the TCP fallback errors or times out", async () => {
    mocks.axiosGet.mockRejectedValue(new Error("rdap down"));
    const failing = whoisSocket();
    const first = services.whoisLookup("example.org");
    await vi.advanceTimersByTimeAsync(0);
    failing.emit("error", new Error("refused"));
    await expect(first).rejects.toThrow("refused");

    const slow = whoisSocket();
    const second = services.whoisLookup("example.org");
    await vi.advanceTimersByTimeAsync(0);
    const [, onTimeout] = slow.setTimeout.mock.calls[0] as [number, () => void];
    onTimeout();
    await expect(second).rejects.toThrow("Timeout");
    expect(slow.end).toHaveBeenCalled();
  });
});

describe("registration dates from the WHOIS fallback", () => {
  it("has no events or status to report, and says so", async () => {
    mocks.axiosGet.mockRejectedValue(new Error("rdap down"));
    const socket = new EventEmitter() as EventEmitter & Record<string, unknown>;
    socket.write = vi.fn();
    socket.setTimeout = vi.fn();
    mocks.createConnection.mockImplementation(
      (_p: number, _h: string, onConnect: () => void) => {
        queueMicrotask(onConnect);
        return socket;
      },
    );

    const expiry = services.checkDomainExpiry("example.org");
    await vi.advanceTimersByTimeAsync(0);
    socket.emit("end");
    await expect(expiry).resolves.toMatchObject({
      expiryDate: null,
      registrationDate: null,
      daysUntilExpiry: null,
      status: [],
    });

    const age = services.checkDomainAge("example.org");
    await vi.advanceTimersByTimeAsync(0);
    socket.emit("end");
    await expect(age).resolves.toMatchObject({
      age: null,
      message: "Registration date not found",
    });
  });
});

describe("registration dates", () => {
  it("reports expiry from the RDAP events", async () => {
    mocks.axiosGet.mockResolvedValue({
      data: {
        status: ["active"],
        events: [
          { eventAction: "registration", eventDate: "2016-10-10T00:00:00Z" },
          { eventAction: "expiration", eventDate: "2026-10-20T00:00:00Z" },
        ],
      },
    });

    await expect(services.checkDomainExpiry("example.org")).resolves.toEqual({
      domain: "example.org",
      expiryDate: "2026-10-20T00:00:00Z",
      registrationDate: "2016-10-10T00:00:00Z",
      daysUntilExpiry: 10,
      status: ["active"],
    });
  });

  it("reports no expiry when RDAP has none", async () => {
    mocks.axiosGet.mockResolvedValue({ data: { events: [] } });

    await expect(
      services.checkDomainExpiry("example.org"),
    ).resolves.toMatchObject({
      expiryDate: null,
      registrationDate: null,
      daysUntilExpiry: null,
      status: [],
    });
  });

  it("works out a domain's age in years, months and days", async () => {
    mocks.axiosGet.mockResolvedValue({
      data: {
        events: [
          { eventAction: "registration", eventDate: "2016-04-01T00:00:00Z" },
        ],
      },
    });

    const result = await services.checkDomainAge("example.org");

    expect(result).toMatchObject({
      domain: "example.org",
      registrationDate: "2016-04-01T00:00:00Z",
      age: { years: 10, months: 6, days: 8 },
      ageString: "10 years, 6 months, 8 days",
    });
    expect((result as { totalDays: number }).totalDays).toBe(3844);
  });

  it("says so when no registration date is published", async () => {
    mocks.axiosGet.mockResolvedValue({ data: {} });

    await expect(services.checkDomainAge("example.org")).resolves.toEqual({
      domain: "example.org",
      age: null,
      registrationDate: null,
      message: "Registration date not found",
    });
  });
});

describe("ipLookup", () => {
  it("returns the provider's answer for a valid address", async () => {
    mocks.axiosGet.mockResolvedValue({ data: { country: "US" } });

    await expect(services.ipLookup(" 8.8.8.8 ")).resolves.toEqual({
      country: "US",
    });
    expect(mocks.axiosGet.mock.calls[0][0]).toBe(
      "http://ip-api.com/json/8.8.8.8?fields=66846719",
    );
  });

  it("refuses text that is not an IP address", async () => {
    await expect(services.ipLookup("example.org")).rejects.toThrow(
      "Enter a valid IPv4 or IPv6 address",
    );
    expect(mocks.axiosGet).not.toHaveBeenCalled();
  });

  it("hides the provider's failure behind a fixed message", async () => {
    mocks.axiosGet.mockRejectedValue(new Error("429"));

    await expect(services.ipLookup("8.8.8.8")).rejects.toThrow(
      "Failed to lookup IP information",
    );
  });
});

describe("HTTP checks", () => {
  it("lists the security headers a site sets and the ones it lacks", async () => {
    mocks.safeRequest.mockResolvedValue({
      status: 200,
      headers: {
        "strict-transport-security": "max-age=1",
        server: "nginx",
        "content-type": "text/html",
      },
    });

    const result = await services.checkHTTPHeaders("https://example.org");

    expect(result).toMatchObject({
      statusCode: 200,
      server: "nginx",
      poweredBy: "Not disclosed",
      contentType: "text/html",
    });
    expect(result.missingSecurityHeaders).toEqual([
      "Content-Security-Policy",
      "X-Content-Type-Options",
      "X-Frame-Options",
      "X-XSS-Protection",
      "Referrer-Policy",
      "Permissions-Policy",
    ]);
  });

  it("names a site with no server headers as unknown", async () => {
    mocks.safeRequest.mockResolvedValue({ status: 204, headers: {} });

    await expect(
      services.checkHTTPHeaders("https://example.org"),
    ).resolves.toMatchObject({
      server: "Unknown",
      contentType: "Unknown",
    });
  });

  it("explains why headers could not be fetched", async () => {
    mocks.safeRequest.mockRejectedValueOnce(new Error("blocked address"));
    await expect(
      services.checkHTTPHeaders("https://example.org"),
    ).rejects.toThrow("Failed to fetch headers: blocked address");
    mocks.safeRequest.mockRejectedValueOnce("odd");
    await expect(
      services.checkHTTPHeaders("https://example.org"),
    ).rejects.toThrow("Failed to fetch headers: Unknown error");
  });

  it("reports a site as up, with its response details", async () => {
    mocks.safeRequest.mockResolvedValue({
      status: 301,
      statusText: "Moved",
      headers: {
        server: "nginx",
        "content-type": "text/html",
        "content-length": "12",
      },
    });

    await expect(
      services.checkWebsiteStatus("https://example.org"),
    ).resolves.toMatchObject({
      isUp: true,
      statusCode: 301,
      statusText: "Moved",
      server: "nginx",
      contentLength: "12",
    });
  });

  it("reports a 5xx as down and fills unknown headers", async () => {
    mocks.safeRequest.mockResolvedValue({
      status: 503,
      statusText: "Unavailable",
      headers: {},
    });

    await expect(
      services.checkWebsiteStatus("https://example.org"),
    ).resolves.toMatchObject({
      isUp: false,
      server: "Unknown",
      contentType: "Unknown",
      contentLength: "Unknown",
    });
  });

  it("reports an unreachable site as down with the reason", async () => {
    mocks.safeRequest.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    await expect(
      services.checkWebsiteStatus("https://example.org"),
    ).resolves.toMatchObject({
      isUp: false,
      statusCode: 0,
      statusText: "Connection Failed",
      error: "ECONNREFUSED",
    });

    mocks.safeRequest.mockRejectedValueOnce(42);
    await expect(
      services.checkWebsiteStatus("https://example.org"),
    ).resolves.toMatchObject({
      error: "Unknown error",
    });
  });

  it("counts a page's resources and rates its load time", async () => {
    const html =
      '<script></script><SCRIPT></SCRIPT><link rel="stylesheet" href="a.css"><img src=x><img src=y><p style="color:red">';
    mocks.safeRequest.mockImplementation(async () => {
      vi.setSystemTime(Date.now() + 500);
      return { data: html };
    });

    const result = await services.checkPageSpeed("https://example.org");

    expect(result).toMatchObject({
      loadTime: 500,
      pageSize: html.length,
      pageSizeFormatted: `${(html.length / 1024).toFixed(2)} KB`,
      resources: { scripts: 2, stylesheets: 1, images: 2, inlineStyles: 1 },
      performance: { rating: "Fast", ttfb: 500 },
    });
  });

  it.each([
    [1500, "Average"],
    [3500, "Slow"],
  ])("rates a %ims page as %s", async (elapsed, rating) => {
    mocks.safeRequest.mockImplementation(async () => {
      vi.setSystemTime(Date.now() + elapsed);
      return { data: "<p>x</p>" };
    });

    await expect(
      services.checkPageSpeed("https://example.org"),
    ).resolves.toMatchObject({
      performance: { rating },
    });
  });

  it("explains why a page could not be timed", async () => {
    mocks.safeRequest.mockRejectedValueOnce(new Error("timeout"));
    await expect(
      services.checkPageSpeed("https://example.org"),
    ).rejects.toThrow("Failed to check page speed: timeout");
    mocks.safeRequest.mockRejectedValueOnce(null);
    await expect(
      services.checkPageSpeed("https://example.org"),
    ).rejects.toThrow("Failed to check page speed: Unknown error");
  });
});

describe("status handling", () => {
  it("accepts every status in the checks that report on the status themselves", async () => {
    mocks.safeRequest.mockResolvedValue({
      status: 500,
      statusText: "",
      headers: {},
      data: "",
    });

    await services.checkHTTPHeaders("https://example.org");
    await services.checkWebsiteStatus("https://example.org");
    await services.checkRedirects("https://example.org");

    for (const [, config] of mocks.safeRequest.mock.calls) {
      expect(config.validateStatus(404)).toBe(true);
      expect(config.validateStatus(503)).toBe(true);
    }
  });
});

describe("checkRedirects", () => {
  it("follows relative and absolute redirects to the final page", async () => {
    mocks.safeRequest
      .mockResolvedValueOnce({ status: 301, headers: { location: "/next" } })
      .mockResolvedValueOnce({
        status: 302,
        headers: { location: "https://other.test/end" },
      })
      .mockResolvedValueOnce({ status: 200, headers: {} });

    const result = await services.checkRedirects("https://example.org/start");

    expect(result).toEqual({
      originalUrl: "https://example.org/start",
      finalUrl: "https://other.test/end",
      totalRedirects: 2,
      hasRedirects: true,
      chain: [
        {
          url: "https://example.org/start",
          statusCode: 301,
          location: "https://example.org/next",
        },
        {
          url: "https://example.org/next",
          statusCode: 302,
          location: "https://other.test/end",
        },
        { url: "https://other.test/end", statusCode: 200, location: "" },
      ],
    });
  });

  it("stops after the limit, and reports an error in the chain", async () => {
    mocks.safeRequest.mockResolvedValue({
      status: 301,
      headers: { location: "https://a.test/loop" },
    });
    const limited = await services.checkRedirects("https://a.test/loop", 3);
    expect(limited.chain).toHaveLength(3);

    mocks.safeRequest.mockReset();
    mocks.safeRequest.mockRejectedValueOnce(new Error("blocked"));
    const failed = await services.checkRedirects("https://a.test");
    expect(failed.chain).toEqual([
      { url: "https://a.test", statusCode: 0, location: "blocked" },
    ]);
    expect(failed.hasRedirects).toBe(false);

    mocks.safeRequest.mockRejectedValueOnce("x");
    const odd = await services.checkRedirects("https://a.test");
    expect(odd.chain[0].location).toBe("Error");
  });
});

describe("SSL checks", () => {
  function tlsSocket(cert: unknown, authorized = true) {
    const socket = new EventEmitter() as EventEmitter & Record<string, unknown>;
    socket.authorized = authorized;
    socket.getPeerCertificate = () => cert;
    socket.getProtocol = () => "TLSv1.3";
    socket.end = vi.fn();
    socket.setTimeout = vi.fn();
    mocks.tlsConnect.mockImplementation(
      (_options: unknown, onSecure: () => void) => {
        queueMicrotask(onSecure);
        return socket;
      },
    );
    return socket;
  }

  const CERT = {
    subject: { CN: "example.org" },
    issuer: { CN: "CA" },
    valid_from: "Sep 1 00:00:00 2026 GMT",
    valid_to: "Oct 30 00:00:00 2026 GMT",
    serialNumber: "01",
    fingerprint: "AA",
    fingerprint256: "BB",
    subjectaltname: "DNS:example.org, DNS:www.example.org",
  };

  it("connects to the vetted address with the host as server name", async () => {
    tlsSocket(CERT);

    const result = (await services.checkSSL("https://example.org/x")) as Record<
      string,
      unknown
    >;

    expect(mocks.tlsConnect.mock.calls[0][0]).toEqual({
      host: "93.184.216.34",
      port: 443,
      servername: "example.org",
    });
    expect(result).toMatchObject({
      valid: true,
      daysRemaining: 20,
      subjectAltNames: ["DNS:example.org", "DNS:www.example.org"],
      protocol: "TLSv1.3",
    });
  });

  it("sends no server name for an IP literal, and reports no alt names", async () => {
    tlsSocket({ ...CERT, subjectaltname: undefined }, false);

    const result = (await services.checkSSL("8.8.8.8")) as Record<
      string,
      unknown
    >;

    expect(mocks.tlsConnect.mock.calls[0][0].servername).toBeUndefined();
    expect(result).toMatchObject({ valid: false, subjectAltNames: [] });
  });

  it("rejects when the server presents no certificate", async () => {
    const socket = tlsSocket({});

    await expect(services.checkSSL("example.org")).rejects.toThrow(
      "No certificate found",
    );
    expect(socket.end).toHaveBeenCalled();
  });

  it("rejects on a socket error and on a timeout", async () => {
    const socket = new EventEmitter() as EventEmitter & Record<string, unknown>;
    socket.end = vi.fn();
    socket.setTimeout = vi.fn();
    mocks.tlsConnect.mockReturnValue(socket);

    const failing = services.checkSSL("example.org");
    await vi.advanceTimersByTimeAsync(0);
    socket.emit("error", new Error("ECONNRESET"));
    await expect(failing).rejects.toThrow("ECONNRESET");

    const slow = services.checkSSL("example.org");
    await vi.advanceTimersByTimeAsync(0);
    const [, onTimeout] = (
      socket.setTimeout as ReturnType<typeof vi.fn>
    ).mock.calls.at(-1) as [number, () => void];
    onTimeout();
    await expect(slow).rejects.toThrow("Connection timeout");
  });

  it.each([
    ["Oct 10 00:00:00 2026 GMT", "expired"],
    ["Oct 15 00:00:00 2026 GMT", "critical"],
    ["Oct 30 00:00:00 2026 GMT", "warning"],
    ["Dec 30 00:00:00 2026 GMT", "valid"],
  ])("rates a certificate expiring %s as %s", async (validTo, status) => {
    tlsSocket({ ...CERT, valid_to: validTo });

    await expect(services.checkSSLExpiry("example.org")).resolves.toMatchObject(
      {
        domain: "example.org",
        status,
      },
    );
  });
});

describe("checkOpenPorts", () => {
  /** Settles the nth socket the check created: connected, timed out or errored. */
  async function settle(index: number, event: "connect" | "timeout" | "error") {
    const socket = mocks.sockets[index] as EventEmitter;
    socket.emit(event);
  }

  it("scans the vetted address and reports each port's state", async () => {
    const pending = services.checkOpenPorts(
      "https://example.org/",
      [22, 80, 9999, 22],
    );
    await vi.advanceTimersByTimeAsync(0);
    expect(mocks.sockets).toHaveLength(3);
    await settle(0, "connect");
    await settle(1, "timeout");
    await settle(2, "error");

    const result = await pending;

    expect(
      (mocks.sockets[0] as { connect: ReturnType<typeof vi.fn> }).connect,
    ).toHaveBeenCalledWith(22, "93.184.216.34");
    expect(result).toMatchObject({
      host: "example.org",
      totalChecked: 3,
      openCount: 1,
      results: [
        { port: 22, status: "open", service: "SSH" },
        { port: 80, status: "filtered", service: "HTTP" },
        { port: 9999, status: "closed", service: "Unknown" },
      ],
    });
  });

  it("scans the common ports when none are given", async () => {
    const pending = services.checkOpenPorts("example.org");
    await vi.advanceTimersByTimeAsync(0);
    mocks.sockets.forEach((socket) => (socket as EventEmitter).emit("error"));

    const result = await pending;

    expect(result.totalChecked).toBe(17);
    expect(result.openCount).toBe(0);
  });

  it("refuses too many ports, and ports out of range", async () => {
    const tooMany = Array.from({ length: 21 }, (_, i) => i + 1);
    await expect(
      services.checkOpenPorts("example.org", tooMany),
    ).rejects.toThrow("Choose up to 20 ports between 1 and 65535");
    await expect(services.checkOpenPorts("example.org", [0])).rejects.toThrow(
      "Choose up to 20",
    );
    await expect(
      services.checkOpenPorts("example.org", [70000]),
    ).rejects.toThrow("Choose up to 20");
    await expect(services.checkOpenPorts("example.org", [1.5])).rejects.toThrow(
      "Choose up to 20",
    );
    expect(mocks.resolvePublicAddresses).not.toHaveBeenCalled();
  });
});
