import { TranslationModel } from '../../../../src/modules/i18n/translation.model';
import { i18nResolvers } from '../../../../src/modules/i18n';
import * as service from '../../../../src/modules/i18n/i18n.service';
import * as translate from '../../../../src/modules/i18n/i18n.translate';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const I18N = i18nResolvers.Mutation as unknown as Record<string, Resolver>;

/** A platform administrator standing above the companies. */
const superAdmin: GraphQLContext = {
  user: { id: 'root', email: 'root@exyconn.com', roles: [ROLES.SUPER_ADMIN], organizationId: null },
  organizationId: null,
};
const nobody = { user: null } as unknown as GraphQLContext;

/** Lets background work settle without faking any timer. */
async function until(check: () => Promise<boolean>) {
  for (let tick = 0; tick < 200 && !(await check()); tick += 1) {
    await new Promise((resolve) => setImmediate(resolve));
  }
}

afterEach(() => jest.restoreAllMocks());

describe('editing the catalogue', () => {
  it('stores a correction as a human translation', async () => {
    await I18N.setTranslation(null, { locale: 'de', source: 'Save', text: 'Sichern' }, superAdmin);

    const [row] = await TranslationModel.find({ locale: 'de' }).lean();
    expect(row).toMatchObject({ text: 'Sichern', source_kind: 'HUMAN' });
  });

  it('starts filling a language and answers before the work is done', async () => {
    await service.upsertTranslation('de', 'Save', 'Speichern', 'AUTO');
    jest
      .spyOn(translate, 'machineTranslate')
      .mockImplementation(async (locale, sources) =>
        sources.map((source) => ({ source, text: `${locale}:${source}`, model: 'gpt-test' })),
      );

    const started = await I18N.translateEverything(null, { locale: 'es' }, superAdmin);

    expect(started).toEqual({ locale: 'es', queued: 1, alreadyRunning: false });
    await until(async () => (await TranslationModel.countDocuments({ locale: 'es' })) === 1);
    expect(await TranslationModel.countDocuments({ locale: 'es' })).toBe(1);
  });

  it('absorbs a background fill that fails, so it never surfaces as an unhandled rejection', async () => {
    const unhandled = jest.fn();
    process.on('unhandledRejection', unhandled);
    jest.spyOn(service, 'fillLanguage').mockImplementation(async (locale) => ({
      locale,
      queued: 3,
      alreadyRunning: false,
      finished: Promise.reject(new Error('model went away')),
    }));

    try {
      await expect(I18N.translateEverything(null, { locale: 'pt' }, superAdmin)).resolves.toEqual({
        locale: 'pt',
        queued: 3,
        alreadyRunning: false,
      });
      await new Promise((resolve) => setImmediate(resolve));
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', unhandled);
    }
  });

  it('refuses both to somebody who is not signed in', async () => {
    await expect(
      I18N.setTranslation(null, { locale: 'de', source: 'Save', text: 'X' }, nobody),
    ).rejects.toThrow(/Authentication required/);
    await expect(I18N.translateEverything(null, { locale: 'de' }, nobody)).rejects.toThrow(
      /Authentication required/,
    );
  });
});
