import { Types } from 'mongoose';
import { AppSettingsModel } from '../../../../src/modules/admin/settings.model';
import { i18nResolvers } from '../../../../src/modules/i18n';
import { upsertTranslation } from '../../../../src/modules/i18n/i18n.service';
import * as translate from '../../../../src/modules/i18n/i18n.translate';
import { runForOrganization } from '../../../../src/lib/tenant';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const I18N = { ...i18nResolvers.Query, ...i18nResolvers.Mutation } as unknown as Record<
  string,
  Resolver
>;

/** A platform administrator standing above the companies. */
const superAdmin: GraphQLContext = {
  user: { id: 'root', email: 'root@exyconn.com', roles: [ROLES.SUPER_ADMIN], organizationId: null },
  organizationId: null,
};
const nobody = { user: null } as unknown as GraphQLContext;

const inCompany = <T>(settings: Record<string, unknown>, fn: () => Promise<T>) =>
  runForOrganization(new Types.ObjectId().toHexString(), async () => {
    await AppSettingsModel.create(settings);
    return fn();
  });

const echo = () =>
  jest
    .spyOn(translate, 'machineTranslate')
    .mockImplementation(async (locale, sources) =>
      sources.map((source) => ({ source, text: `${locale}:${source}`, model: 'gpt-test' })),
    );

afterEach(() => jest.restoreAllMocks());

describe('localeOptions and localeBundle', () => {
  it("lists the workspace's locales by their own names and script direction", async () => {
    const options = await inCompany({ defaultLocale: 'ar', enabledLocales: ['de'] }, () =>
      I18N.localeOptions(null, {}, nobody),
    );

    expect(options).toEqual([
      { tag: 'en', label: 'English', direction: 'ltr' },
      { tag: 'de', label: 'Deutsch', direction: 'ltr' },
      { tag: 'ar', label: expect.any(String), direction: 'rtl' },
    ]);
  });

  it("hands over a locale's translations with the workspace default as the fallback", async () => {
    await upsertTranslation('he', 'Save', 'שמור', 'AUTO');

    const bundle = await inCompany({ defaultLocale: 'hi' }, () =>
      I18N.localeBundle(null, { locale: 'HE' }, nobody),
    );

    expect(bundle).toEqual({
      locale: 'he',
      direction: 'rtl',
      fallbackLocale: 'hi',
      translations: [expect.objectContaining({ source: 'Save', text: 'שמור' })],
    });
  });

  it('reads a tag that does not resolve as English, outside any workspace', async () => {
    await expect(I18N.localeBundle(null, { locale: 'not a locale' }, nobody)).resolves.toEqual({
      locale: 'en',
      direction: 'ltr',
      fallbackLocale: 'en',
      translations: [],
    });
  });
});

describe('translations (the review screen)', () => {
  beforeEach(async () => {
    await upsertTranslation('fr', 'Save (draft)', 'Enregistrer (brouillon)', 'AUTO', 'gpt-test');
    await upsertTranslation('fr', 'Save', 'Enregistrer', 'HUMAN');
    await upsertTranslation('fr', 'Cancel', 'Annuler', 'AUTO');
  });

  it('matches the search literally across source and text, with the kind of each row', async () => {
    const result = (await I18N.translations(
      null,
      { locale: 'fr', search: ' (draft) ' },
      superAdmin,
    )) as { rows: Array<{ id: string; source: string; kind: string }>; total: number };

    expect(result.total).toBe(1);
    expect(result.rows[0]).toMatchObject({ source: 'Save (draft)', kind: 'AUTO' });
    expect(result.rows[0].id).toEqual(expect.any(String));
  });

  it('pages the rows and counts them all', async () => {
    const result = (await I18N.translations(
      null,
      { locale: 'fr', skip: 1, limit: 1, search: '   ' },
      superAdmin,
    )) as { rows: unknown[]; total: number };

    expect(result.total).toBe(3);
    expect(result.rows).toHaveLength(1);
  });

  it('reads an unresolvable tag as English, which holds nothing here', async () => {
    await expect(I18N.translations(null, { locale: 'not a locale' }, superAdmin)).resolves.toEqual({
      rows: [],
      total: 0,
    });
  });

  it('is refused to somebody who is not signed in', async () => {
    await expect(I18N.translations(null, { locale: 'fr' }, nobody)).rejects.toThrow(
      /Authentication required/,
    );
  });
});

describe('translateMissing (public)', () => {
  it('translates nothing for a workspace that switched the machine off', async () => {
    const machine = echo();

    const result = await inCompany({ autoTranslate: false }, () =>
      I18N.translateMissing(null, { locale: 'fr', sources: ['Save'] }, nobody),
    );

    expect(result).toEqual([]);
    expect(machine).not.toHaveBeenCalled();
  });

  it('translates for a workspace that leaves it on', async () => {
    echo();

    const result = await inCompany({ autoTranslate: true }, () =>
      I18N.translateMissing(null, { locale: 'fr', sources: ['Save'] }, superAdmin),
    );

    expect(result).toEqual([expect.objectContaining({ source: 'Save', text: 'fr:Save' })]);
  });

  it('still budgets a caller whose address is unknown', async () => {
    await upsertTranslation('fr', 'Save', 'Enregistrer', 'AUTO');
    echo();

    await expect(
      I18N.translateMissing(null, { locale: 'fr', sources: ['Contact us'] }, nobody),
    ).resolves.toEqual([expect.objectContaining({ text: 'fr:Contact us' })]);
  });
});
