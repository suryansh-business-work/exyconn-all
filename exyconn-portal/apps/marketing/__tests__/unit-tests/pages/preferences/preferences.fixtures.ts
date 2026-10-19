import type { PreferenceCategoryRow } from '../../../../src/pages/preferences/forms/preference-category';
import type { MarketingFooterRow } from '../../../../src/pages/preferences/forms/marketing-footer';

/** A preference category, as the grid and its form receive it. */
export function categoryRow(overrides: Partial<PreferenceCategoryRow> = {}): PreferenceCategoryRow {
  return {
    __typename: 'PreferenceCategory',
    id: 'cat-1',
    name: 'Product updates',
    description: 'Launches and new features',
    isActive: true,
    sortOrder: 1,
    ...overrides,
  };
}

/** The organization's saved email footer, as the footer form's values. */
export const FOOTER: MarketingFooterRow = {
  companyName: 'Acme Corp',
  contactLine: 'hello@acme.io',
  postalAddress: '12 Park Street, Kolkata',
  privacyUrl: 'https://acme.io/privacy',
  websiteUrl: '',
  textColor: '#6b7280',
  linkColor: '',
};
