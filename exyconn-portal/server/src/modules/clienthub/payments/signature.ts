import { createHmac, timingSafeEqual } from 'node:crypto';

/** Constant-time comparison of two hex digests of the same length. */
export function sameHex(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  return left.length > 0 && left.length === right.length && timingSafeEqual(left, right);
}

export const hmacHex = (secret: string, payload: string | Buffer): string =>
  createHmac('sha256', secret).update(payload).digest('hex');
