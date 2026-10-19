import { beforeEach, describe, expect, it, vi } from 'vitest';
import { env } from '@exyconn/shell/config/env';
import { useDemoBranding } from '../../../src/page/useDemoBranding';
import { renderHookWithProviders } from '../test-utils';
import { answerBranding, brand, brandingQuery } from './branding';

const colour = vi.hoisted(() => ({ mode: 'light' as 'light' | 'dark' }));
vi.mock('@exyconn/shell/theme/ColorModeContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/theme/ColorModeContext')>()),
  useColorMode: () => ({ mode: colour.mode, toggle: vi.fn() }),
}));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  usePublicBrandingQuery: () => brandingQuery(),
}));

const read = () => renderHookWithProviders(() => useDemoBranding()).result.current;

describe('useDemoBranding', () => {
  beforeEach(() => {
    colour.mode = 'light';
  });

  it("shows the company's branding, its website without a trailing slash", () => {
    answerBranding(brand());
    expect(read()).toEqual({
      logoUrl: 'https://cdn.example.test/acme.svg',
      name: 'Acme',
      websiteUrl: 'https://acme.example.test',
      supportEmail: 'hello@acme.example.test',
      legalName: 'Acme Private Limited',
    });
  });

  it('uses the dark logo in dark mode', () => {
    colour.mode = 'dark';
    answerBranding(brand());
    expect(read().logoUrl).toBe('https://cdn.example.test/acme-dark.svg');
  });

  it.each([
    ['light', env.logoUrl],
    ['dark', env.logoDarkUrl],
  ] as const)('falls back to the stock %s logo and name before branding answers', (mode, logo) => {
    colour.mode = mode;
    answerBranding(undefined);
    expect(read()).toEqual({
      logoUrl: logo,
      name: env.logoAlt,
      websiteUrl: '',
      supportEmail: '',
      legalName: env.logoAlt,
    });
  });

  it('treats empty and missing fields as not set', () => {
    answerBranding(
      brand({ logoUrl: '', businessName: '', websiteUrl: null, supportEmail: null, legalName: '' }),
    );
    expect(read()).toEqual({
      logoUrl: env.logoUrl,
      name: env.logoAlt,
      websiteUrl: '',
      supportEmail: '',
      legalName: env.logoAlt,
    });
  });

  it('names the business as the legal name when no legal name is set', () => {
    answerBranding(brand({ legalName: null }));
    expect(read().legalName).toBe('Acme');
  });

  it('keeps a website address that has no trailing slash as it is', () => {
    answerBranding(brand({ websiteUrl: 'https://acme.example.test/en' }));
    expect(read().websiteUrl).toBe('https://acme.example.test/en');
  });

  it('copes with a branding answer of null', () => {
    answerBranding(null);
    expect(read().name).toBe(env.logoAlt);
  });
});
