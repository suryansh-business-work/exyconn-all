import type { Branding } from './types';

const DEFAULT_OWNER = 'Exyconn';

/** Whoever the portal says owns the product: the legal name, else the trading name. */
function ownerOf(branding: Branding | null): string {
  const legal = branding?.legalName ?? '';
  if (legal !== '') {
    return legal;
  }
  const business = branding?.businessName ?? '';
  return business === '' ? DEFAULT_OWNER : business;
}

/**
 * The copyright notice, exactly as the portal's own website builds it: the admin can author
 * the whole line in the branding settings, and when they have not, it is composed from the
 * legal name and this year. Either way the apps ship no company name of their own.
 */
export function copyrightNotice(branding: Branding | null, now: Date = new Date()): string {
  const authored = branding?.copyrightText ?? '';
  if (authored !== '') {
    return authored;
  }
  return `© ${now.getFullYear()} ${ownerOf(branding)}. All rights reserved.`;
}
