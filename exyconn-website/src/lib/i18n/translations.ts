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
      text
    }
  }
`;

interface BundleReply {
  localeBundle: { locale: string; translations: { source: string; text: string }[] };
}

interface MissingReply {
  translateMissing: { source: string; text: string }[];
}

interface CachedBundle {
  messages: Messages;
  at: number;
}

const cache = new Map<string, CachedBundle>();
/** Strings on their way to the portal right now, so two readers of one page ask once. */
const pending = new Map<string, Set<string>>();

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

/** Batches sent to the portal at once: the same total work, finished sooner. */
const CONCURRENCY = 4;

/**
 * Asks the portal to machine-translate strings this language has never seen, and answers with
 * the whole catalogue as it stands once they are in — or once `budgetMs` runs out, whichever
 * comes first.
 *
 * The first reader of a page in a new language is the one this is for: rather than serving
 * them English and translating for whoever comes next, the page waits a few seconds for the
 * model and comes back in their language. Batches still running when the budget ends carry on
 * and land in the catalogue for the next reader.
 *
 * A string is only counted as asked once the portal has actually translated it. One that came
 * back untranslated — the model failed, or this caller was over its budget — is asked again
 * on a later render, instead of staying English until the site restarts.
 */
export async function translateMissing(
  language: string,
  sources: string[],
  budgetMs: number
): Promise<Messages> {
  const inFlight = pending.get(language) ?? new Set<string>();
  pending.set(language, inFlight);
  const fresh = [...new Set(sources)].filter((source) => !inFlight.has(source));
  for (const source of fresh) {
    inFlight.add(source);
  }

  const batches: string[][] = [];
  for (let start = 0; start < fresh.length; start += BATCH) {
    batches.push(fresh.slice(start, start + BATCH));
  }

  const all = runBatches(language, batches, inFlight);
  const deadline = new Promise<void>((resolve) => setTimeout(resolve, budgetMs));
  await Promise.race([all, deadline]);
  return catalogue(language);
}

/** Every batch, CONCURRENCY at a time, each merged into the catalogue as it lands. */
async function runBatches(language: string, batches: string[][], inFlight: Set<string>) {
  let next = 0;
  const worker = async () => {
    while (next < batches.length) {
      const batch = batches[next];
      next += 1;
      await sendBatch(language, batch, inFlight);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, batches.length) }, worker));
}

async function sendBatch(language: string, batch: string[], inFlight: Set<string>) {
  try {
    const data = await portalRequest<MissingReply>(TRANSLATE_MISSING, {
      locale: language,
      sources: batch,
    });
    const arrived = data.translateMissing;
    if (arrived.length > 0) {
      // A NEW object, never a mutation: a cached page remembers the catalogue it was
      // translated with, and a different object is how it knows to re-render.
      const current = cache.get(language)?.messages ?? {};
      const merged = { ...current, ...Object.fromEntries(arrived.map((e) => [e.source, e.text])) };
      cache.set(language, { messages: merged, at: cache.get(language)?.at ?? Date.now() });
    }
  } catch (error) {
    console.error(`Could not ask the portal to translate ${batch.length} strings.`, error);
  } finally {
    // Whatever did not come back is askable again next time.
    for (const source of batch) {
      inFlight.delete(source);
    }
  }
}

/** The catalogue as it stands right now, without asking the portal. */
function catalogue(language: string): Messages {
  return cache.get(language)?.messages ?? {};
}
