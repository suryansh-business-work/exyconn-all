import { body } from "express-validator";

export const domainValidator = [
  body("domain")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Domain is required"),
];

export const urlValidator = [
  body("url")
    .isURL({ require_protocol: true })
    .withMessage("Valid URL with protocol required"),
];

export const ipValidator = [
  body("ip")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("IP address is required"),
];

export const dnsLookupValidator = [
  body("domain")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Domain is required"),
  body("type")
    .optional()
    .isIn(["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SOA", "SRV", "PTR", "ALL"])
    .withMessage("Invalid DNS record type"),
];

export const redirectValidator = [
  body("url")
    .isURL({ require_protocol: true })
    .withMessage("Valid URL with protocol required"),
  body("maxRedirects")
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage("Max redirects must be between 1 and 20"),
];

export const portsValidator = [
  body("host")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Host is required"),
  body("ports")
    .optional()
    .isArray()
    .withMessage("Ports must be an array"),
];
