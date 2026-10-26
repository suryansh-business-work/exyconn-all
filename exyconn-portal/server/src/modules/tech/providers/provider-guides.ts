import { DEVELOPER_GUIDES } from './provider-guides.developer';
import { MESSAGING_GUIDES } from './provider-guides.messaging';
import { PAYMENT_GUIDES } from './provider-guides.payments';
import { SERVICE_GUIDES } from './provider-guides.services';
import type { ProviderGuide } from './provider-guide.types';

/** Every provider Environment Variables documents, by section slug. */
const GUIDES: ReadonlyMap<string, ProviderGuide> = new Map(
  [...MESSAGING_GUIDES, ...SERVICE_GUIDES, ...PAYMENT_GUIDES, ...DEVELOPER_GUIDES].map((g) => [
    g.provider,
    g,
  ]),
);

export const providerGuide = (provider: string): ProviderGuide | null =>
  GUIDES.get(provider) ?? null;

export const isKnownProvider = (provider: string): boolean => GUIDES.has(provider);
