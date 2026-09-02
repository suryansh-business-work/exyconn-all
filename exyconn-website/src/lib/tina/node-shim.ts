import type { IncomingMessage } from "node:http";

/**
 * TinaNodeBackend and Auth.js are written for Node/Next.js request and response objects. These
 * adapters expose exactly the surface they use on top of the Fetch API objects an Astro endpoint
 * works with, so the backend can run inside the Astro server.
 */

type HeaderValue = number | string | string[];

const decode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

function parseCookies(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const part of header?.split(";") ?? []) {
    const [name, ...rest] = part.trim().split("=");
    if (name) {
      cookies[name] = decode(rest.join("="));
    }
  }
  return cookies;
}

async function parseBody(request: Request): Promise<unknown> {
  if (request.method === "GET" || request.method === "HEAD") {
    return undefined;
  }
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    return request.json();
  }
  if (type.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(await request.text()));
  }
  return undefined;
}

/** A Node-style request carrying the parsed query, cookies and body the backend reads. */
export async function toNodeRequest(request: Request): Promise<IncomingMessage> {
  const url = new URL(request.url);
  const headers = Object.fromEntries(request.headers);
  const req = {
    method: request.method,
    url: `${url.pathname}${url.search}`,
    headers,
    query: Object.fromEntries(url.searchParams),
    cookies: parseCookies(headers.cookie),
    body: await parseBody(request),
  };
  return req as unknown as IncomingMessage;
}

/** Collects what the backend writes to a Node/Express-style response and turns it into a Response. */
export class NodeResponse {
  statusCode = 200;
  private readonly headers = new Map<string, HeaderValue>();
  private readonly chunks: string[] = [];

  status(code: number): this {
    this.statusCode = code;
    return this;
  }

  setHeader(name: string, value: HeaderValue): this {
    this.headers.set(name.toLowerCase(), value);
    return this;
  }

  getHeader(name: string): HeaderValue | undefined {
    return this.headers.get(name.toLowerCase());
  }

  removeHeader(name: string): void {
    this.headers.delete(name.toLowerCase());
  }

  write(chunk: string | Uint8Array): boolean {
    this.chunks.push(typeof chunk === "string" ? chunk : new TextDecoder().decode(chunk));
    return true;
  }

  end(chunk?: string | Uint8Array): this {
    if (chunk !== undefined) {
      this.write(chunk);
    }
    return this;
  }

  json(body: unknown): this {
    this.setHeader("content-type", "application/json");
    return this.end(JSON.stringify(body));
  }

  send(body: unknown): this {
    if (typeof body === "string") {
      return this.end(body);
    }
    if (body === undefined || body === null) {
      return this.end();
    }
    return this.json(body);
  }

  redirect(url: string): this {
    return this.status(302).setHeader("location", url).end();
  }

  toResponse(): Response {
    const headers = new Headers();
    for (const [name, value] of this.headers) {
      const values = Array.isArray(value) ? value : [String(value)];
      for (const entry of values) {
        headers.append(name, entry);
      }
    }
    const body = this.chunks.length > 0 ? this.chunks.join("") : null;
    return new Response(body, { status: this.statusCode, headers });
  }
}
