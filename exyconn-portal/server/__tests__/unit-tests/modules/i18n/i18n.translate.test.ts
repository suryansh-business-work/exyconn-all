import { OpenAiConfigModel } from '../../../../src/modules/tech/openai-config.model';
import {
  TRANSLATE_BATCH,
  machineTranslate,
  parseTranslations,
} from '../../../../src/modules/i18n/i18n.translate';
import { openAiClient } from '../../../../src/utils/openai';
import { logger } from '../../../../src/utils/logger';

/** Never a literal credential: the value only has to look like a key. */
const API_KEY = process.env.TEST_OPENAI_KEY ?? ['sk', 'test', Date.now()].join('-');

const activeKey = () =>
  OpenAiConfigModel.create({
    label: 'Primary',
    apiKey: API_KEY,
    defaultModel: 'gpt-test',
    isActive: true,
  });

const answer = (text: string) =>
  jest
    .spyOn(openAiClient, 'complete')
    .mockResolvedValue({ text, promptTokens: 1, completionTokens: 1, totalTokens: 2 });

beforeEach(() => {
  jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
  jest.spyOn(logger, 'error').mockImplementation(() => undefined);
});

afterEach(() => jest.restoreAllMocks());

describe('parseTranslations', () => {
  it('discards a bracketed reply that is not valid JSON', () => {
    expect(parseTranslations('["Speichern", oops]', 2)).toBeNull();
  });

  it('discards a reply whose closing bracket comes first', () => {
    expect(parseTranslations('] nothing [', 1)).toBeNull();
  });
});

describe('machineTranslate', () => {
  it('has nothing to send for an empty batch', async () => {
    const complete = jest.spyOn(openAiClient, 'complete');

    await expect(machineTranslate('de', [])).resolves.toEqual([]);
    expect(complete).not.toHaveBeenCalled();
  });

  it('leaves strings untranslated, with a warning, when no OpenAI key is active', async () => {
    const complete = jest.spyOn(openAiClient, 'complete');

    await expect(machineTranslate('de', ['Save'])).resolves.toEqual([]);
    expect(complete).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith({ locale: 'de' }, expect.any(String));
  });

  it('pairs each source with its translation and names the model', async () => {
    await activeKey();
    const complete = answer('Here you go: ["Speichern", "Abbrechen"]');

    await expect(machineTranslate('de', ['Save', 'Cancel'])).resolves.toEqual([
      { source: 'Save', text: 'Speichern', model: 'gpt-test' },
      { source: 'Cancel', text: 'Abbrechen', model: 'gpt-test' },
    ]);
    const [request] = complete.mock.calls[0];
    expect(request).toMatchObject({ apiKey: API_KEY, model: 'gpt-test' });
    expect(request.prompt).toContain('into Deutsch (de)');
    expect(request.prompt).toContain('1. Save\n2. Cancel');
  });

  it('sends at most one batch, however many strings it is given', async () => {
    await activeKey();
    const sources = Array.from({ length: TRANSLATE_BATCH + 5 }, (_v, index) => `Label ${index}`);
    answer(JSON.stringify(sources.slice(0, TRANSLATE_BATCH).map((source) => `de:${source}`)));

    const result = await machineTranslate('de', sources);

    expect(result).toHaveLength(TRANSLATE_BATCH);
    expect(result[TRANSLATE_BATCH - 1].source).toBe(`Label ${TRANSLATE_BATCH - 1}`);
  });

  it('discards a reply it cannot read', async () => {
    await activeKey();
    answer('["Speichern"]');

    await expect(machineTranslate('de', ['Save', 'Cancel'])).resolves.toEqual([]);
    expect(logger.warn).toHaveBeenCalledWith({ locale: 'de', count: 2 }, expect.any(String));
  });

  it('logs and returns nothing when the model call fails', async () => {
    await activeKey();
    const failure = new Error('OpenAI is down');
    jest.spyOn(openAiClient, 'complete').mockRejectedValue(failure);

    await expect(machineTranslate('de', ['Save'])).resolves.toEqual([]);
    expect(logger.error).toHaveBeenCalledWith({ err: failure, locale: 'de' }, expect.any(String));
  });
});
