import { afterEach, describe, expect, it, vi } from 'vitest';
import { deleteImage, sendSignatureTestEmail, uploadImage } from '../../shared/services';
import { OPENAI_SECRET_KEY, OpenAIRequestError, generateWithOpenAI, isKeyRejected } from '../../shared/services/openai';
import { jsonReply, stubFetch } from '../helpers/toolHarness';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const API = 'http://localhost:4002/api/common';

describe('uploadImage', () => {
  it('posts the file, folder and name as form data and returns the server answer', async () => {
    const fetchMock = stubFetch(jsonReply({ success: true, url: 'https://cdn/x.png', fileId: 'f1' }));
    const file = new File(['abc'], 'x.png', { type: 'image/png' });
    await expect(uploadImage(file, '/sigs', 'custom.png')).resolves.toEqual({
      success: true,
      url: 'https://cdn/x.png',
      fileId: 'f1',
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API}/imagekit/upload`);
    expect(init.method).toBe('POST');
    const form = init.body as FormData;
    expect(form.get('file')).toBeInstanceOf(File);
    expect(form.get('folder')).toBe('/sigs');
    expect(form.get('fileName')).toBe('custom.png');
  });

  it('defaults the folder and leaves the file name out when none is given', async () => {
    const fetchMock = stubFetch(jsonReply({ success: true }));
    await uploadImage(new File(['a'], 'a.png'));
    const form = fetchMock.mock.calls[0][1].body as FormData;
    expect(form.get('folder')).toBe('/tools');
    expect(form.has('fileName')).toBe(false);
  });

  it('turns a network failure into a failed result, with a default message for non-errors', async () => {
    const fetchMock = stubFetch();
    fetchMock.mockRejectedValueOnce(new Error('offline')).mockRejectedValueOnce('boom');
    const file = new File(['a'], 'a.png');
    await expect(uploadImage(file)).resolves.toEqual({ success: false, error: 'offline' });
    await expect(uploadImage(file)).resolves.toEqual({ success: false, error: 'Upload failed' });
  });
});

describe('deleteImage', () => {
  it('calls DELETE for the file id and reports the server verdict', async () => {
    const fetchMock = stubFetch(jsonReply({ success: true }), jsonReply({ success: false }));
    await expect(deleteImage('abc')).resolves.toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe(`${API}/imagekit/delete/abc`);
    expect(fetchMock.mock.calls[0][1]).toEqual({ method: 'DELETE' });
    await expect(deleteImage('abc')).resolves.toBe(false);
  });

  it('logs and returns false when the request fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    stubFetch().mockRejectedValueOnce(new Error('down'));
    await expect(deleteImage('abc')).resolves.toBe(false);
    expect(error).toHaveBeenCalledWith('Delete image error:', expect.any(Error));
  });
});

describe('sendSignatureTestEmail', () => {
  it('posts the recipient, html and sender as JSON', async () => {
    const fetchMock = stubFetch(jsonReply({ success: true, messageId: 'm1' }));
    await expect(sendSignatureTestEmail('a@b.co', '<p>sig</p>', 'Ann')).resolves.toEqual({
      success: true,
      messageId: 'm1',
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API}/email/send-signature-test`);
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(init.body)).toEqual({ to: 'a@b.co', signatureHtml: '<p>sig</p>', senderName: 'Ann' });
  });

  it('reports a failure with the error message, or a default one', async () => {
    const fetchMock = stubFetch();
    fetchMock.mockRejectedValueOnce(new Error('smtp down')).mockRejectedValueOnce(42);
    await expect(sendSignatureTestEmail('a@b.co', 'x')).resolves.toEqual({ success: false, error: 'smtp down' });
    await expect(sendSignatureTestEmail('a@b.co', 'x')).resolves.toEqual({
      success: false,
      error: 'Failed to send test email',
    });
  });
});

describe('api base URL outside local development', () => {
  const callUpload = async () => {
    vi.resetModules();
    const fetchMock = stubFetch(jsonReply({ success: true }));
    const { uploadImage: upload } = await import('../../shared/services/api');
    await upload(new File(['a'], 'a.png'));
    return fetchMock.mock.calls[0][0];
  };

  it('uses the configured host', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test');
    await expect(callUpload()).resolves.toBe('https://api.example.test/api/common/imagekit/upload');
  });

  it('uses the production host when none is configured', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_API_BASE_URL', '');
    await expect(callUpload()).resolves.toBe('https://tools-api.exyconn.com/api/common/imagekit/upload');
  });
});

describe('generateWithOpenAI', () => {
  const okBody = (content: string | null, usage = { prompt_tokens: 3, completion_tokens: 4, total_tokens: 7 }) => ({
    choices: content === null ? [] : [{ message: { content } }],
    usage,
  });

  it('sends the key, model and both prompts, and returns content with usage', async () => {
    const fetchMock = stubFetch(jsonReply(okBody('hi')));
    const result = await generateWithOpenAI('sk-1', 'be brief', 'say hi', 'gpt-test');
    expect(result).toEqual({ content: 'hi', usage: { promptTokens: 3, completionTokens: 4, totalTokens: 7 } });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect(init.headers.Authorization).toBe('Bearer sk-1');
    expect(JSON.parse(init.body)).toEqual({
      model: 'gpt-test',
      messages: [
        { role: 'system', content: 'be brief' },
        { role: 'user', content: 'say hi' },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });
  });

  it('defaults the model', async () => {
    const fetchMock = stubFetch(jsonReply(okBody('x')));
    await generateWithOpenAI('k', 's', 'u');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).model).toBe('gpt-4o-mini');
  });

  it('tolerates a reply with no choices and no usage', async () => {
    stubFetch(jsonReply({ choices: [] }), jsonReply({ choices: [{ message: { content: '' } }], usage: {} }));
    const empty = { content: '', usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } };
    await expect(generateWithOpenAI('k', 's', 'u')).resolves.toEqual(empty);
    await expect(generateWithOpenAI('k', 's', 'u')).resolves.toEqual(empty);
  });

  it('throws an error that keeps the status and the provider message', async () => {
    stubFetch(jsonReply({ error: { message: 'Incorrect API key' } }, { ok: false, status: 401 }));
    const failure = await generateWithOpenAI('bad', 's', 'u').catch((e: unknown) => e);
    expect(failure).toBeInstanceOf(OpenAIRequestError);
    expect(failure).toMatchObject({ name: 'OpenAIRequestError', message: 'Incorrect API key', status: 401 });
  });

  it('falls back to a generic message when the provider gave none', async () => {
    stubFetch(jsonReply({}, { ok: false, status: 500 }));
    await expect(generateWithOpenAI('k', 's', 'u')).rejects.toThrow('Failed to generate response');
  });
});

describe('isKeyRejected', () => {
  it('is true only for 401 and 403 from OpenAI', () => {
    expect(isKeyRejected(new OpenAIRequestError('x', 401))).toBe(true);
    expect(isKeyRejected(new OpenAIRequestError('x', 403))).toBe(true);
    expect(isKeyRejected(new OpenAIRequestError('x', 429))).toBe(false);
    expect(isKeyRejected(new Error('401'))).toBe(false);
    expect(isKeyRejected(null)).toBe(false);
  });

  it('shares the secrets-drawer key name with the tools', () => {
    expect(OPENAI_SECRET_KEY).toBe('openai_api_key');
  });
});
