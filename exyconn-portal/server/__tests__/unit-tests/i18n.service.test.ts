import { UserModel } from '../../src/modules/admin/user.model';
import { AppSettingsModel } from '../../src/modules/admin/settings.model';
import { adminService } from '../../src/modules/admin/admin.service';
import { ROLES } from '../../src/constants/roles';
import { TranslationModel } from '../../src/modules/i18n/translation.model';
import {
  enabledLocales,
  readBundle,
  translateMissing,
  upsertTranslation,
} from '../../src/modules/i18n/i18n.service';
import * as translate from '../../src/modules/i18n/i18n.translate';

// The welcome email talks to SMTP; stub it so user creation works offline.
jest.mock('../../src/utils/mailer', () => ({
  mailer: { sendWelcomeEmail: jest.fn().mockResolvedValue(undefined) },
}));

async function settings(patch: Record<string, unknown>) {
  await AppSettingsModel.findOneAndUpdate({ key: 'global' }, patch, { upsert: true });
}

describe('the translation store', () => {
  beforeEach(async () => {
    await Promise.all([TranslationModel.deleteMany({}), AppSettingsModel.deleteMany({})]);
    jest.restoreAllMocks();
  });

  it('returns nothing for the default locale — there the source string is the text', async () => {
    await expect(readBundle('en')).resolves.toEqual([]);
  });

  it('stores one row per string per locale, however the tag was written', async () => {
    await upsertTranslation('DE-de', 'Save changes', 'Änderungen speichern', 'HUMAN');
    await upsertTranslation('de-DE', 'Save changes', 'Speichern', 'HUMAN');

    const rows = await TranslationModel.find({}).lean();
    expect(rows).toHaveLength(1);
    expect(rows[0].text).toBe('Speichern');
  });

  it('hands the client back everything a locale has', async () => {
    await upsertTranslation('hi', 'Save', 'सहेजें', 'AUTO', 'gpt-test');

    await expect(readBundle('hi')).resolves.toEqual([
      expect.objectContaining({ source: 'Save', text: 'सहेजें' }),
    ]);
  });
});

describe('filling in strings a locale has never seen', () => {
  beforeEach(async () => {
    await Promise.all([TranslationModel.deleteMany({}), AppSettingsModel.deleteMany({})]);
    jest.restoreAllMocks();
  });

  it('translates and stores the ones that are missing', async () => {
    jest
      .spyOn(translate, 'machineTranslate')
      .mockResolvedValue([{ source: 'Save', text: 'सहेजें', model: 'gpt-test' }]);

    const stored = await translateMissing('hi', ['Save']);

    expect(stored).toEqual([expect.objectContaining({ text: 'सहेजें' })]);
    await expect(TranslationModel.countDocuments({ locale: 'hi' })).resolves.toBe(1);
  });

  it('never asks the model about a string it already has', async () => {
    await upsertTranslation('hi', 'Save', 'सहेजें', 'HUMAN');
    const machine = jest.spyOn(translate, 'machineTranslate').mockResolvedValue([]);

    await translateMissing('hi', ['Save']);

    // This runs on every screen render, so a stored string must cost nothing.
    expect(machine).not.toHaveBeenCalled();
  });

  it('leaves a human correction alone when the same string comes round again', async () => {
    await upsertTranslation('hi', 'Save', 'मेरा अनुवाद', 'HUMAN');
    jest
      .spyOn(translate, 'machineTranslate')
      .mockResolvedValue([{ source: 'Save', text: 'मशीन', model: 'gpt-test' }]);

    await translateMissing('hi', ['Save']);

    const row = await TranslationModel.findOne({ locale: 'hi' }).lean();
    expect(row?.text).toBe('मेरा अनुवाद');
  });

  it('stores nothing when the model could not be reached', async () => {
    jest.spyOn(translate, 'machineTranslate').mockResolvedValue([]);

    await expect(translateMissing('hi', ['Save'])).resolves.toEqual([]);
    // English must never be stored as if it were a translation — the next attempt retries.
    await expect(TranslationModel.countDocuments({})).resolves.toBe(0);
  });

  it('does nothing for the default locale', async () => {
    const machine = jest.spyOn(translate, 'machineTranslate').mockResolvedValue([]);

    await expect(translateMissing('en', ['Save'])).resolves.toEqual([]);
    expect(machine).not.toHaveBeenCalled();
  });
});

describe('the locales a workspace offers', () => {
  beforeEach(async () => {
    await AppSettingsModel.deleteMany({});
  });

  it('always includes English and the workspace default, however the list was saved', async () => {
    await settings({ defaultLocale: 'hi', enabledLocales: ['fr'] });

    await expect(enabledLocales()).resolves.toEqual(expect.arrayContaining(['en', 'fr', 'hi']));
  });

  it('drops a tag that does not resolve rather than offering it', async () => {
    await settings({ defaultLocale: 'en', enabledLocales: ['fr', 'nonsense!'] });

    await expect(enabledLocales()).resolves.toEqual(['en', 'fr']);
  });
});

describe('a person’s own zone and language', () => {
  beforeEach(async () => {
    await UserModel.deleteMany({});
  });

  it('is stored as null when they have not chosen, so the house default keeps applying', async () => {
    const { user } = await adminService.createUser({
      name: 'Ada',
      email: 'ada@exyconn.com',
      roles: [ROLES.EMPLOYEE],
    });

    expect(user.timezone).toBeNull();
    expect(user.locale).toBeNull();
  });

  it('is stored canonicalised when HR picks one', async () => {
    const { user } = await adminService.createUser({
      name: 'Ada',
      email: 'ada@exyconn.com',
      roles: [ROLES.EMPLOYEE],
      timezone: 'Europe/Berlin',
      locale: 'DE-de',
    });

    expect(user.timezone).toBe('Europe/Berlin');
    expect(user.locale).toBe('de-DE');
  });

  it('refuses a zone nobody could be in, rather than silently ignoring it', async () => {
    // A typo'd zone would put every timestamp this person sees in the wrong place.
    await expect(
      adminService.createUser({
        name: 'Ada',
        email: 'ada@exyconn.com',
        roles: [ROLES.EMPLOYEE],
        timezone: 'Mars/Olympus',
      }),
    ).rejects.toThrow(/not a timezone/i);
  });

  it('refuses a language tag the system cannot resolve', async () => {
    await expect(
      adminService.createUser({
        name: 'Ada',
        email: 'ada@exyconn.com',
        roles: [ROLES.EMPLOYEE],
        locale: 'not a language',
      }),
    ).rejects.toThrow(/not a language tag/i);
  });
});
