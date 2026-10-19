import {
  digitsOf,
  placeVobizCall,
  verifyVobiz,
  VOBIZ_API,
} from '../../../../src/modules/calling-bot-demo/vobiz.client';
import { logger } from '../../../../src/utils/logger';
import { credential, jsonResponse, mockFetch, sentBody } from './callingBot.fixtures';

const TOKEN = credential('vobiz');
const call = {
  config: {
    vobizAuthId: 'MA/ID',
    vobizAuthToken: TOKEN,
    vobizNumber: '+91 80000 00001',
    maxCallSeconds: 60,
  },
  to: '+91 98765-43210',
  answerUrl: 'https://voice.example/vobiz/answer?ticket=t',
  hangupUrl: 'https://voice.example/vobiz/hangup?ticket=t',
};

afterEach(() => jest.restoreAllMocks());

describe('digitsOf', () => {
  it('keeps only the digits of a number', () => {
    expect(digitsOf('+91 (98765) 43-210')).toBe('919876543210');
    expect(digitsOf('')).toBe('');
  });
});

describe('placeVobizCall', () => {
  it('posts the call as digits with the callbacks, and resolves to the request id', async () => {
    const fetchMock = mockFetch().mockResolvedValue(jsonResponse({ request_uuid: 'req-1' }, 201));
    await expect(placeVobizCall(call)).resolves.toBe('req-1');
    expect(fetchMock.mock.calls[0][0]).toBe(`${VOBIZ_API}/Account/MA%2FID/Call/`);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.headers).toMatchObject({ 'X-Auth-ID': 'MA/ID', 'X-Auth-Token': TOKEN });
    expect(JSON.parse(sentBody(fetchMock))).toEqual({
      from: '918000000001',
      to: '919876543210',
      answer_url: call.answerUrl,
      answer_method: 'POST',
      hangup_url: call.hangupUrl,
      hangup_method: 'POST',
      time_limit: 60,
    });
  });

  it('resolves to an empty id when Vobiz names none', async () => {
    mockFetch().mockResolvedValue(jsonResponse({}, 201));
    await expect(placeVobizCall(call)).resolves.toBe('');
  });

  it('says the account is out of balance on HTTP 402', async () => {
    mockFetch().mockResolvedValue(jsonResponse({}, 402));
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => logger);
    await expect(placeVobizCall(call)).rejects.toThrow('The calling account is out of balance.');
    expect(warn).toHaveBeenCalledWith('Vobiz refused a call: HTTP 402');
  });

  it('refuses any other failure with a browser-call hint', async () => {
    mockFetch().mockResolvedValue(jsonResponse({}, 500));
    jest.spyOn(logger, 'warn').mockImplementation(() => logger);
    await expect(placeVobizCall(call)).rejects.toThrow(
      'The phone call could not be placed. Try the browser call instead.',
    );
  });
});

describe('verifyVobiz', () => {
  it('reads the account the credentials belong to', async () => {
    const fetchMock = mockFetch().mockResolvedValue(jsonResponse({ auth_id: 'MA/ID' }));
    await expect(verifyVobiz('MA/ID', TOKEN)).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe(`${VOBIZ_API}/Account/MA%2FID/`);
  });

  it('refuses wrong credentials with the HTTP status', async () => {
    mockFetch().mockResolvedValue(jsonResponse({}, 403));
    await expect(verifyVobiz('MA/ID', TOKEN)).rejects.toThrow(
      'Vobiz refused the Auth ID or Auth Token (HTTP 403).',
    );
  });
});
