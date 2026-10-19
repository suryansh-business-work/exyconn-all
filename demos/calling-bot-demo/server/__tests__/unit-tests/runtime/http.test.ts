import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import { describe, expect, it, vi } from 'vitest';
import { readBody, reply } from '../../../src/runtime/http';

const requestOf = (...chunks: string[]) =>
  Readable.from(chunks.map((chunk) => Buffer.from(chunk))) as unknown as IncomingMessage;

describe('reading a callback body', () => {
  it('reads a form-encoded body', async () => {
    await expect(readBody(requestOf('Status=completed&', 'CallUUID=abc'))).resolves.toEqual({
      Status: 'completed',
      CallUUID: 'abc',
    });
  });

  it('reads a JSON body as flat strings', async () => {
    await expect(readBody(requestOf('  {"Status":"busy","Duration":12}'))).resolves.toEqual({
      Status: 'busy',
      Duration: '12',
    });
  });

  it('reads an empty body as no fields', async () => {
    await expect(readBody(requestOf())).resolves.toEqual({});
  });

  it('refuses a body far bigger than any callback', async () => {
    const big = 'a'.repeat(40 * 1024);
    await expect(readBody(requestOf(big, big))).rejects.toThrow('Body too large');
  });
});

describe('replying', () => {
  const responseOf = () => {
    const response = { writeHead: vi.fn(), end: vi.fn() };
    return { response, asServer: response as unknown as ServerResponse };
  };

  it('sends plain text that is never cached by default', () => {
    const { response, asServer } = responseOf();
    reply(asServer, 404, 'Not found');
    expect(response.writeHead).toHaveBeenCalledWith(404, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    expect(response.end).toHaveBeenCalledWith('Not found');
  });

  it('sends the content type it is given', () => {
    const { response, asServer } = responseOf();
    reply(asServer, 200, '<Response/>', 'application/xml');
    expect(response.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': 'application/xml',
      'Cache-Control': 'no-store',
    });
  });
});
