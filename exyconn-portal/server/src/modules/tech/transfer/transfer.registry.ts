import type { Model } from 'mongoose';
import { FirecrawlConfigModel } from '../../web-scraper/firecrawl-config.model';
import { MicrosoftMailConfigModel } from '../../microsoft-mail/microsoft.models';
import { SECRETS } from '../tech.reveal';

type StoredRow = Record<string, unknown>;

/** One kind of config the JSON export carries: where it lives and which fields are secret. */
export interface TransferKind {
  /** The Environment Variables section it belongs to. */
  section: string;
  model: Model<StoredRow>;
  secrets: Array<{ field: string; sealed: boolean }>;
  /** Singletons found by a key (`key`, `app`) are updated in place; others are added. */
  keyField?: string;
  /** Each company's own config (the support mailbox), not the platform's. */
  companyScoped?: boolean;
}

/** The section each config model belongs to, by mongoose model name. */
const SECTION_OF: Readonly<Record<string, string>> = {
  SlackConfig: 'slack',
  EmailConfig: 'smtp',
  InboundMailConfig: 'inbound-mail',
  EmailVerifierConfig: 'email-verifier',
  GmailConfig: 'email-accounts',
  MicrosoftMailConfig: 'email-accounts',
  GoogleSignInConfig: 'google-sign-in',
  GoogleMapsConfig: 'google-maps',
  ImageConfig: 'imagekit',
  PexelsConfig: 'pexels',
  OpenAiConfig: 'openai',
  FirecrawlConfig: 'firecrawl',
  StripeConfig: 'stripe',
  RazorpayConfig: 'razorpay',
  PaypalConfig: 'paypal',
  PayoneerConfig: 'payoneer',
  GodaddyConfig: 'godaddy',
  CloudflareConfig: 'cloudflare',
  GithubConfig: 'github',
  SonarConfig: 'sonarqube',
  BillingKeyConfig: 'billing-keys',
  SocialAppConfig: 'social-apps',
};

/** Secrets the reveal registry has no eye for, but an export must still carry. */
const EXTRA_SECRETS: ReadonlyArray<{ model: unknown; field: string; keyField?: string }> = [
  { model: FirecrawlConfigModel, field: 'apiKey' },
  { model: MicrosoftMailConfigModel, field: 'clientSecret', keyField: 'key' },
];

/**
 * Every exportable config kind, built from the reveal registry (tech.reveal SECRETS) so the
 * list of secret fields is written once. Keyed by mongoose model name.
 */
function buildKinds(): Map<string, TransferKind> {
  const kinds = new Map<string, TransferKind>();
  const add = (
    model: Model<StoredRow>,
    field: string,
    extra: Partial<TransferKind>,
    sealed: boolean,
  ) => {
    const name = model.modelName;
    const kind = kinds.get(name) ?? {
      section: SECTION_OF[name] ?? 'other',
      model,
      secrets: [],
      ...extra,
    };
    kind.secrets.push({ field, sealed });
    kinds.set(name, kind);
  };
  for (const source of Object.values(SECRETS)) {
    add(
      source.model,
      source.field,
      { keyField: source.keyField, companyScoped: source.companyScoped },
      Boolean(source.sealed),
    );
  }
  for (const extra of EXTRA_SECRETS) {
    add(extra.model as Model<StoredRow>, extra.field, { keyField: extra.keyField }, false);
  }
  return kinds;
}

export const TRANSFER_KINDS: ReadonlyMap<string, TransferKind> = buildKinds();

/** The kinds in one section, or every kind when no section is given. */
export function kindsFor(section: string | null): Array<[string, TransferKind]> {
  return [...TRANSFER_KINDS.entries()].filter(([, kind]) => !section || kind.section === section);
}
