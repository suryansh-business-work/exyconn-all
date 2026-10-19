import { vi } from 'vitest';

/** The company branding a demo page reads (Admin > Branding), with every field filled in. */
export interface BrandingFixture {
  logoUrl?: string | null;
  logoDarkUrl?: string | null;
  businessName?: string | null;
  websiteUrl?: string | null;
  supportEmail?: string | null;
  legalName?: string | null;
}

export const brand = (patch: BrandingFixture = {}): BrandingFixture => ({
  logoUrl: 'https://cdn.example.test/acme.svg',
  logoDarkUrl: 'https://cdn.example.test/acme-dark.svg',
  businessName: 'Acme',
  websiteUrl: 'https://acme.example.test/',
  supportEmail: 'hello@acme.example.test',
  legalName: 'Acme Private Limited',
  ...patch,
});

/** Stands in for `usePublicBrandingQuery`; set what it answers with `answerBranding`. */
export const brandingQuery = vi.fn();

export function answerBranding(branding: BrandingFixture | null | undefined) {
  brandingQuery.mockReturnValue({
    data: branding === undefined ? undefined : { publicBranding: branding },
  });
}
