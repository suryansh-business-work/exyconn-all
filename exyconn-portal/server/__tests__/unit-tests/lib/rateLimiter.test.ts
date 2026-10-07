import { GraphQLError } from 'graphql';
import { RateLimiterMongo } from 'rate-limiter-flexible';
import { createLimiter, enforceLimit, tooManyRequests } from '../../../src/lib/rateLimiter';

const codeOf = (error: unknown) => (error as GraphQLError).extensions?.code;

describe('createLimiter', () => {
  afterEach(() => jest.restoreAllMocks());

  it('reports no wait for a key it has never seen', async () => {
    const limiter = createLimiter({ keyPrefix: 'unit_fresh', points: 1, durationSec: 60 });
    await expect(limiter.retryAfterMs('nobody')).resolves.toBe(0);
  });

  it('reports the rest of the window once a key has spent its points', async () => {
    const limiter = createLimiter({ keyPrefix: 'unit_window', points: 1, durationSec: 60 });
    await limiter.allow('k');
    const wait = await limiter.retryAfterMs('k');
    expect(wait).toBeGreaterThan(0);
    expect(wait).toBeLessThanOrEqual(60_000);
  });

  it('blocks for the window length when no block duration is given', async () => {
    const limiter = createLimiter({ keyPrefix: 'unit_block', points: 2, durationSec: 120 });
    await limiter.fail('k');
    await expect(limiter.retryAfterMs('k')).resolves.toBe(0);
    await limiter.fail('k');
    const wait = await limiter.retryAfterMs('k');
    expect(wait).toBeGreaterThan(60_000);
    expect(wait).toBeLessThanOrEqual(120_000);
  });

  it('rethrows a store failure instead of treating it as a refusal', async () => {
    const limiter = createLimiter({ keyPrefix: 'unit_broken', points: 5, durationSec: 60 });
    jest
      .spyOn(RateLimiterMongo.prototype, 'consume')
      .mockRejectedValueOnce(new Error('store unavailable'));
    await expect(limiter.allow('k')).rejects.toThrow('store unavailable');
  });

  it('forgets a failed store build, so the next call tries again', async () => {
    const limiter = createLimiter({ keyPrefix: 'unit_retry', points: 5, durationSec: 60 });
    const build = jest
      .spyOn(RateLimiterMongo.prototype, 'createIndexes')
      .mockRejectedValueOnce(new Error('index build failed'));
    await expect(limiter.allow('k')).rejects.toThrow('index build failed');
    await expect(limiter.allow('k')).resolves.toBe(true);
    await expect(limiter.allow('k')).resolves.toBe(true);
    expect(build).toHaveBeenCalledTimes(2);
  });
});

describe('tooManyRequests', () => {
  it('rounds a short wait up to one minute and names what was limited', () => {
    expect(() => tooManyRequests(1_500, 'messages')).toThrow(
      expect.objectContaining({
        message: 'Too many messages. Try again in 1 minute(s).',
        extensions: expect.objectContaining({ code: 'TOO_MANY_REQUESTS', retryAfterSeconds: 2 }),
      }),
    );
  });

  it('still says one minute when there is nothing to wait for', () => {
    expect(() => tooManyRequests(0)).toThrow('Try again in 1 minute(s).');
  });
});

describe('enforceLimit', () => {
  it('lets a key through while it has points, then refuses with the wait', async () => {
    const limiter = createLimiter({ keyPrefix: 'unit_enforce', points: 1, durationSec: 60 });
    await expect(enforceLimit(limiter, 'k', 'status reports')).resolves.toBeUndefined();

    const refusal = await enforceLimit(limiter, 'k', 'status reports').catch((e: unknown) => e);
    expect(codeOf(refusal)).toBe('TOO_MANY_REQUESTS');
    expect((refusal as Error).message).toBe('Too many status reports. Try again in 1 minute(s).');
  });
});
