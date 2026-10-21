import { Types } from 'mongoose';
import { useTestOrganization } from '../../../helpers';
import { maModelQueries } from '../../../../src/modules/meeting-assistant/ma.models';
import { OpenAiConfigModel } from '../../../../src/modules/tech/openai-config.model';
import { openAiClient } from '../../../../src/utils/openai';
import { logger } from '../../../../src/utils/logger';
import { runAsPlatform } from '../../../../src/lib/tenant';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';
import { ctxOf, seedAccount, setMaSettings } from './ma.fixtures';

useTestOrganization();

/** What OpenAI lists for a key, sorted as listModels returns it. */
const LISTED = [
  'chatgpt-4o-latest',
  'dall-e-3',
  'ft:gpt-4o-mini:acme::abc123',
  'gpt-3.5-turbo-instruct',
  'gpt-4o',
  'gpt-4o-audio-preview',
  'gpt-4o-mini-search-preview',
  'gpt-4o-mini-tts',
  'gpt-4o-realtime-preview',
  'gpt-4o-transcribe',
  'gpt-image-1',
  'o1',
  'o3-mini',
  'o4-mini',
  'omni-moderation-latest',
  'text-embedding-3-small',
  'whisper-1',
];

let listModels: jest.SpyInstance;
let asAdmin: GraphQLContext;
let asEmployee: GraphQLContext;

/** The install's OpenAI key: a fresh one per test, so no list cached by another test is reused. */
const activeKey = (apiKey = `sk-${new Types.ObjectId().toHexString()}`) =>
  runAsPlatform(() =>
    OpenAiConfigModel.create({ label: 'Primary', apiKey, defaultModel: 'gpt-4o', isActive: true }),
  ).then(() => apiKey);

const available = (purpose: 'ANALYSIS' | 'TRANSCRIPTION', ctx = asAdmin) =>
  maModelQueries.maAvailableModels(null, { purpose }, ctx);

beforeEach(async () => {
  listModels = jest.spyOn(openAiClient, 'listModels').mockResolvedValue(LISTED);
  asAdmin = ctxOf(await seedAccount('Root', [ROLES.ADMIN]), [ROLES.ADMIN]);
  asEmployee = ctxOf(await seedAccount('Asha', [ROLES.EMPLOYEE]), [ROLES.EMPLOYEE]);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('maAvailableModels', () => {
  it('offers chat models for writing the notes, leaving out audio, image and search ones', async () => {
    await activeKey();

    expect(await available('ANALYSIS')).toEqual([
      'chatgpt-4o-latest',
      'ft:gpt-4o-mini:acme::abc123',
      'gpt-4o',
      'o1',
      'o3-mini',
      'o4-mini',
    ]);
  });

  it('offers speech-to-text models for transcription', async () => {
    await activeKey();

    expect(await available('TRANSCRIPTION')).toEqual(['gpt-4o-transcribe', 'whisper-1']);
  });

  it('reads the list once per key for ten minutes, then again', async () => {
    const key = await activeKey();
    const now = Date.now();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(now);

    await available('ANALYSIS');
    clock.mockReturnValue(now + 9 * 60_000);
    await available('TRANSCRIPTION');
    expect(listModels).toHaveBeenCalledTimes(1);
    expect(listModels).toHaveBeenCalledWith(key);

    clock.mockReturnValue(now + 11 * 60_000);
    await available('ANALYSIS');
    expect(listModels).toHaveBeenCalledTimes(2);
  });

  it('reads the list again for a different key', async () => {
    await activeKey('sk-first');
    await available('ANALYSIS');
    await runAsPlatform(() => OpenAiConfigModel.updateMany({}, { $set: { apiKey: 'sk-second' } }));

    await available('ANALYSIS');

    expect(listModels.mock.calls).toEqual([['sk-first'], ['sk-second']]);
  });

  it('says where to set OpenAI up when no key is active', async () => {
    const error = await available('ANALYSIS').catch((caught: unknown) => caught);

    expect(error).toMatchObject({
      message:
        'OpenAI is not configured (Tech > Environment Variables > OpenAI), so no models can be listed.',
      extensions: { code: 'BAD_USER_INPUT' },
    });
    expect(listModels).not.toHaveBeenCalled();
  });

  it('logs and explains an OpenAI failure', async () => {
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    listModels.mockRejectedValue(new Error('401 invalid key'));
    await activeKey();

    const error = await available('TRANSCRIPTION').catch((caught: unknown) => caught);

    expect(error).toMatchObject({
      message: 'OpenAI did not return its model list. Check the key in Tech > Environment Variables.',
      extensions: { code: 'BAD_USER_INPUT' },
    });
    expect(warn).toHaveBeenCalledWith(
      { reason: expect.stringContaining('401 invalid key') },
      'Meeting Assistant could not list the OpenAI models',
    );
  });

  it('is for those who may read the settings: not an employee, nor anyone when it is off', async () => {
    await activeKey();

    expect(await codeOf(available('ANALYSIS', asEmployee))).toBe('FORBIDDEN');
    await setMaSettings({ enabled: false });
    expect(await codeOf(available('ANALYSIS'))).toBe('FORBIDDEN');
    expect(listModels).not.toHaveBeenCalled();
  });
});
