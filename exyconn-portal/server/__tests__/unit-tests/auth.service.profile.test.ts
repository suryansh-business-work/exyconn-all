import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { authService, bumpTokenVersion } from '../../src/modules/auth/auth.service';
import { listSessions } from '../../src/modules/auth/session.service';
import { UserModel } from '../../src/modules/admin/user.model';
import { imageUploader } from '../../src/utils/imagekit';
import { mailer } from '../../src/utils/mailer';
import { env } from '../../src/config/env';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';

const PASSWORD = `pw-${randomUUID()}`;

async function person() {
  return seedUser(`${randomUUID()}@exyconn.com`, PASSWORD, [ROLES.EMPLOYEE]);
}

afterEach(() => jest.restoreAllMocks());

describe('editing one s own profile', () => {
  it('saves a name and an avatar address', async () => {
    const user = await person();

    const saved = await authService.updateProfile(user.id, {
      name: 'Asha Rao',
      avatarUrl: 'https://ik.imagekit.io/exy/a.png',
    });

    expect(saved).toMatchObject({
      name: 'Asha Rao',
      avatarUrl: 'https://ik.imagekit.io/exy/a.png',
    });
  });

  it('keeps a known timezone trimmed, and clears it with an empty string', async () => {
    const user = await person();

    expect(await authService.updateProfile(user.id, { timezone: ' Asia/Kolkata ' })).toMatchObject({
      timezone: 'Asia/Kolkata',
    });
    expect(await authService.updateProfile(user.id, { timezone: '' })).toMatchObject({
      timezone: null,
    });
  });

  it('refuses a timezone the runtime does not know', async () => {
    const user = await person();

    await expect(authService.updateProfile(user.id, { timezone: 'Mars/Olympus' })).rejects.toThrow(
      '"Mars/Olympus" is not a timezone this system knows.',
    );
  });

  it('stores a language in its canonical form, and clears it with an empty string', async () => {
    const user = await person();

    expect(await authService.updateProfile(user.id, { locale: 'en_in' })).toMatchObject({
      locale: 'en-IN',
    });
    expect(await authService.updateProfile(user.id, { locale: '  ' })).toMatchObject({
      locale: null,
    });
  });

  it('refuses a language tag that is not one', async () => {
    const user = await person();

    await expect(authService.updateProfile(user.id, { locale: '!!' })).rejects.toThrow(
      '"!!" is not a language tag this system knows.',
    );
  });

  it('refuses to edit an account that does not exist', async () => {
    await expect(
      authService.updateProfile(new Types.ObjectId().toHexString(), { name: 'Ghost' }),
    ).rejects.toThrow('User not found');
  });
});

describe('reading and securing one s own account', () => {
  it('reads the account, and refuses one that is gone', async () => {
    const user = await person();

    await expect(authService.me(user.id)).resolves.toMatchObject({ email: user.email });
    await expect(authService.me(new Types.ObjectId().toHexString())).rejects.toThrow(
      'Authentication required',
    );
  });

  it('refuses a password change for an account that does not exist', async () => {
    await expect(
      authService.changePassword(
        new Types.ObjectId().toHexString(),
        PASSWORD,
        `new-${randomUUID()}`,
      ),
    ).rejects.toThrow('User not found');
  });

  it('checks the new password s rules before the current password', async () => {
    const user = await person();

    await expect(authService.changePassword(user.id, 'not-it', 'short')).rejects.toThrow(
      'at least 10',
    );
  });

  it('raises the token version and ends every session', async () => {
    const user = await person();
    await authService.login(user.email, PASSWORD);

    await bumpTokenVersion(user.id);

    expect((await UserModel.findById(user.id).lean())?.tokenVersion).toBe(1);
    expect(await listSessions(user.id, undefined)).toEqual([]);
  });

  it('uploads an avatar and keeps its address on the account', async () => {
    const user = await person();
    const url = 'https://ik.imagekit.io/exy/avatar.png';
    const upload = jest.spyOn(imageUploader, 'uploadAvatar').mockResolvedValue(url);

    await expect(authService.uploadAvatar(user.id, 'data:image/png;base64,AAAA')).resolves.toBe(
      url,
    );

    expect(upload).toHaveBeenCalledWith('data:image/png;base64,AAAA', `avatar-${user.id}`);
    expect((await UserModel.findById(user.id).lean())?.avatarUrl).toBe(url);
  });
});

describe('re-issuing the bootstrap administrator', () => {
  const sent = mailer.sendCredentialsEmail as jest.MockedFunction<
    typeof mailer.sendCredentialsEmail
  >;

  it('restores a disabled seed account to an active administrator', async () => {
    const email = env.seedAdmin.email.toLowerCase();
    const seed = await seedUser(email, PASSWORD, [ROLES.EMPLOYEE]);
    await UserModel.updateOne({ _id: seed.id }, { isActive: false, isBlocked: true });

    const message = await authService.sendAdminCredentials();

    const after = await UserModel.findById(seed.id).lean();
    expect(after?.roles).toEqual([ROLES.EMPLOYEE, ROLES.ADMIN]);
    expect(after).toMatchObject({ isActive: true, isBlocked: false });
    expect(sent).toHaveBeenCalledTimes(1);
    // The reply masks the address: two characters, then stars, then the domain.
    const [local, domain] = email.split('@');
    expect(message).toContain(`${local.slice(0, 2)}*`);
    expect(message).toContain(`*@${domain}`);
    expect(message).not.toContain(email);

    const { user } = await authService.login(email, sent.mock.calls[0][0].password);
    expect(user?.roles).toContain(ROLES.ADMIN);
  });
});
