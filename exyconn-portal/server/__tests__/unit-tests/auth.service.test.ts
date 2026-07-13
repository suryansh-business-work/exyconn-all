import { authService } from '../../src/modules/auth/auth.service';
import { adminService } from '../../src/modules/admin/admin.service';
import { mailer } from '../../src/utils/mailer';
import { UserModel } from '../../src/modules/admin/user.model';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';

describe('AuthService', () => {
  const credentials = { email: 'jane@exyconn.com', password: 'Secret@123' };

  beforeEach(async () => {
    await seedUser(credentials.email, credentials.password, [ROLES.FINANCE, ROLES.HR]);
  });

  it('logs in with valid credentials and returns a token with all roles', async () => {
    const result = await authService.login(credentials.email, credentials.password);
    expect(result.token).toEqual(expect.any(String));
    expect(result.user.email).toBe(credentials.email);
    expect(result.user.roles).toEqual([ROLES.FINANCE, ROLES.HR]);
  });

  it('rejects an invalid password', async () => {
    await expect(authService.login(credentials.email, 'wrong')).rejects.toThrow(
      'Invalid email or password',
    );
  });

  it('changePassword updates the hash after verifying the current one', async () => {
    const user = await UserModel.findOne({ email: credentials.email });
    await authService.changePassword(user!.id, credentials.password, 'BrandNew@1');
    await expect(authService.login(credentials.email, 'BrandNew@1')).resolves.toHaveProperty(
      'token',
    );
  });

  it('changePassword rejects a wrong current password', async () => {
    const user = await UserModel.findOne({ email: credentials.email });
    await expect(
      authService.changePassword(user!.id, 'nope', 'BrandNew@1'),
    ).rejects.toThrow('Current password is incorrect');
  });
});

describe('AdminService.createUser', () => {
  it('persists the assigned roles, emails and returns a temporary password', async () => {
    const { user, password } = await adminService.createUser({
      name: 'Multi Role',
      email: 'multi@exyconn.com',
      roles: [ROLES.MARKETING, ROLES.LEGAL],
    });
    expect(user.roles).toEqual([ROLES.MARKETING, ROLES.LEGAL]);
    expect(password).toHaveLength(12);
    expect(mailer.sendWelcomeEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'multi@exyconn.com',
        roles: [ROLES.MARKETING, ROLES.LEGAL],
        password,
      }),
    );
  });
});
