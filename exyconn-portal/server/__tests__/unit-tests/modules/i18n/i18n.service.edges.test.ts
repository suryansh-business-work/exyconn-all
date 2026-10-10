import { Types } from 'mongoose';
import { AppSettingsModel } from '../../../../src/modules/admin/settings.model';
import { TranslationModel } from '../../../../src/modules/i18n/translation.model';
import {
  enabledLocales,
  fillLanguage,
  localeIsOffered,
  readBundle,
  translateMissing,
  upsertTranslation,
} from '../../../../src/modules/i18n/i18n.service';
import * as translate from '../../../../src/modules/i18n/i18n.translate';
import { runForOrganization } from '../../../../src/lib/tenant';
import { logger } from '../../../../src/utils/logger';

const echo = (prefix: string) =>
  jest
    .spyOn(translate, 'machineTranslate')
    .mockImplementation(async (_locale, sources) =>
      sources.map((source) => ({ source, text: `${prefix}:${source}`, model: 'gpt-test' })),
    );

const inCompany = <T>(fn: () => Promise<T>) =>
  runForOrganization(new Types.ObjectId().toHexString(), fn);

beforeEach(() => {
  jest.spyOn(logger, 'info').mockImplementation(() => undefined);
  jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
  jest.spyOn(logger, 'error').mockImplementation(() => undefined);
});

afterEach(() => jest.restoreAllMocks());

describe('readBundle and upsertTranslation', () => {
  it('has no bundle for a tag that does not resolve', async () => {
    await expect(readBundle('not a locale')).resolves.toEqual([]);
  });

  it('files a translation under English when its tag does not resolve', async () => {
    await upsertTranslation('not a locale', 'Save', 'Save!', 'HUMAN');

    const [row] = await TranslationModel.find({}).lean();
    expect(row).toMatchObject({ locale: 'en', text: 'Save!', source_kind: 'HUMAN', model: '' });
  });
});

describe('translateMissing edge cases', () => {
  it('asks nothing for a tag that does not resolve, or for no strings', async () => {
    const machine = echo('x');

    await expect(translateMissing('not a locale', ['Save'])).resolves.toEqual([]);
    await expect(translateMissing('fr', [])).resolves.toEqual([]);
    expect(machine).not.toHaveBeenCalled();
  });

  it('drops blank strings and asks once for a string repeated on the page', async () => {
    const machine = echo('fr');

    const stored = await translateMissing('fr', ['Save', '   ', 'Save', '']);

    expect(stored.map((entry) => entry.text)).toEqual(['fr:Save']);
    expect(machine).toHaveBeenCalledWith('fr', ['Save']);
  });

  it('sends one batch per call and leaves the rest for the next one', async () => {
    const machine = echo('fr');
    const sources = Array.from(
      { length: translate.TRANSLATE_BATCH + 3 },
      (_v, index) => `Row ${index}`,
    );

    const stored = await translateMissing('fr', sources);

    expect(stored).toHaveLength(translate.TRANSLATE_BATCH);
    expect(machine.mock.calls[0][1]).toHaveLength(translate.TRANSLATE_BATCH);
  });

  it('logs nothing as translated when the model returned nothing', async () => {
    jest.spyOn(translate, 'machineTranslate').mockResolvedValue([]);

    await expect(translateMissing('fr', ['Save'])).resolves.toEqual([]);
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('logs a refusal when the caller may not use the model now', async () => {
    const machine = echo('fr');

    await expect(translateMissing('fr', ['Save'], async () => false)).resolves.toEqual([]);
    expect(machine).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith({ locale: 'fr', count: 1 }, expect.any(String));
  });
});

describe('enabledLocales', () => {
  it('offers only English when the workspace default does not resolve', async () => {
    await inCompany(async () => {
      await AppSettingsModel.create({ defaultLocale: 'not a locale' });

      await expect(enabledLocales()).resolves.toEqual(['en']);
    });
  });
});

describe('localeIsOffered', () => {
  it('refuses a tag that does not resolve', async () => {
    await expect(localeIsOffered('not a locale')).resolves.toBe(false);
  });

  it('refuses a locale no workspace offers and the catalogue has never held', async () => {
    await expect(localeIsOffered('en-NZ')).resolves.toBe(false);
  });

  it('accepts a locale some workspace enabled or uses as its default', async () => {
    await inCompany(() => AppSettingsModel.create({ defaultLocale: 'ja', enabledLocales: ['ko'] }));

    await expect(localeIsOffered('ko')).resolves.toBe(true);
    await expect(localeIsOffered('JA')).resolves.toBe(true);
  });

  it('accepts a locale the shared catalogue already holds', async () => {
    await upsertTranslation('pt-BR', 'Save', 'Salvar', 'AUTO');

    await expect(localeIsOffered('pt_BR')).resolves.toBe(true);
  });
});

describe('fillLanguage edge cases', () => {
  it('treats a tag that does not resolve as English, which needs no filling', async () => {
    await upsertTranslation('de', 'Save', 'Speichern', 'AUTO');

    const fill = await fillLanguage('not a locale');

    expect(fill).toMatchObject({ locale: 'en', queued: 0, alreadyRunning: false });
    await expect(fill.finished).resolves.toBe(0);
  });

  it('keeps what it stored and frees the language when a batch fails part-way', async () => {
    await upsertTranslation('de', 'Save', 'Speichern', 'AUTO');
    const failure = new Error('database went away');
    jest.spyOn(translate, 'machineTranslate').mockRejectedValueOnce(failure);

    const fill = await fillLanguage('it');

    expect(fill.queued).toBe(1);
    await expect(fill.finished).resolves.toBe(0);
    expect(logger.error).toHaveBeenCalledWith({ err: failure, locale: 'it' }, expect.any(String));

    echo('it');
    const retry = await fillLanguage('it');
    expect(retry.alreadyRunning).toBe(false);
    await expect(retry.finished).resolves.toBe(1);
  });
});
