import { AppSettingsModel } from '../../src/modules/admin/settings.model';
import { TranslationModel } from '../../src/modules/i18n/translation.model';
import { i18nResolvers } from '../../src/modules/i18n/i18n.resolvers';
import * as translate from '../../src/modules/i18n/i18n.translate';
import { runAsPlatform, setDefaultScope } from '../../src/lib/tenant';
import { upsertTranslation } from '../../src/modules/i18n/i18n.service';
import type { GraphQLContext } from '../../src/middleware/auth';

/**
 * `translateMissing` is public — the website and every sign-in screen need it — and each call
 * that reaches the model costs money. These are the guards that make that safe.
 */
const visitor = (ip: string) => ({ user: null, ip }) as unknown as GraphQLContext;

const ask = (sources: string[], ctx: GraphQLContext, locale = 'fr') =>
  i18nResolvers.Mutation.translateMissing(undefined, { locale, sources }, ctx);

/** French is a language the platform serves: the catalogue already holds some of it. */
const serveFrench = () =>
  runAsPlatform(() => upsertTranslation('fr', 'Save', 'Enregistrer', 'AUTO'));

describe('asking for translations without signing in', () => {
  beforeEach(async () => {
    await Promise.all([TranslationModel.deleteMany({}), AppSettingsModel.deleteMany({})]);
    jest.restoreAllMocks();
    // What production sees for a public request: no workspace in scope at all.
    setDefaultScope(null);
    await serveFrench();
  });

  afterEach(() => {
    setDefaultScope({ organizationId: null, platform: true });
  });

  it('works — the public website is the platform’s own, and always translates', async () => {
    jest
      .spyOn(translate, 'machineTranslate')
      .mockImplementation(async (_locale, sources) =>
        sources.map((source) => ({ source, text: `fr:${source}`, model: 'gpt-test' })),
      );

    await expect(ask(['Contact us'], visitor('198.51.100.1'))).resolves.toEqual([
      expect.objectContaining({ source: 'Contact us', text: 'fr:Contact us' }),
    ]);
  });

  it('never sends the model something no screen of ours could have rendered', async () => {
    const machine = jest.spyOn(translate, 'machineTranslate').mockResolvedValue([]);

    await ask(['x'.repeat(501)], visitor('198.51.100.2'));

    expect(machine).not.toHaveBeenCalled();
  });

  it('stops one caller who keeps sending new strings, without stopping anybody else', async () => {
    const machine = jest
      .spyOn(translate, 'machineTranslate')
      .mockImplementation(async (_locale, sources) =>
        sources.map((source) => ({ source, text: `fr:${source}`, model: 'gpt-test' })),
      );

    for (let call = 0; call < 300; call += 1) {
      await ask([`junk ${call}`], visitor('203.0.113.9'));
    }
    machine.mockClear();

    await expect(ask(['junk over the limit'], visitor('203.0.113.9'))).resolves.toEqual([]);
    expect(machine).not.toHaveBeenCalled();

    await expect(ask(['A real page'], visitor('198.51.100.3'))).resolves.toHaveLength(1);
  });

  it('never pays for a locale the platform does not serve', async () => {
    const machine = jest.spyOn(translate, 'machineTranslate').mockResolvedValue([]);

    await expect(ask(['Contact us'], visitor('198.51.100.4'), 'en-NZ')).resolves.toEqual([]);

    expect(machine).not.toHaveBeenCalled();
  });

  it('lets a signed-in person translate into any locale, as before', async () => {
    const machine = jest
      .spyOn(translate, 'machineTranslate')
      .mockImplementation(async (_locale, sources) =>
        sources.map((source) => ({ source, text: `nz:${source}`, model: 'gpt-test' })),
      );
    const member = { user: { id: 'u1', email: 'a@b.com', roles: [] }, ip: '198.51.100.5' };

    await expect(
      ask(['Contact us'], member as unknown as GraphQLContext, 'en-NZ'),
    ).resolves.toHaveLength(1);
    expect(machine).toHaveBeenCalledTimes(1);
  });
});
