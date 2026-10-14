import type { IncomingMessage, ServerResponse } from 'node:http';

/** Callback bodies are a few hundred bytes; anything far bigger is not Vobiz. */
const MAX_BODY_BYTES = 64 * 1024;

/** A request's form-encoded or JSON body as flat strings (Vobiz documents both). */
export async function readBody(request: IncomingMessage): Promise<Record<string, string>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) {
      throw new Error('Body too large');
    }
    chunks.push(chunk as Buffer);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  if (text.trim().startsWith('{')) {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, String(value)]));
  }
  return Object.fromEntries(new URLSearchParams(text));
}

export function reply(
  response: ServerResponse,
  status: number,
  body: string,
  contentType = 'text/plain; charset=utf-8',
): void {
  response.writeHead(status, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
  response.end(body);
}
