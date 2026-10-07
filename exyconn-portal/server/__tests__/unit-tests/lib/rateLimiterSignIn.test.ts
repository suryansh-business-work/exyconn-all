import type { GraphQLError } from 'graphql';
import {
  MAX_EMAIL_LENGTH,
  assertSignInAllowed,
  assertSingleSignIn,
  recordSignInFailure,
  recordSignInSuccess,
  resetSignInLimits,
  signInAddress,
} from '../../../src/lib/rateLimiterSignIn';

const refusalOf = (promise: Promise<unknown>) =>
  promise.then(
    () => null,
    (error: unknown) => error as GraphQLError,
  );

async function failTimes(count: number, address: (attempt: number) => string, ip: string) {
  for (let attempt = 0; attempt < count; attempt += 1) {
    await recordSignInFailure(address(attempt), ip);
  }
}

describe('signInAddress', () => {
  it('counts an address under one form whatever case or padding it was typed with', () => {
    expect(signInAddress('  Ada@Example.COM ')).toBe('ada@example.com');
  });

  it('bounds the key length', () => {
    const long = `${'a'.repeat(400)}@example.com`;
    expect(signInAddress(long)).toHaveLength(MAX_EMAIL_LENGTH);
  });
});

describe('sign-in lockout', () => {
  it('allows an address and IP that have not failed', async () => {
    await expect(assertSignInAllowed('fresh@example.com', '198.51.100.1')).resolves.toBeUndefined();
  });

  it('locks an address after ten failures from any number of machines', async () => {
    await failTimes(9, () => 'target@example.com', '198.51.100.2');
    await expect(
      assertSignInAllowed('target@example.com', '198.51.100.99'),
    ).resolves.toBeUndefined();

    await recordSignInFailure('target@example.com', '198.51.100.3');
    const refusal = await refusalOf(assertSignInAllowed('target@example.com', '198.51.100.99'));
    expect(refusal?.extensions?.code).toBe('TOO_MANY_REQUESTS');
    expect(refusal?.message).toMatch(
      /^Too many sign-in attempts\. Try again in 1[45] minute\(s\)\.$/,
    );
    // The lock is on the address, not on everybody.
    await expect(
      assertSignInAllowed('other@example.com', '198.51.100.99'),
    ).resolves.toBeUndefined();
  });

  it('locks a machine that sprays twenty failures across many addresses', async () => {
    await failTimes(20, (attempt) => `user${attempt}@example.com`, '203.0.113.50');
    const refusal = await refusalOf(assertSignInAllowed('new@example.com', '203.0.113.50'));
    expect(refusal?.extensions?.code).toBe('TOO_MANY_REQUESTS');
    await expect(assertSignInAllowed('new@example.com', '203.0.113.51')).resolves.toBeUndefined();
  });

  it('forgives the address on a correct password, but not the machine', async () => {
    await failTimes(9, () => 'typo@example.com', '192.0.2.10');
    await recordSignInSuccess('typo@example.com');
    await recordSignInFailure('typo@example.com', '192.0.2.10');
    await expect(assertSignInAllowed('typo@example.com', '192.0.2.10')).resolves.toBeUndefined();

    await failTimes(10, (attempt) => `spray${attempt}@example.com`, '192.0.2.10');
    const refusal = await refusalOf(assertSignInAllowed('typo@example.com', '192.0.2.10'));
    expect(refusal?.extensions?.code).toBe('TOO_MANY_REQUESTS');
  });

  it('forgets every failure when reset', async () => {
    await failTimes(10, () => 'reset@example.com', '192.0.2.20');
    await resetSignInLimits();
    await expect(assertSignInAllowed('reset@example.com', '192.0.2.20')).resolves.toBeUndefined();
  });
});

describe('assertSingleSignIn', () => {
  it('allows one sign-in per request and refuses the second', () => {
    const ctx = {};
    expect(() => assertSingleSignIn(ctx)).not.toThrow();
    expect(() => assertSingleSignIn(ctx)).toThrow(
      expect.objectContaining({
        message: 'Only one sign-in is allowed per request.',
        extensions: { code: 'TOO_MANY_REQUESTS' },
      }),
    );
  });

  it('counts each request on its own', () => {
    expect(() => assertSingleSignIn({})).not.toThrow();
    expect(() => assertSingleSignIn({})).not.toThrow();
  });
});
