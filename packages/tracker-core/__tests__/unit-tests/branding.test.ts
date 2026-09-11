import { describe, expect, it } from 'vitest';
import { copyrightNotice } from '../../src/branding';
import type { Branding } from '../../src/types';

const JAN_2026 = new Date(2026, 0, 15);

function branding(overrides: Partial<Branding>): Branding {
  return {
    businessName: '',
    legalName: '',
    slogan: '',
    logoUrl: '',
    logoDarkUrl: '',
    appIconUrl: '',
    faviconUrl: '',
    primaryColor: '',
    secondaryColor: '',
    accentColor: '',
    backgroundColor: '',
    textColor: '',
    supportEmail: '',
    websiteUrl: '',
    copyrightText: '',
    ...overrides,
  };
}

describe('copyrightNotice', () => {
  it('uses the line the admin authored, verbatim', () => {
    expect(copyrightNotice(branding({ copyrightText: 'Made by Exyconn' }), JAN_2026)).toBe(
      'Made by Exyconn',
    );
  });

  it('composes one from the legal name first', () => {
    expect(
      copyrightNotice(
        branding({ legalName: 'Exyconn Pvt Ltd', businessName: 'Exyconn' }),
        JAN_2026,
      ),
    ).toBe('© 2026 Exyconn Pvt Ltd. All rights reserved.');
  });

  it('falls back to the trading name, then the product name', () => {
    expect(copyrightNotice(branding({ businessName: 'Acme' }), JAN_2026)).toBe(
      '© 2026 Acme. All rights reserved.',
    );
    expect(copyrightNotice(null, JAN_2026)).toBe('© 2026 Exyconn. All rights reserved.');
  });
});
