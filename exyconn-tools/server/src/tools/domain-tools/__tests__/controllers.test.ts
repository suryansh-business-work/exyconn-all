import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const services = vi.hoisted(() => ({
  checkSSL: vi.fn(),
  checkMXRecords: vi.fn(),
  dnsLookup: vi.fn(),
  whoisLookup: vi.fn(),
  checkDomainExpiry: vi.fn(),
  checkNameservers: vi.fn(),
  checkDomainAvailability: vi.fn(),
  ipLookup: vi.fn(),
  reverseIPLookup: vi.fn(),
  checkHTTPHeaders: vi.fn(),
  checkWebsiteStatus: vi.fn(),
  checkPageSpeed: vi.fn(),
  checkBlacklist: vi.fn(),
  checkSSLExpiry: vi.fn(),
  checkTXTRecords: vi.fn(),
  checkCNAME: vi.fn(),
  findSubdomains: vi.fn(),
  checkDomainAge: vi.fn(),
  checkRedirects: vi.fn(),
  checkOpenPorts: vi.fn(),
}));
vi.mock("../services", () => services);

import { mountRouter } from "../../../__tests__/helpers/mountRouter";
import { PublicError } from "../../../shared/errors";
import routes from "../routes";

const app = mountRouter(routes);

const DOMAIN = { domain: "example.org" };
const URL_BODY = { url: "https://example.org" };

const CASES: Array<[string, keyof typeof services, object, string]> = [
  ["/ssl-check", "checkSSL", DOMAIN, "SSL check failed"],
  ["/mx-records", "checkMXRecords", DOMAIN, "MX record check failed"],
  ["/dns-lookup", "dnsLookup", DOMAIN, "DNS lookup failed"],
  ["/whois", "whoisLookup", DOMAIN, "Whois lookup failed"],
  ["/domain-expiry", "checkDomainExpiry", DOMAIN, "Domain expiry check failed"],
  ["/nameservers", "checkNameservers", DOMAIN, "Nameserver check failed"],
  [
    "/domain-availability",
    "checkDomainAvailability",
    DOMAIN,
    "Availability check failed",
  ],
  ["/ip-lookup", "ipLookup", { ip: "8.8.8.8" }, "IP lookup failed"],
  [
    "/reverse-ip",
    "reverseIPLookup",
    { ip: "8.8.8.8" },
    "Reverse IP lookup failed",
  ],
  ["/http-headers", "checkHTTPHeaders", URL_BODY, "HTTP headers check failed"],
  [
    "/website-status",
    "checkWebsiteStatus",
    URL_BODY,
    "Website status check failed",
  ],
  ["/page-speed", "checkPageSpeed", URL_BODY, "Page speed check failed"],
  ["/blacklist-check", "checkBlacklist", DOMAIN, "Blacklist check failed"],
  ["/ssl-expiry", "checkSSLExpiry", DOMAIN, "SSL expiry check failed"],
  ["/txt-records", "checkTXTRecords", DOMAIN, "TXT record check failed"],
  ["/cname-check", "checkCNAME", DOMAIN, "CNAME check failed"],
  ["/subdomains", "findSubdomains", DOMAIN, "Subdomain finder failed"],
  ["/domain-age", "checkDomainAge", DOMAIN, "Domain age check failed"],
  ["/redirect-check", "checkRedirects", URL_BODY, "Redirect check failed"],
  [
    "/open-ports",
    "checkOpenPorts",
    { host: "example.org" },
    "Port check failed",
  ],
];

beforeEach(() => {
  Object.values(services).forEach((fn) => fn.mockReset());
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe.each(CASES)("POST %s", (path, service, body, fallback) => {
  it("returns the service result as data", async () => {
    services[service].mockResolvedValue({ ok: path });

    const res = await request(app).post(path).send(body);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { ok: path } });
  });

  it("answers 500 with a readable message when the check fails", async () => {
    vi.stubEnv("NODE_ENV", "production");
    services[service].mockRejectedValueOnce(new Error("internal detail"));
    const hidden = await request(app).post(path).send(body);
    services[service].mockRejectedValueOnce(
      new PublicError("That host is blocked"),
    );
    const shown = await request(app).post(path).send(body);
    vi.unstubAllEnvs();

    expect(hidden.status).toBe(500);
    expect(hidden.body).toEqual({ success: false, error: fallback });
    expect(shown.body).toEqual({
      success: false,
      error: "That host is blocked",
    });
  });
});

describe("request parameters", () => {
  it("passes the DNS record type, defaulting to ALL", async () => {
    services.dnsLookup.mockResolvedValue({});

    await request(app)
      .post("/dns-lookup")
      .send({ domain: "a.test", type: "MX" });
    await request(app).post("/dns-lookup").send({ domain: "a.test" });

    expect(services.dnsLookup.mock.calls).toEqual([
      ["a.test", "MX"],
      ["a.test", "ALL"],
    ]);
  });

  it("passes maxRedirects, defaulting to 10, and the ports", async () => {
    services.checkRedirects.mockResolvedValue({});
    services.checkOpenPorts.mockResolvedValue({});

    await request(app)
      .post("/redirect-check")
      .send({ url: "https://a.test", maxRedirects: 3 });
    await request(app).post("/redirect-check").send({ url: "https://a.test" });
    await request(app)
      .post("/open-ports")
      .send({ host: "a.test", ports: [80, 443] });

    expect(services.checkRedirects.mock.calls).toEqual([
      ["https://a.test", 3],
      ["https://a.test", 10],
    ]);
    expect(services.checkOpenPorts).toHaveBeenCalledWith("a.test", [80, 443]);
  });

  it("rejects bad input before any check runs", async () => {
    const noDomain = await request(app).post("/ssl-check").send({});
    const badType = await request(app)
      .post("/dns-lookup")
      .send({ domain: "a.test", type: "ZZZ" });
    const badPort = await request(app)
      .post("/open-ports")
      .send({ host: "a.test", ports: [0] });
    const noProtocol = await request(app)
      .post("/page-speed")
      .send({ url: "example.org" });

    expect([
      noDomain.status,
      badType.status,
      badPort.status,
      noProtocol.status,
    ]).toEqual([400, 400, 400, 400]);
    expect(services.checkSSL).not.toHaveBeenCalled();
  });
});
