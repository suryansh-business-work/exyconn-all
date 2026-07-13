import dns from "dns";
import { promisify } from "util";
import https from "https";
import http from "http";
import tls from "tls";
import net from "net";
import axios from "axios";

const resolveMx = promisify(dns.resolveMx);
const resolveTxt = promisify(dns.resolveTxt);
const resolveNs = promisify(dns.resolveNs);
const resolveCname = promisify(dns.resolveCname);
const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);
const resolveSoa = promisify(dns.resolveSoa);
const resolveSrv = promisify(dns.resolveSrv);
const reverse = promisify(dns.reverse);

// Helper: strip protocol from domain
function cleanDomain(input: string): string {
  return input.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();
}

// 2A - SSL Checker
export async function checkSSL(domain: string) {
  const host = cleanDomain(domain);
  return new Promise((resolve, reject) => {
    const socket = tls.connect(443, host, { servername: host }, () => {
      const cert = socket.getPeerCertificate();
      if (!cert || !cert.subject) {
        socket.end();
        return reject(new Error("No certificate found"));
      }
      const result = {
        valid: socket.authorized,
        subject: cert.subject,
        issuer: cert.issuer,
        validFrom: cert.valid_from,
        validTo: cert.valid_to,
        serialNumber: cert.serialNumber,
        fingerprint: cert.fingerprint,
        fingerprint256: cert.fingerprint256,
        daysRemaining: Math.floor(
          (new Date(cert.valid_to).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ),
        subjectAltNames: cert.subjectaltname?.split(", ") || [],
        protocol: socket.getProtocol(),
      };
      socket.end();
      resolve(result);
    });
    socket.on("error", (err) => reject(err));
    socket.setTimeout(10000, () => {
      socket.end();
      reject(new Error("Connection timeout"));
    });
  });
}

// 2B - MX Record Checker
export async function checkMXRecords(domain: string) {
  const host = cleanDomain(domain);
  const records = await resolveMx(host);
  return {
    domain: host,
    records: records.sort((a, b) => a.priority - b.priority),
    count: records.length,
  };
}

// 2C - DNS Lookup
export async function dnsLookup(domain: string, type: string = "ALL") {
  const host = cleanDomain(domain);
  const results: Record<string, unknown> = { domain: host };

  const lookups: Record<string, () => Promise<unknown>> = {
    A: async () => { try { return await resolve4(host); } catch { return []; } },
    AAAA: async () => { try { return await resolve6(host); } catch { return []; } },
    MX: async () => { try { return await resolveMx(host); } catch { return []; } },
    TXT: async () => { try { return await resolveTxt(host); } catch { return []; } },
    NS: async () => { try { return await resolveNs(host); } catch { return []; } },
    CNAME: async () => { try { return await resolveCname(host); } catch { return []; } },
    SOA: async () => { try { return await resolveSoa(host); } catch { return null; } },
    SRV: async () => { try { return await resolveSrv(host); } catch { return []; } },
  };

  if (type === "ALL") {
    const entries = await Promise.all(
      Object.entries(lookups).map(async ([key, fn]) => [key, await fn()])
    );
    entries.forEach(([key, value]) => { results[key as string] = value; });
  } else if (lookups[type]) {
    results[type] = await lookups[type]();
  }

  return results;
}

// 2D - Whois Lookup
export async function whoisLookup(domain: string) {
  const host = cleanDomain(domain);
  try {
    const response = await axios.get(
      `https://rdap.org/domain/${host}`,
      { timeout: 15000 }
    );
    const data = response.data;
    return {
      domain: host,
      name: data.ldhName || host,
      status: data.status || [],
      events: data.events || [],
      nameservers: data.nameservers?.map((ns: { ldhName: string }) => ns.ldhName) || [],
      registrar: data.entities?.find((e: { roles: string[] }) => e.roles?.includes("registrar"))?.vcardArray?.[1]?.find((v: string[]) => v[0] === "fn")?.[3] || "Unknown",
      registrant: data.entities?.find((e: { roles: string[] }) => e.roles?.includes("registrant"))?.vcardArray?.[1]?.find((v: string[]) => v[0] === "fn")?.[3] || "Private",
      raw: data,
    };
  } catch {
    // Fallback to simple WHOIS via TCP
    return new Promise((resolve, reject) => {
      const socket = net.createConnection(43, "whois.verisign-grs.com", () => {
        socket.write(`${host}\r\n`);
      });
      let data = "";
      socket.on("data", (chunk) => { data += chunk.toString(); });
      socket.on("end", () => {
        const lines = data.split("\n").filter((l) => l.includes(":"));
        const parsed: Record<string, string> = {};
        lines.forEach((line) => {
          const [key, ...val] = line.split(":");
          if (key && val.length) parsed[key.trim()] = val.join(":").trim();
        });
        resolve({ domain: host, raw: data, parsed });
      });
      socket.on("error", reject);
      socket.setTimeout(10000, () => { socket.end(); reject(new Error("Timeout")); });
    });
  }
}

// 2E - Domain Expiry Checker
export async function checkDomainExpiry(domain: string) {
  const whois = await whoisLookup(domain) as Record<string, unknown>;
  const events = (whois.events as Array<{ eventAction: string; eventDate: string }>) || [];
  const expiry = events.find((e) => e.eventAction === "expiration");
  const registration = events.find((e) => e.eventAction === "registration");

  return {
    domain: cleanDomain(domain),
    expiryDate: expiry?.eventDate || null,
    registrationDate: registration?.eventDate || null,
    daysUntilExpiry: expiry
      ? Math.floor((new Date(expiry.eventDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null,
    status: whois.status || [],
  };
}

// 2F - Nameserver Checker
export async function checkNameservers(domain: string) {
  const host = cleanDomain(domain);
  const nameservers = await resolveNs(host);
  const nsDetails = await Promise.all(
    nameservers.map(async (ns) => {
      try {
        const ips = await resolve4(ns);
        return { nameserver: ns, ips };
      } catch {
        return { nameserver: ns, ips: [] };
      }
    })
  );
  return { domain: host, nameservers: nsDetails, count: nameservers.length };
}

// 2G - Domain Availability
export async function checkDomainAvailability(domain: string) {
  const host = cleanDomain(domain);
  try {
    const ips = await resolve4(host);
    return { domain: host, available: false, ips, message: "Domain is registered" };
  } catch {
    return { domain: host, available: true, ips: [], message: "Domain might be available" };
  }
}

// 2H - IP Lookup 
export async function ipLookup(ip: string) {
  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=66846719`, {
      timeout: 10000,
    });
    return response.data;
  } catch {
    throw new Error("Failed to lookup IP information");
  }
}

// 2I - Reverse IP Lookup
export async function reverseIPLookup(ip: string) {
  try {
    const hostnames = await reverse(ip);
    return { ip, hostnames, count: hostnames.length };
  } catch {
    return { ip, hostnames: [], count: 0, message: "No reverse DNS records found" };
  }
}

// 2J - HTTP Headers Check
export async function checkHTTPHeaders(url: string): Promise<Record<string, unknown>> {
  try {
    const response = await axios.head(url, {
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: () => true,
    });
    const headers = response.headers;
    const securityHeaders = {
      "Strict-Transport-Security": headers["strict-transport-security"] || "Not set",
      "Content-Security-Policy": headers["content-security-policy"] || "Not set",
      "X-Content-Type-Options": headers["x-content-type-options"] || "Not set",
      "X-Frame-Options": headers["x-frame-options"] || "Not set",
      "X-XSS-Protection": headers["x-xss-protection"] || "Not set",
      "Referrer-Policy": headers["referrer-policy"] || "Not set",
      "Permissions-Policy": headers["permissions-policy"] || "Not set",
    };
    const missingSecurityHeaders = Object.entries(securityHeaders)
      .filter(([, v]) => v === "Not set")
      .map(([k]) => k);

    return {
      url,
      statusCode: response.status,
      headers: response.headers,
      securityHeaders,
      missingSecurityHeaders,
      server: headers["server"] || "Unknown",
      poweredBy: headers["x-powered-by"] || "Not disclosed",
      contentType: headers["content-type"] || "Unknown",
    };
  } catch (err) {
    throw new Error(`Failed to fetch headers: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
}

// 2K - Website Status Checker
export async function checkWebsiteStatus(url: string) {
  const start = Date.now();
  try {
    const response = await axios.get(url, {
      timeout: 30000,
      maxRedirects: 5,
      validateStatus: () => true,
    });
    const responseTime = Date.now() - start;
    return {
      url,
      isUp: response.status >= 200 && response.status < 400,
      statusCode: response.status,
      statusText: response.statusText,
      responseTime,
      server: response.headers["server"] || "Unknown",
      contentType: response.headers["content-type"] || "Unknown",
      contentLength: response.headers["content-length"] || "Unknown",
    };
  } catch (err) {
    return {
      url,
      isUp: false,
      statusCode: 0,
      statusText: "Connection Failed",
      responseTime: Date.now() - start,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// 2L - Page Speed Checker
export async function checkPageSpeed(url: string) {
  const start = Date.now();
  try {
    const response = await axios.get(url, {
      timeout: 30000,
      maxRedirects: 5,
    });
    const loadTime = Date.now() - start;
    const html = response.data as string;
    const size = Buffer.byteLength(html, "utf8");

    const scriptCount = (html.match(/<script/gi) || []).length;
    const styleCount = (html.match(/<link[^>]+stylesheet/gi) || []).length;
    const imageCount = (html.match(/<img/gi) || []).length;
    const inlineStyleCount = (html.match(/style="/gi) || []).length;

    return {
      url,
      loadTime,
      pageSize: size,
      pageSizeFormatted: `${(size / 1024).toFixed(2)} KB`,
      resources: {
        scripts: scriptCount,
        stylesheets: styleCount,
        images: imageCount,
        inlineStyles: inlineStyleCount,
      },
      performance: {
        rating: loadTime < 1000 ? "Fast" : loadTime < 3000 ? "Average" : "Slow",
        ttfb: loadTime,
      },
    };
  } catch (err) {
    throw new Error(`Failed to check page speed: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
}

// 2M - Blacklist Check
export async function checkBlacklist(domain: string) {
  const host = cleanDomain(domain);
  let ip: string;
  try {
    const ips = await resolve4(host);
    ip = ips[0];
  } catch {
    throw new Error("Could not resolve domain to IP");
  }

  const blacklists = [
    "zen.spamhaus.org",
    "bl.spamcop.net",
    "b.barracudacentral.org",
    "dnsbl.sorbs.net",
    "spam.dnsbl.sorbs.net",
    "cbl.abuseat.org",
    "dnsbl-1.uceprotect.net",
    "psbl.surriel.com",
  ];

  const reversedIP = ip.split(".").reverse().join(".");
  const results = await Promise.all(
    blacklists.map(async (bl) => {
      try {
        const result = await resolve4(`${reversedIP}.${bl}`);
        return { blacklist: bl, listed: true, result };
      } catch {
        return { blacklist: bl, listed: false, result: [] };
      }
    })
  );

  const listedCount = results.filter((r) => r.listed).length;
  return {
    domain: host,
    ip,
    results,
    totalChecked: blacklists.length,
    listedCount,
    isClean: listedCount === 0,
  };
}

// 2N - SSL Expiry Monitor
export async function checkSSLExpiry(domain: string) {
  const ssl = await checkSSL(domain) as Record<string, unknown>;
  const daysRemaining = ssl.daysRemaining as number;
  let status = "valid";
  if (daysRemaining <= 0) status = "expired";
  else if (daysRemaining <= 7) status = "critical";
  else if (daysRemaining <= 30) status = "warning";

  return {
    domain: cleanDomain(domain),
    validFrom: ssl.validFrom,
    validTo: ssl.validTo,
    daysRemaining,
    status,
    issuer: ssl.issuer,
    subject: ssl.subject,
  };
}

// 2O - TXT Record Checker
export async function checkTXTRecords(domain: string) {
  const host = cleanDomain(domain);
  const records = await resolveTxt(host);
  const flatRecords = records.map((r) => r.join(""));

  const spfRecords = flatRecords.filter((r) => r.startsWith("v=spf1"));
  const dkimSelectors = ["default", "google", "k1", "selector1", "selector2"];
  const dkimResults = await Promise.all(
    dkimSelectors.map(async (sel) => {
      try {
        const result = await resolveTxt(`${sel}._domainkey.${host}`);
        return { selector: sel, found: true, record: result.map((r) => r.join("")) };
      } catch {
        return { selector: sel, found: false, record: [] };
      }
    })
  );
  const dmarcRecords = await (async () => {
    try {
      const result = await resolveTxt(`_dmarc.${host}`);
      return result.map((r) => r.join(""));
    } catch {
      return [];
    }
  })();

  return {
    domain: host,
    txtRecords: flatRecords,
    spf: spfRecords,
    dkim: dkimResults.filter((d) => d.found),
    dmarc: dmarcRecords,
    verificationRecords: flatRecords.filter(
      (r) => r.includes("google-site-verification") || r.includes("v=") || r.includes("MS=")
    ),
  };
}

// 2P - CNAME Checker
export async function checkCNAME(domain: string) {
  const host = cleanDomain(domain);
  try {
    const records = await resolveCname(host);
    return { domain: host, hasCNAME: true, records };
  } catch {
    return { domain: host, hasCNAME: false, records: [], message: "No CNAME records found" };
  }
}

// 2Q - Subdomain Finder
export async function findSubdomains(domain: string) {
  const host = cleanDomain(domain);
  const commonSubdomains = [
    "www", "mail", "ftp", "smtp", "pop", "imap", "webmail", "admin",
    "blog", "shop", "store", "api", "dev", "staging", "test", "app",
    "portal", "secure", "cdn", "media", "images", "static", "assets",
    "docs", "support", "help", "forum", "community", "status", "monitor",
    "dashboard", "m", "mobile", "ns1", "ns2", "dns", "vpn", "remote",
    "login", "auth", "sso", "oauth", "git", "gitlab", "jenkins", "ci",
  ];

  const results = await Promise.all(
    commonSubdomains.map(async (sub) => {
      const subdomain = `${sub}.${host}`;
      try {
        const ips = await resolve4(subdomain);
        return { subdomain, found: true, ips };
      } catch {
        return { subdomain, found: false, ips: [] };
      }
    })
  );

  const found = results.filter((r) => r.found);
  return {
    domain: host,
    subdomains: found,
    totalChecked: commonSubdomains.length,
    totalFound: found.length,
  };
}

// 2R - Domain Age Checker
export async function checkDomainAge(domain: string) {
  const whois = await whoisLookup(domain) as Record<string, unknown>;
  const events = (whois.events as Array<{ eventAction: string; eventDate: string }>) || [];
  const registration = events.find((e) => e.eventAction === "registration");

  if (!registration) {
    return {
      domain: cleanDomain(domain),
      age: null,
      registrationDate: null,
      message: "Registration date not found",
    };
  }

  const regDate = new Date(registration.eventDate);
  const now = new Date();
  const diffMs = now.getTime() - regDate.getTime();
  const years = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
  const months = Math.floor((diffMs % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));
  const days = Math.floor((diffMs % (1000 * 60 * 60 * 24 * 30.44)) / (1000 * 60 * 60 * 24));

  return {
    domain: cleanDomain(domain),
    registrationDate: registration.eventDate,
    age: { years, months, days },
    ageString: `${years} years, ${months} months, ${days} days`,
    totalDays: Math.floor(diffMs / (1000 * 60 * 60 * 24)),
  };
}

// 2S - Redirect Checker
export async function checkRedirects(url: string, maxRedirects: number = 10) {
  const redirects: Array<{
    url: string;
    statusCode: number;
    location: string;
  }> = [];

  let currentUrl = url;
  for (let i = 0; i < maxRedirects; i++) {
    try {
      const response = await axios.get(currentUrl, {
        maxRedirects: 0,
        validateStatus: () => true,
        timeout: 10000,
      });

      if (response.status >= 300 && response.status < 400 && response.headers.location) {
        const location = response.headers.location.startsWith("http")
          ? response.headers.location
          : new URL(response.headers.location, currentUrl).href;
        redirects.push({
          url: currentUrl,
          statusCode: response.status,
          location,
        });
        currentUrl = location;
      } else {
        redirects.push({
          url: currentUrl,
          statusCode: response.status,
          location: "",
        });
        break;
      }
    } catch (err) {
      redirects.push({
        url: currentUrl,
        statusCode: 0,
        location: err instanceof Error ? err.message : "Error",
      });
      break;
    }
  }

  return {
    originalUrl: url,
    finalUrl: currentUrl,
    totalRedirects: redirects.length - 1,
    chain: redirects,
    hasRedirects: redirects.length > 1,
  };
}

// 2T - Open Ports Check
export async function checkOpenPorts(
  host: string,
  ports?: number[]
) {
  const cleanHost = cleanDomain(host);
  const defaultPorts = [21, 22, 25, 53, 80, 110, 143, 443, 465, 587, 993, 995, 3306, 3389, 5432, 8080, 8443];
  const portsToCheck = ports && ports.length > 0 ? ports : defaultPorts;

  const results = await Promise.all(
    portsToCheck.map(
      (port) =>
        new Promise<{ port: number; status: string; service: string }>((resolve) => {
          const socket = new net.Socket();
          socket.setTimeout(3000);
          socket.on("connect", () => {
            socket.end();
            resolve({ port, status: "open", service: getServiceName(port) });
          });
          socket.on("timeout", () => {
            socket.destroy();
            resolve({ port, status: "filtered", service: getServiceName(port) });
          });
          socket.on("error", () => {
            resolve({ port, status: "closed", service: getServiceName(port) });
          });
          socket.connect(port, cleanHost);
        })
    )
  );

  const openPorts = results.filter((r) => r.status === "open");
  return {
    host: cleanHost,
    results,
    totalChecked: portsToCheck.length,
    openCount: openPorts.length,
    openPorts,
  };
}

function getServiceName(port: number): string {
  const services: Record<number, string> = {
    21: "FTP", 22: "SSH", 25: "SMTP", 53: "DNS", 80: "HTTP",
    110: "POP3", 143: "IMAP", 443: "HTTPS", 465: "SMTPS",
    587: "SMTP (Submission)", 993: "IMAPS", 995: "POP3S",
    3306: "MySQL", 3389: "RDP", 5432: "PostgreSQL",
    8080: "HTTP Proxy", 8443: "HTTPS Alt",
  };
  return services[port] || "Unknown";
}
