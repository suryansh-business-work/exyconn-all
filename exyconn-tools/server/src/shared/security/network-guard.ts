import dns from "node:dns/promises";
import { BlockList, isIP, type LookupFunction } from "node:net";
import { PublicError } from "../errors";

/**
 * Every tool that reaches out to a URL or host the visitor typed goes through this
 * module, so the public tools API can never be used to probe this server, the docker
 * network behind it, or the cloud metadata endpoint.
 */
export class UnsafeTargetError extends PublicError {
  constructor(message = "Only public websites can be checked") {
    super(message);
    this.name = "UnsafeTargetError";
  }
}

const BLOCKED_IPV4: ReadonlyArray<readonly [string, number]> = [
  ["0.0.0.0", 8], // "this" network / unspecified
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, cloud metadata
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // documentation
  ["192.88.99.0", 24], // 6to4 relay anycast
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // documentation
  ["203.0.113.0", 24], // documentation
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved + broadcast
];

const BLOCKED_IPV6: ReadonlyArray<readonly [string, number]> = [
  ["100::", 64], // discard
  ["2001::", 23], // IETF protocol assignments (Teredo, ORCHID, ...)
  ["2001:db8::", 32], // documentation
  ["2002::", 16], // 6to4 (embeds an arbitrary IPv4 address)
  ["fc00::", 7], // unique local
  ["fe80::", 10], // link-local
  ["fec0::", 10], // site-local (deprecated)
  ["ff00::", 8], // multicast
];

const blockList = new BlockList();
for (const [network, prefix] of BLOCKED_IPV4) {
  blockList.addSubnet(network, prefix, "ipv4");
}
for (const [network, prefix] of BLOCKED_IPV6) {
  blockList.addSubnet(network, prefix, "ipv6");
}

/**
 * ::/8 — unspecified, loopback, IPv4-mapped/compatible and the NAT64 prefix. Kept in its
 * own list and checked for IPv6 input only: BlockList matches IPv4 addresses against
 * IPv6 rules through their ::ffff: form, so in the main list it would block every IPv4.
 */
const embeddedIpv4BlockList = new BlockList();
embeddedIpv4BlockList.addSubnet("::", 8, "ipv6");

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const ALLOWED_PORTS = new Set(["", "80", "443", "8080", "8443"]);

/** True when `address` is an IP literal that belongs to the public internet. */
export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 0) {
    return false;
  }
  if (family === 4) {
    return !blockList.check(address, "ipv4");
  }
  return (
    !blockList.check(address, "ipv6") &&
    !embeddedIpv4BlockList.check(address, "ipv6")
  );
}

function stripBrackets(host: string): string {
  return host.startsWith("[") && host.endsWith("]") ? host.slice(1, -1) : host;
}

/**
 * Resolves `host` and returns its addresses, refusing the whole host if ANY address is
 * not public (a name that also points inward is not something we want to connect to).
 */
export async function resolvePublicAddresses(host: string): Promise<string[]> {
  const bare = stripBrackets(host.trim());
  if (!bare) {
    throw new UnsafeTargetError("A host name is required");
  }
  if (isIP(bare)) {
    if (!isPublicAddress(bare)) {
      throw new UnsafeTargetError();
    }
    return [bare];
  }
  const records = await dns.lookup(bare, { all: true, verbatim: true });
  if (
    records.length === 0 ||
    records.some((r) => !isPublicAddress(r.address))
  ) {
    throw new UnsafeTargetError();
  }
  return records.map((r) => r.address);
}

/**
 * A `lookup` for http(s) agents: the address is checked at connect time, on the exact
 * address the socket is about to use, so DNS rebinding between a check and the request
 * cannot slip a private address through. IP-literal hosts skip lookup entirely, which is
 * why `assertSafeUrl` checks those up front.
 */
export const publicOnlyLookup: LookupFunction = (
  hostname,
  options,
  callback,
) => {
  resolvePublicAddresses(hostname)
    .then((addresses) => {
      if (options.all) {
        callback(
          null,
          addresses.map((address) => ({ address, family: isIP(address) })),
        );
        return;
      }
      callback(null, addresses[0], isIP(addresses[0]));
    })
    .catch((error: NodeJS.ErrnoException) => callback(error, "", 0));
};

/** Parses a user URL and rejects anything but http(s) on a web port to a public IP literal or name. */
export function assertSafeUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new PublicError("Enter a full URL, including http:// or https://");
  }
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new UnsafeTargetError("Only http:// and https:// URLs are supported");
  }
  if (!ALLOWED_PORTS.has(url.port)) {
    throw new UnsafeTargetError(
      "Only the standard web ports (80, 443, 8080, 8443) are supported",
    );
  }
  if (url.username || url.password) {
    throw new UnsafeTargetError(
      "URLs with embedded credentials are not supported",
    );
  }
  const host = stripBrackets(url.hostname);
  if (isIP(host) && !isPublicAddress(host)) {
    throw new UnsafeTargetError();
  }
  return url;
}
