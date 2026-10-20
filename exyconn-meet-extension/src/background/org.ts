import { translate, type Interpolations, type Messages } from '@exyconn/i18n';
import { createSlot, isRecord } from '../storage/area';
import type { OrgContext } from '../types/messages';
import { api, auth, logger, onSignedOut } from './services';

/** How long the company's switches are trusted before they are fetched again. */
const ORG_TTL_MS = 10 * 60_000;

interface CachedOrg {
  org: OrgContext;
  fetchedAt: number;
}

const orgSlot = createSlot<CachedOrg>(chrome.storage.session, 'org', (raw) =>
  isRecord(raw) && isRecord(raw.org) && typeof raw.fetchedAt === 'number'
    ? (raw as unknown as CachedOrg)
    : null,
);

const messagesSlot = createSlot<{ locale: string; messages: Messages }>(
  chrome.storage.local,
  'i18n',
  (raw) =>
    isRecord(raw) && isRecord(raw.messages) && typeof raw.locale === 'string'
      ? (raw as { locale: string; messages: Messages })
      : null,
);

onSignedOut(async () => {
  await orgSlot.clear();
});

/**
 * The signed-in user's company context (switches, limits, who they are), cached for a few
 * minutes. Null when signed out — or when the portal cannot be reached and nothing is cached.
 */
export async function getOrg(force = false): Promise<OrgContext | null> {
  if (!(await auth.isSignedIn())) {
    return null;
  }
  const cached = await orgSlot.read();
  if (!force && cached !== null && Date.now() - cached.fetchedAt < ORG_TTL_MS) {
    return cached.org;
  }
  try {
    const org = await api.extensionContext();
    await orgSlot.write({ org, fetchedAt: Date.now() });
    return org;
  } catch (error) {
    logger.warn('Could not load the meeting assistant settings', error);
    return cached?.org ?? null;
  }
}

export async function clearOrg(): Promise<void> {
  await orgSlot.clear();
}

/** The browser's UI language, e.g. `en-US`. */
export function uiLocale(): string {
  return chrome.i18n.getUILanguage();
}

/** The portal's translations for the browser's language, cached; empty means English. */
export async function getMessages(): Promise<Messages> {
  const locale = uiLocale();
  const cached = await messagesSlot.read();
  if (cached?.locale === locale) {
    return cached.messages;
  }
  try {
    const messages = await api.localeMessages(locale);
    await messagesSlot.write({ locale, messages });
    return messages;
  } catch (error) {
    logger.warn('Could not load translations', error);
    return {};
  }
}

/** Translates a string in the worker (notifications, badge titles). */
export async function tr(source: string, values?: Interpolations): Promise<string> {
  return translate(source, { messages: await getMessages() }, values);
}
