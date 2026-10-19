import {
  callingBotConfigs,
  checkSarvam,
} from '../../../../src/modules/calling-bot-demo/calling-bot.config.service';
import { CallingBotConfigModel } from '../../../../src/modules/calling-bot-demo/calling-bot.models';
import { openAiClient } from '../../../../src/utils/openai';
import { asArg } from '../../../mockAs';
import {
  configInput,
  credential,
  jsonResponse,
  mockFetch,
  twilioFields,
  UNKNOWN_ID,
  vobizFields,
} from './callingBot.fixtures';

const voice = { languageCode: 'hi-IN', ttsSpeaker: 'anushka', ttsModel: 'bulbul:v2' };

afterEach(() => jest.restoreAllMocks());

describe('checkSarvam', () => {
  it('speaks one word in the chosen voice with the key', async () => {
    const fetchMock = mockFetch().mockResolvedValue(jsonResponse({ audios: ['UklGR'] }));
    const key = credential('sarvam');
    await expect(checkSarvam(key, voice)).resolves.toBeUndefined();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.sarvam.ai/text-to-speech');
    expect(init.headers).toMatchObject({ 'api-subscription-key': key });
    expect(JSON.parse(String(init.body))).toEqual({
      text: 'Hello',
      language_code: 'hi-IN',
      speaker: 'anushka',
      model: 'bulbul:v2',
    });
  });

  it.each([401, 403])('says the key is refused on HTTP %i', async (status) => {
    mockFetch().mockResolvedValue(jsonResponse({}, status));
    await expect(checkSarvam('k', voice)).rejects.toThrow('Sarvam AI refused the key.');
  });

  it('names a refused language or voice with Sarvam’s detail, cut to 300 characters', async () => {
    mockFetch().mockResolvedValue(new Response(`bad speaker ${'x'.repeat(400)}`, { status: 400 }));
    const error = await checkSarvam('k', voice).catch((e: Error) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toMatch(
      /^Sarvam AI refused the language or voice \(HTTP 400\): bad speaker x+$/,
    );
    expect((error as Error).message.endsWith('x'.repeat(288))).toBe(true);
    expect((error as Error).message).not.toContain('x'.repeat(289));
  });
});

describe('callingBotConfigs.create / list / active', () => {
  it('stores a config with a generated ticket secret, newest first', async () => {
    const first = await callingBotConfigs.create(configInput({ label: 'First' }));
    const second = await callingBotConfigs.create(configInput({ label: 'Second' }));
    expect(first.ticketSecret).toMatch(/^[\w-]{43}$/);
    expect(second.ticketSecret).not.toBe(first.ticketSecret);
    expect((await callingBotConfigs.list()).map((c) => c.label)).toEqual(['Second', 'First']);
    expect(await callingBotConfigs.active()).toBeNull();
  });

  it('makes a new active config the only active one', async () => {
    await callingBotConfigs.create(configInput({ label: 'Old', isActive: true }));
    await callingBotConfigs.create(configInput({ label: 'New', isActive: true }));
    expect((await callingBotConfigs.active())?.label).toBe('New');
    expect(await CallingBotConfigModel.countDocuments({ isActive: true })).toBe(1);
  });

  it('requires both keys', async () => {
    await expect(callingBotConfigs.create(configInput({ sarvamApiKey: ' ' }))).rejects.toThrow(
      'A Sarvam AI key is required.',
    );
    await expect(callingBotConfigs.create(configInput({ openAiApiKey: '' }))).rejects.toThrow(
      'An OpenAI key is required.',
    );
  });

  it('accepts a complete phone provider and refuses an incomplete one by name', async () => {
    await expect(callingBotConfigs.create(configInput(twilioFields()))).resolves.toMatchObject({
      phoneProvider: 'TWILIO',
    });
    await expect(
      callingBotConfigs.create(configInput({ ...vobizFields(), vobizNumber: '' })),
    ).rejects.toThrow('Fill in every Vobiz field, or choose no phone calls.');
    await expect(
      callingBotConfigs.create(configInput({ ...twilioFields(), twilioAuthToken: '' })),
    ).rejects.toThrow('Fill in every Twilio field');
  });
});

describe('callingBotConfigs.update', () => {
  it('keeps stored keys sent blank, and moves the active flag to it', async () => {
    const other = await callingBotConfigs.create(configInput({ label: 'Other', isActive: true }));
    const saved = await callingBotConfigs.create(configInput(vobizFields()));
    const updated = await callingBotConfigs.update(
      String(saved._id),
      configInput({
        ...vobizFields(),
        label: 'Renamed',
        sarvamApiKey: '',
        openAiApiKey: ' ',
        vobizAuthToken: '',
        isActive: true,
      }),
    );
    expect(updated).toMatchObject({
      label: 'Renamed',
      sarvamApiKey: saved.sarvamApiKey,
      openAiApiKey: saved.openAiApiKey,
      vobizAuthToken: saved.vobizAuthToken,
      isActive: true,
    });
    const before = await CallingBotConfigModel.findById(other._id).lean();
    expect(before?.isActive).toBe(false);
  });

  it('leaves other configs alone when it is not made active', async () => {
    const other = await callingBotConfigs.create(configInput({ isActive: true }));
    const saved = await callingBotConfigs.create(configInput());
    await callingBotConfigs.update(String(saved._id), configInput({ label: 'Quiet' }));
    expect((await callingBotConfigs.active())?._id).toEqual(other._id);
  });

  it('counts the stored token when checking the phone provider is complete', async () => {
    const saved = await callingBotConfigs.create(configInput(twilioFields()));
    await expect(
      callingBotConfigs.update(
        String(saved._id),
        configInput({ ...twilioFields(), twilioAuthToken: '' }),
      ),
    ).resolves.toMatchObject({ phoneProvider: 'TWILIO' });
    await expect(
      callingBotConfigs.update(
        String(saved._id),
        configInput({ ...twilioFields(), twilioNumber: '' }),
      ),
    ).rejects.toThrow('Fill in every Twilio field');
  });

  it('refuses an unknown config', async () => {
    await expect(callingBotConfigs.update(UNKNOWN_ID, configInput())).rejects.toThrow(
      'Calling bot config not found',
    );
  });

  it('refuses a config deleted between the read and the write', async () => {
    const saved = await callingBotConfigs.create(configInput());
    jest
      .spyOn(CallingBotConfigModel, 'findByIdAndUpdate')
      .mockReturnValue(asArg(CallingBotConfigModel.findById(UNKNOWN_ID)));
    await expect(callingBotConfigs.update(String(saved._id), configInput())).rejects.toThrow(
      'Calling bot config not found',
    );
  });
});

describe('callingBotConfigs.remove / reveal', () => {
  it('deletes a config and returns it, then refuses it as unknown', async () => {
    const saved = await callingBotConfigs.create(configInput());
    expect((await callingBotConfigs.remove(String(saved._id))).label).toBe('Primary');
    await expect(callingBotConfigs.remove(String(saved._id))).rejects.toThrow(
      'Calling bot config not found',
    );
  });

  it('reveals one stored key with the label', async () => {
    const saved = await callingBotConfigs.create(configInput(twilioFields()));
    await expect(callingBotConfigs.reveal(String(saved._id), 'twilioAuthToken')).resolves.toEqual({
      label: 'Primary',
      value: credential('twilio'),
    });
  });

  it('reveals an empty string for a key an old row never stored', async () => {
    const saved = await callingBotConfigs.create(configInput());
    await CallingBotConfigModel.updateOne({ _id: saved._id }, { $unset: { vobizAuthToken: '' } });
    await expect(callingBotConfigs.reveal(String(saved._id), 'vobizAuthToken')).resolves.toEqual({
      label: 'Primary',
      value: '',
    });
  });

  it('refuses to reveal from an unknown config', async () => {
    await expect(callingBotConfigs.reveal(UNKNOWN_ID, 'sarvamApiKey')).rejects.toThrow(
      'Calling bot config not found',
    );
  });
});

describe('callingBotConfigs.test', () => {
  it('proves the OpenAI model and the Sarvam voice', async () => {
    const saved = await callingBotConfigs.create(configInput());
    const verify = jest.spyOn(openAiClient, 'verify').mockResolvedValue();
    const fetchMock = mockFetch().mockResolvedValue(jsonResponse({}));
    await expect(callingBotConfigs.test(String(saved._id))).resolves.toBe(true);
    expect(verify).toHaveBeenCalledWith({
      apiKey: credential('openai'),
      defaultModel: 'gpt-4o-mini',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('says OpenAI refused, with its reason, before trying Sarvam', async () => {
    const saved = await callingBotConfigs.create(configInput());
    jest.spyOn(openAiClient, 'verify').mockRejectedValue(new Error('model not found'));
    const fetchMock = mockFetch();
    await expect(callingBotConfigs.test(String(saved._id))).rejects.toThrow(
      'OpenAI refused the key or cannot reach the model. model not found',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('passes a Sarvam refusal through', async () => {
    const saved = await callingBotConfigs.create(configInput());
    jest.spyOn(openAiClient, 'verify').mockResolvedValue();
    mockFetch().mockResolvedValue(jsonResponse({}, 401));
    await expect(callingBotConfigs.test(String(saved._id))).rejects.toThrow(
      'Sarvam AI refused the key.',
    );
  });

  it('refuses an unknown config', async () => {
    await expect(callingBotConfigs.test(UNKNOWN_ID)).rejects.toThrow(
      'Calling bot config not found',
    );
  });
});
