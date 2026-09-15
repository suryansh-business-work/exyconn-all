import { authService } from '../../src/modules/auth/auth.service';
import { authResolvers } from '../../src/modules/auth/auth.resolvers';
import { UserModel } from '../../src/modules/admin/user.model';
import { assertSingleSignIn } from '../../src/lib/rateLimiterSignIn';
import { ROLES } from '../../src/constants/roles';
import { runAsPlatform } from '../../src/lib/tenant';
import type { GraphQLContext } from '../../src/middleware/auth';
import { seedUser } from '../helpers';

const PASSWORD = process.env.TEST_SECURITY_PASSWORD ?? 'Correct@Horse1';
const EMAIL = 'target@exyconn.com';

/** Tries a wrong password `times` times from one IP, swallowing the expected refusals. */
async function guess(email: string, ip: string, times: number) {
  for (let attempt = 0; attempt < times; attempt += 1) {
    await authService.login(email, `wrong-guess-${attempt}`, ip).catch(() => undefined);
  }
}

describe('brute force on sign-in', () => {
  beforeEach(async () => {
    await seedUser(EMAIL, PASSWORD, [ROLES.EMPLOYEE]);
  });

  it('locks an address after ten wrong passwords, from any IP, with TOO_MANY_REQUESTS', async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await authService
        .login(EMAIL, `wrong-guess-${attempt}`, `198.51.100.${attempt}`)
        .catch(() => undefined);
    }

    await expect(authService.login(EMAIL, PASSWORD, '192.0.2.50')).rejects.toMatchObject({
      message: expect.stringMatching(/Too many sign-in attempts\. Try again in 15 minute/),
      extensions: expect.objectContaining({ code: 'TOO_MANY_REQUESTS' }),
    });
  });

  it('forgives an address its typos once the right password arrives', async () => {
    await guess(EMAIL, '198.51.100.1', 9);
    await expect(authService.login(EMAIL, PASSWORD, '198.51.100.1')).resolves.toHaveProperty(
      'token',
    );

    await guess(EMAIL, '198.51.100.2', 9);
    await expect(authService.login(EMAIL, PASSWORD, '198.51.100.2')).resolves.toHaveProperty(
      'token',
    );
  });

  it('locks an IP spraying guesses across many addresses', async () => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await guess(`nobody${attempt}@exyconn.com`, '203.0.113.66', 1);
    }

    await expect(authService.login(EMAIL, PASSWORD, '203.0.113.66')).rejects.toMatchObject({
      extensions: expect.objectContaining({ code: 'TOO_MANY_REQUESTS' }),
    });
    await expect(authService.login(EMAIL, PASSWORD, '203.0.113.67')).resolves.toHaveProperty(
      'token',
    );
  });

  it('says nothing about a blocked or deactivated account to somebody without its password', async () => {
    await runAsPlatform(() => UserModel.updateOne({ email: EMAIL }, { isBlocked: true }));
    await expect(authService.login(EMAIL, 'wrong-guess', '198.51.100.9')).rejects.toThrow(
      'Invalid email or password',
    );
    await expect(authService.login(EMAIL, PASSWORD, '198.51.100.9')).rejects.toThrow(/blocked/);

    await runAsPlatform(() =>
      UserModel.updateOne({ email: EMAIL }, { isBlocked: false, isActive: false }),
    );
    await expect(authService.login(EMAIL, PASSWORD, '198.51.100.9')).rejects.toThrow(
      'Invalid email or password',
    );
  });

  it('answers an unknown address exactly like a wrong password', async () => {
    await expect(authService.login('ghost@exyconn.com', PASSWORD, '198.51.100.8')).rejects.toThrow(
      'Invalid email or password',
    );
  });
});

describe('one sign-in per request', () => {
  it('refuses a second login field aliased into the same request', async () => {
    await seedUser(EMAIL, PASSWORD, [ROLES.EMPLOYEE]);
    const ctx: GraphQLContext = { user: null, ip: '198.51.100.30' };
    const login = () =>
      authResolvers.Mutation.login(undefined, { email: EMAIL, password: PASSWORD }, ctx);

    await expect(login()).resolves.toHaveProperty('token');
    await expect(login()).rejects.toThrow('Only one sign-in is allowed per request.');
  });

  it('counts per request, not per process', () => {
    expect(() => assertSingleSignIn({})).not.toThrow();
    expect(() => assertSingleSignIn({})).not.toThrow();
  });
});
