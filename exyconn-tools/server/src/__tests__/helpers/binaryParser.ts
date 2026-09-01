import type { Response } from "supertest";

/**
 * supertest response parser that buffers a binary body (PDF/image downloads).
 *
 * supertest types a custom parser's first argument as its `Response`, but at
 * runtime it receives the raw readable stream — hence the cast.
 */
export function binaryParser(
  res: Response,
  callback: (err: Error | null, body: Buffer) => void,
): void {
  const stream = res as unknown as NodeJS.ReadableStream;
  const chunks: Buffer[] = [];
  stream.on("data", (chunk: Buffer) => chunks.push(chunk));
  stream.on("end", () => callback(null, Buffer.concat(chunks)));
}
