import { Request, Response } from "express";
import {
  checkSSL,
  checkMXRecords,
  dnsLookup,
  whoisLookup,
  checkDomainExpiry,
  checkNameservers,
  checkDomainAvailability,
  ipLookup,
  reverseIPLookup,
  checkHTTPHeaders,
  checkWebsiteStatus,
  checkPageSpeed,
  checkBlacklist,
  checkSSLExpiry,
  checkTXTRecords,
  checkCNAME,
  findSubdomains,
  checkDomainAge,
  checkRedirects,
  checkOpenPorts,
} from "./services";

export const sslCheckerController = async (req: Request, res: Response) => {
  try {
    const { domain } = req.body;
    const result = await checkSSL(domain);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "SSL check failed",
    });
  }
};

export const mxRecordController = async (req: Request, res: Response) => {
  try {
    const { domain } = req.body;
    const result = await checkMXRecords(domain);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "MX record check failed",
    });
  }
};

export const dnsLookupController = async (req: Request, res: Response) => {
  try {
    const { domain, type = "ALL" } = req.body;
    const result = await dnsLookup(domain, type);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "DNS lookup failed",
    });
  }
};

export const whoisController = async (req: Request, res: Response) => {
  try {
    const { domain } = req.body;
    const result = await whoisLookup(domain);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Whois lookup failed",
    });
  }
};

export const domainExpiryController = async (req: Request, res: Response) => {
  try {
    const { domain } = req.body;
    const result = await checkDomainExpiry(domain);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Domain expiry check failed",
    });
  }
};

export const nameserverController = async (req: Request, res: Response) => {
  try {
    const { domain } = req.body;
    const result = await checkNameservers(domain);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Nameserver check failed",
    });
  }
};

export const domainAvailabilityController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { domain } = req.body;
    const result = await checkDomainAvailability(domain);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Availability check failed",
    });
  }
};

export const ipLookupController = async (req: Request, res: Response) => {
  try {
    const { ip } = req.body;
    const result = await ipLookup(ip);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "IP lookup failed",
    });
  }
};

export const reverseIPController = async (req: Request, res: Response) => {
  try {
    const { ip } = req.body;
    const result = await reverseIPLookup(ip);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Reverse IP lookup failed",
    });
  }
};

export const httpHeadersController = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    const result = await checkHTTPHeaders(url);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "HTTP headers check failed",
    });
  }
};

export const websiteStatusController = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    const result = await checkWebsiteStatus(url);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Website status check failed",
    });
  }
};

export const pageSpeedController = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    const result = await checkPageSpeed(url);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Page speed check failed",
    });
  }
};

export const blacklistCheckController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { domain } = req.body;
    const result = await checkBlacklist(domain);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Blacklist check failed",
    });
  }
};

export const sslExpiryController = async (req: Request, res: Response) => {
  try {
    const { domain } = req.body;
    const result = await checkSSLExpiry(domain);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "SSL expiry check failed",
    });
  }
};

export const txtRecordController = async (req: Request, res: Response) => {
  try {
    const { domain } = req.body;
    const result = await checkTXTRecords(domain);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "TXT record check failed",
    });
  }
};

export const cnameController = async (req: Request, res: Response) => {
  try {
    const { domain } = req.body;
    const result = await checkCNAME(domain);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "CNAME check failed",
    });
  }
};

export const subdomainFinderController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { domain } = req.body;
    const result = await findSubdomains(domain);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Subdomain finder failed",
    });
  }
};

export const domainAgeController = async (req: Request, res: Response) => {
  try {
    const { domain } = req.body;
    const result = await checkDomainAge(domain);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Domain age check failed",
    });
  }
};

export const redirectCheckerController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { url, maxRedirects = 10 } = req.body;
    const result = await checkRedirects(url, maxRedirects);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Redirect check failed",
    });
  }
};

export const openPortsController = async (req: Request, res: Response) => {
  try {
    const { host, ports } = req.body;
    const result = await checkOpenPorts(host, ports);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Port check failed",
    });
  }
};
