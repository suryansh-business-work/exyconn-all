import { secretHint, techSecretResolvers } from '../../../../src/modules/tech/tech.secrets';
import { requireSecret, withoutBlankSecret } from '../../../../src/modules/tech/tech.service';
import { codeOf } from '../codeOf';
import { credential } from './tech.fixtures';

describe('a secret hint', () => {
  it('shows the last four characters of a long token', () => {
    const token = credential('hinted');

    expect(secretHint(token)).toBe(token.slice(-4));
  });

  it('starts at sixteen characters, and shows nothing below that', () => {
    expect(secretHint('a'.repeat(15))).toBeNull();
    expect(secretHint(`${'a'.repeat(12)}wxyz`)).toBe('wxyz');
  });

  it('is null when there is no string to hint at', () => {
    expect(secretHint(undefined)).toBeNull();
    expect(secretHint(null)).toBeNull();
    expect(secretHint(1234567890123456)).toBeNull();
  });
});

describe('the write-only secret fields', () => {
  const token = credential('stored');

  it('say whether each credential is stored, never what it is', () => {
    expect(techSecretResolvers.EmailConfig.hasPassword({ password: token })).toBe(true);
    expect(techSecretResolvers.EmailConfig.hasPassword({ password: '' })).toBe(false);
    expect(techSecretResolvers.EmailConfig.hasPassword({})).toBe(false);
    expect(techSecretResolvers.ImageConfig.hasPrivateKey({ privateKey: 42 })).toBe(false);
    expect(techSecretResolvers.SlackConfig.hasSigningSecret({ signingSecret: null })).toBe(false);
  });

  it('hint at the long tokens on every credential type that carries one', () => {
    const last = token.slice(-4);

    expect(techSecretResolvers.ImageConfig.privateKeyHint({ privateKey: token })).toBe(last);
    expect(techSecretResolvers.SlackConfig.botTokenHint({ botToken: token })).toBe(last);
    expect(techSecretResolvers.GithubConfig.tokenHint({ token })).toBe(last);
    expect(techSecretResolvers.PexelsConfig.apiKeyHint({ apiKey: token })).toBe(last);
    expect(techSecretResolvers.OpenAiConfig.apiKeyHint({ apiKey: token })).toBe(last);
    expect(techSecretResolvers.SonarConfig.tokenHint({ token })).toBe(last);
    expect(techSecretResolvers.GithubConfig.tokenHint({})).toBeNull();
  });

  it('read each type its own field', () => {
    const resolvers = techSecretResolvers;

    expect(resolvers.SlackConfig.hasBotToken({ botToken: token })).toBe(true);
    expect(resolvers.SlackConfig.hasBotToken({ token })).toBe(false);
    expect(resolvers.GithubConfig.hasToken({ token })).toBe(true);
    expect(resolvers.SonarConfig.hasToken({ token })).toBe(true);
    expect(resolvers.PexelsConfig.hasApiKey({ apiKey: token })).toBe(true);
    expect(resolvers.OpenAiConfig.hasApiKey({ token })).toBe(false);
  });
});

describe('a blank secret on an edit', () => {
  const input = { label: 'Primary', token: '  ' };

  it('is dropped from the update, so the stored one stays', () => {
    expect(withoutBlankSecret(input, 'token')).toEqual({ label: 'Primary' });
    expect(input).toEqual({ label: 'Primary', token: '  ' });
  });

  it('is sent as-is when it holds a value', () => {
    const filled = { label: 'Primary', token: credential('kept') };

    expect(withoutBlankSecret(filled, 'token')).toBe(filled);
  });

  it('leaves a field that is not a string alone', () => {
    type Input = { label: string; token?: string | null };
    const nulled: Input = { label: 'Primary', token: null };
    const missing: Input = { label: 'Primary' };

    expect(withoutBlankSecret(nulled, 'token')).toBe(nulled);
    expect(withoutBlankSecret(missing, 'token')).toBe(missing);
  });
});

describe('a required secret on create', () => {
  const check = async (value: string | undefined) => {
    requireSecret(value, 'An API key');
  };

  it('is refused when missing or only whitespace', async () => {
    expect(await codeOf(check(undefined))).toBe('BAD_USER_INPUT');
    expect(await codeOf(check(''))).toBe('BAD_USER_INPUT');
    await expect(check(' \t ')).rejects.toThrow('An API key is required.');
  });

  it('passes a real value', () => {
    expect(() => requireSecret(credential('present'), 'An API key')).not.toThrow();
  });
});
