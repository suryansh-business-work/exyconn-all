import { createLimiter } from '../../lib/rateLimiter';

/**
 * Limits on the calculator's public operations.
 *
 * The website calls these from its own server (src/pages/api/gcc/*), which limits each visitor
 * itself, so every website visitor reaches this API from one address: the per-IP limits here
 * are a flood backstop sized for that one caller, as the form submission limits are. The
 * per-recipient limit is the one that protects a person: however many visitors ask, one
 * address receives at most three estimates a day.
 */
const HOUR = 60 * 60;

export const emailIpLimiter = createLimiter({
  keyPrefix: 'gcc_email_ip',
  points: 60,
  durationSec: HOUR,
});

export const emailRecipientLimiter = createLimiter({
  keyPrefix: 'gcc_email_recipient',
  points: 3,
  durationSec: 24 * HOUR,
});

export const shareCreateLimiter = createLimiter({
  keyPrefix: 'gcc_share_create_ip',
  points: 120,
  durationSec: HOUR,
});

/** Reading and revoking: cheap, but each one is a token lookup, so guessing is throttled. */
export const shareReadLimiter = createLimiter({
  keyPrefix: 'gcc_share_read_ip',
  points: 600,
  durationSec: 10 * 60,
});
