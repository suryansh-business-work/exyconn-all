import { UserModel } from '../../src/modules/admin/user.model';
import { ensureAdminAccess } from '../../src/seed/ensureAdminAccess';
import { authService } from '../../src/modules/auth/auth.service';
import { ROLES } from '../../src/constants/roles';
import { env } from '../../src/config/env';
import { mailer } from '../../src/utils/mailer';
import { seedUser } from '../helpers';

const ADMIN_EMAIL = env.seedAdmin.email.toLowerCase();
/** Stubbed in __tests__/setup.ts so no SMTP is needed. */
const sentCredentials = mailer.sendCredentialsEmail as jest.MockedFunction<
  typeof mailer.sendCredentialsEmail
>;

beforeEach(() => sentCredentials.mockClear());

describe('ensureAdminAccess', () => {
  it('creates the seed admin on an empty database', async () => {
    await ensureAdminAccess();
    const admin = await UserModel.findOne({ email: ADMIN_EMAIL });
    expect(admin?.roles).toContain(ROLES.ADMIN);
    expect(admin?.isActive).toBe(true);
  });

  it('restores ADMIN when the seed account lost the role', async () => {
    await seedUser(ADMIN_EMAIL, 'whatever123', [ROLES.EMPLOYEE]);
    await ensureAdminAccess();
    const admin = await UserModel.findOne({ email: ADMIN_EMAIL });
    expect(admin?.roles).toEqual(expect.arrayContaining([ROLES.EMPLOYEE, ROLES.ADMIN]));
  });

  it('leaves an existing administrator completely alone', async () => {
    const other = await seedUser('boss@exyconn.com', 'whatever123', [ROLES.ADMIN]);
    await seedUser(ADMIN_EMAIL, 'whatever123', [ROLES.EMPLOYEE]);
    await ensureAdminAccess();
    const seedAdmin = await UserModel.findOne({ email: ADMIN_EMAIL });
    expect(seedAdmin?.roles).toEqual([ROLES.EMPLOYEE]);
    expect((await UserModel.findById(other.id))?.roles).toEqual([ROLES.ADMIN]);
  });
});

describe('sendAdminCredentials', () => {
  it('issues a working password and mails it to the configured address', async () => {
    const message = await authService.sendAdminCredentials();

    expect(sentCredentials).toHaveBeenCalledTimes(1);
    const payload = sentCredentials.mock.calls[0][0];
    expect(payload.email).toBe(ADMIN_EMAIL);
    expect(message).toContain('@');
    // The address is masked in the response so the login screen does not publish it.
    expect(message).not.toContain(ADMIN_EMAIL);

    const { user } = await authService.login(ADMIN_EMAIL, payload.password);
    expect(user.roles).toContain(ROLES.ADMIN);
  });

  it('refuses to touch anything once an administrator exists', async () => {
    await seedUser('boss@exyconn.com', 'whatever123', [ROLES.ADMIN]);

    const message = await authService.sendAdminCredentials();

    expect(sentCredentials).not.toHaveBeenCalled();
    expect(message).toMatch(/already exists/i);
  });
});
