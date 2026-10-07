import type {
  EmailConfigInput,
  GithubConfigInput,
  ImageConfigInput,
  InboundMailConfigInput,
  OpenAiConfigInput,
  PexelsConfigInput,
  SlackConfigInput,
} from '../../../../src/modules/tech/tech.service';

/**
 * A credential for a test, built at runtime: a literal secret in source is a secret in the
 * repository, even a fake one. Long enough (over 16 characters) to earn a hint.
 */
export const credential = (tag: string): string => [tag, 'test', 'credential', 'value'].join('-');

export const emailInput = (overrides: Partial<EmailConfigInput> = {}): EmailConfigInput => ({
  label: 'Primary',
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  username: 'mailer@example.com',
  password: credential('smtp'),
  fromAddress: 'Portal <no-reply@example.com>',
  ...overrides,
});

export const inboundInput = (
  overrides: Partial<InboundMailConfigInput> = {},
): InboundMailConfigInput => ({
  label: 'Support inbox',
  host: 'imap.example.com',
  port: 993,
  secure: true,
  user: 'help@example.com',
  password: credential('imap'),
  mailbox: 'INBOX',
  pollSeconds: 120,
  deleteAfterImport: false,
  ...overrides,
});

export const imageInput = (overrides: Partial<ImageConfigInput> = {}): ImageConfigInput => ({
  label: 'Primary',
  provider: 'imagekit',
  publicKey: 'public_key',
  privateKey: credential('imagekit'),
  urlEndpoint: 'https://ik.imagekit.io/demo',
  ...overrides,
});

export const slackInput = (overrides: Partial<SlackConfigInput> = {}): SlackConfigInput => ({
  label: 'Primary',
  botToken: credential('slack'),
  defaultChannel: '#releases',
  ...overrides,
});

export const githubInput = (overrides: Partial<GithubConfigInput> = {}): GithubConfigInput => ({
  label: 'Primary',
  owner: 'exyconn',
  repo: 'exyconn-all',
  token: credential('github'),
  ...overrides,
});

export const pexelsInput = (overrides: Partial<PexelsConfigInput> = {}): PexelsConfigInput => ({
  label: 'Primary',
  apiKey: credential('pexels'),
  ...overrides,
});

export const openAiInput = (overrides: Partial<OpenAiConfigInput> = {}): OpenAiConfigInput => ({
  label: 'Primary',
  apiKey: credential('openai'),
  defaultModel: 'gpt-4o-mini',
  ...overrides,
});

/** An id no row has. */
export const UNKNOWN_ID = '64b7f1c2e4b0a1a2b3c4d5e6';
