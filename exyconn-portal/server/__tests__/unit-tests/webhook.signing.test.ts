import {
  MAX_ATTEMPTS,
  nextAttemptAfter,
  signPayload,
  verifySignature,
} from '../../src/modules/integrations/webhook.signing';
import { generateApiKey, hashApiKey } from '../../src/modules/integrations/api-key.service';

const SECRET = 'whsec_test';
const BODY = '{"event":"invoice.paid"}';
const TS = '1772000000';

describe('webhook signing', () => {
  it('produces a stable sha256= signature', () => {
    const signature = signPayload(SECRET, TS, BODY);

    expect(signature.startsWith('sha256=')).toBe(true);
    expect(signPayload(SECRET, TS, BODY)).toBe(signature);
  });

  it('verifies its own signature', () => {
    expect(verifySignature(SECRET, TS, BODY, signPayload(SECRET, TS, BODY))).toBe(true);
  });

  it('rejects a body that changed by one byte', () => {
    const signature = signPayload(SECRET, TS, BODY);

    expect(verifySignature(SECRET, TS, '{"event":"invoice.paidX"}', signature)).toBe(false);
  });

  it('rejects a different secret', () => {
    expect(verifySignature('other', TS, BODY, signPayload(SECRET, TS, BODY))).toBe(false);
  });

  it('binds the timestamp, so a captured delivery cannot be replayed for ever', () => {
    const signature = signPayload(SECRET, TS, BODY);

    // Same body, different moment — the signature must not still be valid.
    expect(verifySignature(SECRET, '1772009999', BODY, signature)).toBe(false);
  });

  it('rejects a signature of the wrong length without throwing', () => {
    expect(verifySignature(SECRET, TS, BODY, 'sha256=short')).toBe(false);
    expect(verifySignature(SECRET, TS, BODY, '')).toBe(false);
  });
});

describe('retry backoff', () => {
  const from = new Date('2026-03-01T00:00:00Z');

  it('backs off further after each failure rather than hammering', () => {
    const first = nextAttemptAfter(0, from).getTime() - from.getTime();
    const second = nextAttemptAfter(1, from).getTime() - from.getTime();
    const third = nextAttemptAfter(2, from).getTime() - from.getTime();

    expect(first).toBeLessThan(second);
    expect(second).toBeLessThan(third);
  });

  it('starts at a minute', () => {
    expect(nextAttemptAfter(0, from).toISOString()).toBe('2026-03-01T00:01:00.000Z');
  });

  it('stops lengthening past the last step rather than running off the scale', () => {
    expect(nextAttemptAfter(99, from).getTime()).toBe(
      nextAttemptAfter(MAX_ATTEMPTS - 1, from).getTime(),
    );
  });
});

describe('api keys', () => {
  it('mints a key whose prefix is readable and whose secret is not stored', () => {
    const issued = generateApiKey();

    expect(issued.key.startsWith(`${issued.prefix}_`)).toBe(true);
    expect(issued.keyHash).toBe(hashApiKey(issued.key));
    // The hash must not contain the key — that is the entire point of storing it.
    expect(issued.keyHash).not.toContain(issued.key);
  });

  it('never mints the same key twice', () => {
    const keys = new Set(Array.from({ length: 50 }, () => generateApiKey().key));

    expect(keys.size).toBe(50);
  });
});
