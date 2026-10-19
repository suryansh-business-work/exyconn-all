import { describe, expect, it } from 'vitest';
import {
  FIRECRAWL_DEFAULT_BASE_URL,
  isHostedFirecrawl,
  makeFirecrawlConfigSchema,
} from '../../../../../../src/pages/environment-variables/forms/firecrawl-config/firecrawl-config.types';

const values = (overrides: Record<string, string> = {}) => ({
  label: 'Scraper',
  baseUrl: FIRECRAWL_DEFAULT_BASE_URL,
  apiKey: '',
  isActive: 'true',
  ...overrides,
});

describe('isHostedFirecrawl', () => {
  it('recognises the hosted API by its host, ignoring path and spaces', () => {
    expect(isHostedFirecrawl(FIRECRAWL_DEFAULT_BASE_URL)).toBe(true);
    expect(isHostedFirecrawl('  https://api.firecrawl.dev/v1  ')).toBe(true);
  });

  it('treats any other host as self-hosted', () => {
    expect(isHostedFirecrawl('http://firecrawl.internal:3002')).toBe(false);
    expect(isHostedFirecrawl('https://api.firecrawl.dev.example.com')).toBe(false);
  });

  it('is not hosted when the address cannot be parsed', () => {
    expect(isHostedFirecrawl('')).toBe(false);
    expect(isHostedFirecrawl('not a url')).toBe(false);
  });
});

describe('makeFirecrawlConfigSchema', () => {
  it('needs a key to create a hosted config', () => {
    const result = makeFirecrawlConfigSchema(false).safeParse(values());
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      path: ['apiKey'],
      message: 'An API key is required for the hosted Firecrawl API',
    });
  });

  it('creates a self-hosted config without a key', () => {
    const result = makeFirecrawlConfigSchema(false).safeParse(
      values({ baseUrl: 'http://firecrawl.internal:3002' }),
    );
    expect(result.success).toBe(true);
  });

  it('keeps the stored key on an edit of the hosted API', () => {
    expect(makeFirecrawlConfigSchema(true).safeParse(values()).success).toBe(true);
  });

  it('trims what is typed', () => {
    const result = makeFirecrawlConfigSchema(false).parse(
      values({ label: '  Scraper  ', apiKey: ' fc-key ' }),
    );
    expect(result).toMatchObject({ label: 'Scraper', apiKey: 'fc-key' });
  });
});
