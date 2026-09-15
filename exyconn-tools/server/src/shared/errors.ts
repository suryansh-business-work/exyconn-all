/**
 * An error whose message is written for the person using the tool (bad input, a blocked
 * address, a site that could not be reached) and is safe to show in production.
 */
export class PublicError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicError";
  }
}

/**
 * Network failures while reaching the site the user asked about. Their messages describe
 * that site ("getaddrinfo ENOTFOUND example.com"), not this server, so they stay visible.
 */
const TARGET_ERROR_CODES = new Set([
  "ENOTFOUND",
  "EAI_AGAIN",
  "ECONNREFUSED",
  "ECONNRESET",
  "ECONNABORTED",
  "ETIMEDOUT",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ERR_BAD_REQUEST",
  "ERR_BAD_RESPONSE",
  "ERR_FR_TOO_MANY_REDIRECTS",
  "CERT_HAS_EXPIRED",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "ERR_TLS_CERT_ALTNAME_INVALID",
]);

function isTargetError(error: Error): boolean {
  const code = (error as NodeJS.ErrnoException).code;
  return typeof code === "string" && TARGET_ERROR_CODES.has(code);
}

/**
 * The message to put in an error response. Outside production it is the raw message, as
 * before; in production only messages meant for users get through, and anything else
 * (library internals, file paths, provider responses) is replaced by `fallback`.
 */
export function clientErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) {
    return fallback;
  }
  if (process.env.NODE_ENV !== "production") {
    return error.message;
  }
  if (error instanceof PublicError || isTargetError(error)) {
    return error.message;
  }
  return fallback;
}
