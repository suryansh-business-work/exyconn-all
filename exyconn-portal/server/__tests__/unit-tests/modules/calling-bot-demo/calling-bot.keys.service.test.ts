import { testCallingBotKey } from '../../../../src/modules/calling-bot-demo/calling-bot.keys.service';
import { callingBotConfigs } from '../../../../src/modules/calling-bot-demo/calling-bot.config.service';
import { openAiClient } from '../../../../src/utils/openai';
import {
  configInput,
  credential,
  jsonResponse,
  mockFetch,
  twilioFields,
  UNKNOWN_ID,
  vobizFields,
} from './callingBot.fixtures';

afterEach(() => jest.restoreAllMocks());

const savedId = async () =>
  String((await callingBotConfigs.create(configInput({ ...vobizFields() })))._id);

describe('testCallingBotKey — SARVAM', () => {
  it('speaks with the typed key and voice', async () => {
    const fetchMock = mockFetch().mockResolvedValue(jsonResponse({}));
    await expect(
      testCallingBotKey({
        key: 'SARVAM',
        sarvamApiKey: ' typed-key ',
        languageCode: 'ta-IN',
        ttsModel: 'bulbul:v2',
        ttsSpeaker: 'vidya',
      }),
    ).resolves.toBe('Sarvam AI accepted the key and spoke in the chosen voice.');
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.headers).toMatchObject({ 'api-subscription-key': 'typed-key' });
    expect(JSON.parse(String(init.body))).toMatchObject({ language_code: 'ta-IN', speaker: 'vidya' });
  });

  it('fills blank values from the config being edited', async () => {
    const configId = await savedId();
    const fetchMock = mockFetch().mockResolvedValue(jsonResponse({}));
    await testCallingBotKey({ configId, key: 'SARVAM', sarvamApiKey: '', languageCode: null });
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.headers).toMatchObject({ 'api-subscription-key': credential('sarvam') });
    expect(JSON.parse(String(init.body))).toMatchObject({
      language_code: 'en-IN',
      speaker: 'anushka',
      model: 'bulbul:v2',
    });
  });

  it('asks for a value neither typed nor saved', async () => {
    const fetchMock = mockFetch();
    await expect(testCallingBotKey({ key: 'SARVAM', sarvamApiKey: '  ' })).rejects.toThrow(
      'Enter the Sarvam AI key first.',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('testCallingBotKey — OPENAI', () => {
  it('verifies the key can use the model', async () => {
    const verify = jest.spyOn(openAiClient, 'verify').mockResolvedValue();
    await expect(
      testCallingBotKey({ key: 'OPENAI', openAiApiKey: 'sk-typed', openAiModel: 'gpt-4o' }),
    ).resolves.toBe('OpenAI accepted the key and can use gpt-4o.');
    expect(verify).toHaveBeenCalledWith({ apiKey: 'sk-typed', defaultModel: 'gpt-4o' });
  });

  it('names the model and OpenAI’s reason when refused', async () => {
    const configId = await savedId();
    jest.spyOn(openAiClient, 'verify').mockRejectedValue(new Error('401 invalid key'));
    await expect(testCallingBotKey({ configId, key: 'OPENAI' })).rejects.toThrow(
      'OpenAI refused the key, or the key cannot use gpt-4o-mini. 401 invalid key',
    );
  });

  it('asks for the model before trying', async () => {
    const verify = jest.spyOn(openAiClient, 'verify');
    await expect(testCallingBotKey({ key: 'OPENAI', openAiApiKey: 'sk' })).rejects.toThrow(
      'Enter the OpenAI model first.',
    );
    expect(verify).not.toHaveBeenCalled();
  });
});

describe('testCallingBotKey — VOBIZ and TWILIO', () => {
  it('verifies the saved Vobiz account', async () => {
    const configId = await savedId();
    const fetchMock = mockFetch().mockResolvedValue(jsonResponse({}));
    await expect(testCallingBotKey({ configId, key: 'VOBIZ' })).resolves.toBe(
      'Vobiz accepted the Auth ID and Auth Token.',
    );
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      headers: { 'X-Auth-ID': 'MA_VOBIZ_ID', 'X-Auth-Token': credential('vobiz') },
    });
  });

  it('asks for the Vobiz token when only the id is typed', async () => {
    await expect(testCallingBotKey({ key: 'VOBIZ', vobizAuthId: 'MA1' })).rejects.toThrow(
      'Enter the Vobiz Auth Token first.',
    );
  });

  it('verifies a Twilio account and names it', async () => {
    mockFetch().mockResolvedValue(jsonResponse({ friendly_name: 'Exyconn', status: 'active' }));
    const { twilioAccountSid, twilioAuthToken } = twilioFields();
    await expect(
      testCallingBotKey({ key: 'TWILIO', twilioAccountSid, twilioAuthToken }),
    ).resolves.toBe('Twilio accepted the credentials for "Exyconn".');
  });

  it('refuses an unknown config being edited', async () => {
    await expect(testCallingBotKey({ configId: UNKNOWN_ID, key: 'TWILIO' })).rejects.toThrow(
      'Calling bot config not found',
    );
  });
});
