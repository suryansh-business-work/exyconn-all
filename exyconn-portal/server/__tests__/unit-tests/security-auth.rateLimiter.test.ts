import mongoose from 'mongoose';
import { createLimiter, tooManyRequests } from '../../src/lib/rateLimiter';

/**
 * The shared limiter keeps its counters in Mongo, so a restart or a second API instance cannot
 * be used to reset them. These run against the same in-memory server every suite uses.
 */
describe('the persistent rate limiter', () => {
  it('allows up to the limit per key, then refuses, without touching other keys', async () => {
    const limiter = createLimiter({ keyPrefix: 'test_allow', points: 2, durationSec: 60 });

    await expect(limiter.allow('a')).resolves.toBe(true);
    await expect(limiter.allow('a')).resolves.toBe(true);
    await expect(limiter.allow('a')).resolves.toBe(false);
    await expect(limiter.allow('b')).resolves.toBe(true);
  });

  it('stores its counters in the database, where the TTL index ages them out', async () => {
    const limiter = createLimiter({ keyPrefix: 'test_store', points: 5, durationSec: 60 });
    await limiter.allow('someone');

    const row = await mongoose.connection
      .collection('rate_limits')
      .findOne({ key: 'test_store:someone' });
    expect(row?.points).toBe(1);
    expect(row?.expire).toBeInstanceOf(Date);
  });

  it('blocks a key once its failures run out, and forgiving clears it', async () => {
    const limiter = createLimiter({
      keyPrefix: 'test_fail',
      points: 3,
      durationSec: 60,
      blockDurationSec: 900,
    });
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await expect(limiter.retryAfterMs('k')).resolves.toBe(0);
      await limiter.fail('k');
    }

    const wait = await limiter.retryAfterMs('k');
    expect(wait).toBeGreaterThan(60_000);
    expect(wait).toBeLessThanOrEqual(900_000);

    await limiter.forgive('k');
    await expect(limiter.retryAfterMs('k')).resolves.toBe(0);
  });

  it('resets only its own keys', async () => {
    const one = createLimiter({ keyPrefix: 'test_one', points: 1, durationSec: 60 });
    const two = createLimiter({ keyPrefix: 'test_two', points: 1, durationSec: 60 });
    await one.allow('x');
    await two.allow('x');

    await one.reset();

    await expect(one.allow('x')).resolves.toBe(true);
    await expect(two.allow('x')).resolves.toBe(false);
  });

  it('reports a refusal as TOO_MANY_REQUESTS with the wait', () => {
    expect(() => tooManyRequests(125_000)).toThrow(
      expect.objectContaining({
        message: 'Too many attempts. Try again in 3 minute(s).',
        extensions: expect.objectContaining({ code: 'TOO_MANY_REQUESTS', retryAfterSeconds: 125 }),
      }),
    );
  });
});
