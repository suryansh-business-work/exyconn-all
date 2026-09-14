import { portalRequest } from "../portal/client";

/** Translations for one language, keyed by the English source string. */
export type Messages = Readonly<Record<string, string>>;

/**
 * How long a language's catalogue is held before the site asks the portal again.
 *
 * Long enough that a busy page costs no requests, short enough that a correction an admin
 * makes in the portal reaches the site while they are still looking at it.
 */
const CACHE_MS = 5 * 60 * 1000;

/**
 * Strings per request to the portal, which translates one batch per call.
 *
 * A page can hand over three hundred strings it has never seen; sending them as one call
 * would translate the first fifty and silently drop the rest, so they go in batches of the
 * size the portal actually works in.
 */
const BATCH = 50;

const LOCALE_BUNDLE = `
  query LocaleBundle($locale: String!) {
    localeBundle(locale: $locale) {
      locale
      translations {
        source
        text
      }
    }
  }
`;

const TRANSLATE_MISSING = `
  mutation TranslateMissing($locale: String!, $sources: [String!]!) {
    translateMissing(locale: $locale, sources: $sources) {
      source
    }
  }
`;

interface BundleReply {
  localeBundle: { locale: string; translations: { source: string; text: string }[] };
}

interface CachedBundle {
  messages: Messages;
  at: number;
}

const cache = new Map<string, CachedBundle>();
/** Strings already sent for translation this process, so a busy page asks once. */
const reported = new Map<string, Set<string>>();

/**
 * One language's catalogue, from the portal.
 *
 * Fails soft, deliberately, and unlike every other portal read on this site: a page whose
 * translations did not arrive is the English it was written in, which is a cosmetic
 * degradation. A page whose CONTENT did not arrive would be a lie, which is why
 * `portalRequest` is left to throw everywhere else.
 */
export async function loadMessages(language: string): Promise<Messages> {
  const hit = cache.get(language);
  if (hit && Date.now() - hit.at < CACHE_MS) {
    return hit.messages;
  }
  try {
    const data = await portalRequest<BundleReply>(LOCALE_BUNDLE, { locale: language });
    const messages = Object.fromEntries(
      data.localeBundle.translations.map((entry) => [entry.source, entry.text])
    );
    cache.set(language, { messages, at: Date.now() });
    return messages;
  } catch (error) {
    console.error(`Translations for ${language} could not be loaded — serving English.`, error);
    cache.set(language, { messages: {}, at: Date.now() });
    return {};
  }
}

/**
 * Asks the portal to machine-translate strings this language has never seen.
 *
 * Fire and forget: the page being rendered has already fallen back to English, and the
 * answer is for whoever asks next. The portal skips anything already stored and never
 * overwrites a human correction, so calling this on every render is safe. It translates a
 * batch at a time, so a first visit to a long page fills the catalogue over a few requests
 * rather than in one very slow one.
 */
export function requestTranslations(language: string, sources: string[]): void {
  const seen = reported.get(language) ?? new Set<string>();
  reported.set(language, seen);
  const fresh = sources.filter((source) => !seen.has(source));
  if (fresh.length === 0) {
    return;
  }
  for (const source of fresh) {
    seen.add(source);
  }
  const batches: string[][] = [];
  for (let start = 0; start < fresh.length; start += BATCH) {
    batches.push(fresh.slice(start, start + BATCH));
  }
  // One after another rather than all at once: this is somebody's OpenAI bill, and the page
  // being rendered is not waiting for any of it.
  batches
    .reduce(
      (queue, batch) =>
        queue.then(() =>
          portalRequest(TRANSLATE_MISSING, { locale: language, sources: batch }).then(() => undefined)
        ),
      Promise.resolve()
    )
    .then(() => {
      // The catalogue has grown: drop both the catalogue and the pages rendered from it, so
      // the next reader gets the new words rather than the English they were cached with.
      // Enough on its own: a cached page remembers which catalogue it was translated with,
      // so the next reader re-renders against the new one.
      cache.delete(language);
    })
    .catch((error: unknown) => {
      console.error(`Could not ask the portal to translate ${fresh.length} strings.`, error);
    });
}
