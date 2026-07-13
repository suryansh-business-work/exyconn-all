import { Router } from "express";
import {
  sslCheckerController,
  mxRecordController,
  dnsLookupController,
  whoisController,
  domainExpiryController,
  nameserverController,
  domainAvailabilityController,
  ipLookupController,
  reverseIPController,
  httpHeadersController,
  websiteStatusController,
  pageSpeedController,
  blacklistCheckController,
  sslExpiryController,
  txtRecordController,
  cnameController,
  subdomainFinderController,
  domainAgeController,
  redirectCheckerController,
  openPortsController,
} from "./controllers";
import {
  domainValidator,
  urlValidator,
  ipValidator,
  dnsLookupValidator,
  redirectValidator,
  portsValidator,
} from "./validators";
import { validate } from "../../shared/middleware";

const router = Router();

// 2A - SSL Checker
router.post("/ssl-check", domainValidator, validate, sslCheckerController);

// 2B - MX Record Checker
router.post("/mx-records", domainValidator, validate, mxRecordController);

// 2C - DNS Lookup
router.post("/dns-lookup", dnsLookupValidator, validate, dnsLookupController);

// 2D - Whois Lookup
router.post("/whois", domainValidator, validate, whoisController);

// 2E - Domain Expiry Checker
router.post("/domain-expiry", domainValidator, validate, domainExpiryController);

// 2F - Nameserver Checker
router.post("/nameservers", domainValidator, validate, nameserverController);

// 2G - Domain Availability
router.post("/domain-availability", domainValidator, validate, domainAvailabilityController);

// 2H - IP Lookup
router.post("/ip-lookup", ipValidator, validate, ipLookupController);

// 2I - Reverse IP Lookup
router.post("/reverse-ip", ipValidator, validate, reverseIPController);

// 2J - HTTP Headers Check
router.post("/http-headers", urlValidator, validate, httpHeadersController);

// 2K - Website Status Checker
router.post("/website-status", urlValidator, validate, websiteStatusController);

// 2L - Page Speed Checker
router.post("/page-speed", urlValidator, validate, pageSpeedController);

// 2M - Blacklist Check
router.post("/blacklist-check", domainValidator, validate, blacklistCheckController);

// 2N - SSL Expiry Monitor
router.post("/ssl-expiry", domainValidator, validate, sslExpiryController);

// 2O - TXT Record Checker
router.post("/txt-records", domainValidator, validate, txtRecordController);

// 2P - CNAME Checker
router.post("/cname-check", domainValidator, validate, cnameController);

// 2Q - Subdomain Finder
router.post("/subdomains", domainValidator, validate, subdomainFinderController);

// 2R - Domain Age Checker
router.post("/domain-age", domainValidator, validate, domainAgeController);

// 2S - Redirect Checker
router.post("/redirect-check", redirectValidator, validate, redirectCheckerController);

// 2T - Open Ports Check
router.post("/open-ports", portsValidator, validate, openPortsController);

export default router;
