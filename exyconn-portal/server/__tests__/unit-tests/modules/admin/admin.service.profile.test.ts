import { Types } from 'mongoose';
import { adminService } from '../../../../src/modules/admin/admin.service';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { AppSettingsModel } from '../../../../src/modules/admin/settings.model';
import { mailer } from '../../../../src/utils/mailer';
import { verifyPassword } from '../../../../src/utils/password';
import { ROLES } from '../../../../src/constants/roles';
import { ImageConfigModel } from '../../../../src/modules/tech/image-config.model';

/** Stubbed in __tests__/setup.ts so no SMTP is needed. */
const credentials = mailer.sendCredentialsEmail as jest.Mock;
const customMail = jest.fn().mockResolvedValue(undefined);
mailer.sendCustomEmail = customMail;

const missingId = () => new Types.ObjectId().toHexString();

async function stored() {
  const user = await UserModel.create({
    name: 'Asha',
    email: 'asha@exyconn.com',
    passwordHash: 'x',
    roles: [ROLES.EMPLOYEE],
  });
  return user._id.toHexString();
}

describe('issuing a temporary password', () => {
  it('stores its hash, signs the person out and mails it', async () => {
    const id = await stored();

    const password = await adminService.resetUserPassword(id);

    const row = await UserModel.findById(id).lean();
    expect(await verifyPassword(password, row?.passwordHash ?? '')).toBe(true);
    expect(row?.tokenVersion).toBe(1);
    expect(credentials).toHaveBeenCalledWith({ name: 'Asha', email: 'asha@exyconn.com', password });
  });

  it('reports a user that does not exist', async () => {
    await expect(adminService.resetUserPassword(missingId())).rejects.toThrow('User not found');
    expect(credentials).not.toHaveBeenCalled();
  });
});

describe('sending a custom email', () => {
  it('hands the composed message to the mailer', async () => {
    const id = await stored();

    await expect(
      adminService.sendUserMail(id, { subject: 'Welcome', message: 'See you Monday' }),
    ).resolves.toBe(true);
    expect(customMail).toHaveBeenCalledWith({
      name: 'Asha',
      email: 'asha@exyconn.com',
      subject: 'Welcome',
      message: '',
      html: 'See you Monday',
      cc: [],
      bcc: [],
      attachments: [],
    });
  });

  it('copies people in, each address cleaned and listed once', async () => {
    const id = await stored();

    await adminService.sendUserMail(id, {
      subject: 'Welcome',
      message: '<p>See you Monday</p>',
      cc: [' Lead@Exyconn.com ', 'lead@exyconn.com'],
      bcc: ['hr@exyconn.com'],
    });

    expect(customMail).toHaveBeenCalledWith(
      expect.objectContaining({ cc: ['lead@exyconn.com'], bcc: ['hr@exyconn.com'] }),
    );
  });

  it('refuses a copied address that is not one, and a list that is too long', async () => {
    const id = await stored();
    const many = Array.from({ length: 21 }, (_unused, i) => `p${i}@exyconn.com`);

    await expect(
      adminService.sendUserMail(id, { subject: 's', message: 'm', cc: ['nobody'] }),
    ).rejects.toThrow('"nobody" in CC is not an email address.');
    await expect(
      adminService.sendUserMail(id, { subject: 's', message: 'm', bcc: many }),
    ).rejects.toThrow('Copy at most 20 people in BCC.');
    expect(customMail).not.toHaveBeenCalled();
  });

  it('attaches files from the portal’s own CDN only, at most ten', async () => {
    const id = await stored();
    await ImageConfigModel.create({
      label: 'Main',
      publicKey: 'public',
      privateKey: process.env.TEST_IMAGEKIT_KEY ?? `key-${'x'.repeat(8)}`,
      urlEndpoint: 'https://ik.imagekit.io/exyconn',
      isActive: true,
    });
    const own = {
      url: 'https://ik.imagekit.io/exyconn/user-mail/a.pdf',
      name: 'a.pdf',
      contentType: 'application/pdf',
    };

    await adminService.sendUserMail(id, { subject: 's', message: 'm', attachments: [own] });
    expect(customMail).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: [{ filename: 'a.pdf', path: own.url, contentType: 'application/pdf' }],
      }),
    );

    await expect(
      adminService.sendUserMail(id, {
        subject: 's',
        message: 'm',
        attachments: [{ url: 'http://169.254.169.254/latest', name: 'meta' }],
      }),
    ).rejects.toThrow('"meta" is not a file uploaded to the portal.');
    await expect(
      adminService.sendUserMail(id, {
        subject: 's',
        message: 'm',
        attachments: Array.from({ length: 11 }, () => own),
      }),
    ).rejects.toThrow('Attach at most 10 files.');
  });

  it('attaches nothing while no image configuration is active', async () => {
    const id = await stored();

    await expect(
      adminService.sendUserMail(id, {
        subject: 's',
        message: 'm',
        attachments: [{ url: 'https://ik.imagekit.io/exyconn/a.png', name: 'a.png' }],
      }),
    ).rejects.toThrow('"a.png" is not a file uploaded to the portal.');
  });

  it('reports a user that does not exist', async () => {
    await expect(
      adminService.sendUserMail(missingId(), { subject: 's', message: 'm' }),
    ).rejects.toThrow('User not found');
  });
});

describe('a person’s zone, language and place', () => {
  it('stores trimmed, canonical values', async () => {
    const id = await stored();

    const user = await adminService.updateUser(id, {
      timezone: ' Europe/Berlin ',
      locale: 'en_gb',
      country: ' de ',
      region: ' Bavaria ',
      city: ' Munich ',
    });

    expect(user).toMatchObject({
      timezone: 'Europe/Berlin',
      locale: 'en-GB',
      country: 'DE',
      region: 'Bavaria',
      city: 'Munich',
    });
  });

  it('stores empty values as null so the person follows the workspace default', async () => {
    const id = await stored();
    await adminService.updateUser(id, { timezone: 'Asia/Tokyo', country: 'JP' });

    const user = await adminService.updateUser(id, {
      timezone: '',
      locale: '  ',
      country: null,
      region: '',
      city: '',
    });

    expect(user).toMatchObject({
      timezone: null,
      locale: null,
      country: null,
      region: null,
      city: null,
    });
  });

  it('refuses a zone, language or country this system does not know', async () => {
    const id = await stored();

    await expect(adminService.updateUser(id, { timezone: 'Mars/Olympus' })).rejects.toThrow(
      '"Mars/Olympus" is not a timezone this system knows.',
    );
    await expect(adminService.updateUser(id, { locale: '!!' })).rejects.toThrow(
      '"!!" is not a language tag this system knows.',
    );
    await expect(adminService.updateUser(id, { country: 'xx' })).rejects.toThrow(
      '"XX" is not an ISO 3166-1 country code.',
    );
  });
});

describe('workspace settings', () => {
  it('creates the defaults on first read and reads the stored record after', async () => {
    const first = await adminService.getSettings();
    expect(first).toMatchObject({ key: 'global', timezone: 'Asia/Kolkata', defaultLocale: 'en' });
    expect(first).not.toHaveProperty('currency');

    await AppSettingsModel.updateOne({ key: 'global' }, { timezone: 'UTC' });

    expect((await adminService.getSettings()).timezone).toBe('UTC');
    expect(await AppSettingsModel.countDocuments()).toBe(1);
  });

  it('saves formats and canonicalises every language tag', async () => {
    const saved = await adminService.updateSettings({
      dateFormat: 'yyyy-MM-dd',
      timezone: 'Europe/London',
      defaultLocale: 'fr_fr',
      enabledLocales: ['en', 'de_de'],
      auditRetentionDays: 90,
    });

    expect(saved).toMatchObject({
      dateFormat: 'yyyy-MM-dd',
      timezone: 'Europe/London',
      defaultLocale: 'fr-FR',
      enabledLocales: ['en', 'de-DE'],
      auditRetentionDays: 90,
    });
  });

  it('refuses a bad zone, default language or enabled language, saving nothing', async () => {
    await expect(adminService.updateSettings({ timezone: 'Nowhere/City' })).rejects.toThrow(
      '"Nowhere/City" is not a timezone this system knows.',
    );
    await expect(adminService.updateSettings({ defaultLocale: '!!' })).rejects.toThrow(
      '"!!" is not a language tag this system knows.',
    );
    await expect(adminService.updateSettings({ enabledLocales: ['en', '??'] })).rejects.toThrow(
      '"??" is not a language tag this system knows.',
    );
    expect(await AppSettingsModel.countDocuments()).toBe(0);
  });

  it('refuses a date or time pattern that is not on offer, saving nothing', async () => {
    await expect(adminService.updateSettings({ dateFormat: 'yyyy' })).rejects.toThrow(
      '"yyyy" is not one of the date formats on offer.',
    );
    await expect(adminService.updateSettings({ timeFormat: 'H' })).rejects.toThrow(
      '"H" is not one of the time formats on offer.',
    );
    expect(await AppSettingsModel.countDocuments()).toBe(0);
  });

  it('leaves untouched fields alone on a partial save', async () => {
    await adminService.updateSettings({ timeFormat: 'HH:mm' });

    const saved = await adminService.updateSettings({ autoTranslate: false });

    expect(saved).toMatchObject({ timeFormat: 'HH:mm', autoTranslate: false });
  });
});
