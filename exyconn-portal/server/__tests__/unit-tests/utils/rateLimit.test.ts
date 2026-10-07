import { createRateLimiter } from '../../../src/utils/rateLimit';

const WINDOW_MS = 1000;
let now = 1_000_000;

beforeEach(() => {
  now = 1_000_000;
  jest.spyOn(Date, 'now').mockImplementation(() => now);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('createRateLimiter', () => {
  it('allows up to the limit inside one window and refuses the next attempt', () => {
    const limiter = createRateLimiter(WINDOW_MS, 2);
    expect(limiter.allow('ip-1')).toBe(true);
    expect(limiter.allow('ip-1')).toBe(true);
    expect(limiter.allow('ip-1')).toBe(false);
  });

  it('counts every key on its own', () => {
    const limiter = createRateLimiter(WINDOW_MS, 1);
    expect(limiter.allow('ip-1')).toBe(true);
    expect(limiter.allow('ip-2')).toBe(true);
    expect(limiter.allow('ip-1')).toBe(false);
  });

  it('forgets attempts once they age out of the window', () => {
    const limiter = createRateLimiter(WINDOW_MS, 1);
    expect(limiter.allow('ip-1')).toBe(true);
    now += WINDOW_MS - 1;
    expect(limiter.allow('ip-1')).toBe(false);
    now += 1;
    expect(limiter.allow('ip-1')).toBe(true);
  });

  it('does not record refused attempts, so they do not extend the block', () => {
    const limiter = createRateLimiter(WINDOW_MS, 1);
    limiter.allow('ip-1');
    now += 500;
    expect(limiter.allow('ip-1')).toBe(false);
    now += 500;
    expect(limiter.allow('ip-1')).toBe(true);
  });

  it('reset forgets every recorded attempt', () => {
    const limiter = createRateLimiter(WINDOW_MS, 1);
    limiter.allow('ip-1');
    expect(limiter.allow('ip-1')).toBe(false);
    limiter.reset();
    expect(limiter.allow('ip-1')).toBe(true);
  });
});
