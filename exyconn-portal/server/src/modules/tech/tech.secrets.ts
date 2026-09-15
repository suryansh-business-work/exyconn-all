/**
 * What the API says about a platform credential instead of the credential itself.
 *
 * The SMTP password, the ImageKit private key, the Slack bot token, the GitHub token and the
 * Pexels/OpenAI API keys are write-only: a screen learns whether one is stored and, for the
 * long random tokens, its last few characters — enough to tell two keys apart, never enough to
 * use one. The services that send mail, upload or call out read the stored value directly.
 */

/** How many trailing characters of a token are shown. */
const HINT_LENGTH = 4;

/** Below this length the last four characters give away too much of the secret to show. */
const MIN_HINTABLE_LENGTH = 16;

type Row = Record<string, unknown>;

/** Whether a secret is stored on this row. */
const hasSecret = (field: string) => (row: Row) =>
  typeof row[field] === 'string' && row[field] !== '';

/** The last characters of a long token, or null when there is none or it is too short. */
export function secretHint(value: unknown): string | null {
  if (typeof value !== 'string' || value.length < MIN_HINTABLE_LENGTH) {
    return null;
  }
  return value.slice(-HINT_LENGTH);
}

const hintOf = (field: string) => (row: Row) => secretHint(row[field]);

/** Field resolvers for the write-only secrets on every platform credential type. */
export const techSecretResolvers = {
  EmailConfig: {
    hasPassword: hasSecret('password'),
  },
  ImageConfig: {
    hasPrivateKey: hasSecret('privateKey'),
    privateKeyHint: hintOf('privateKey'),
  },
  SlackConfig: {
    hasBotToken: hasSecret('botToken'),
    botTokenHint: hintOf('botToken'),
  },
  GithubConfig: {
    hasToken: hasSecret('token'),
    tokenHint: hintOf('token'),
  },
  PexelsConfig: {
    hasApiKey: hasSecret('apiKey'),
    apiKeyHint: hintOf('apiKey'),
  },
  OpenAiConfig: {
    hasApiKey: hasSecret('apiKey'),
    apiKeyHint: hintOf('apiKey'),
  },
};
