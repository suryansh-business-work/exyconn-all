import { ChatKnowledgeModel } from './models';

/** Words that say nothing about what a question is after. */
const STOP_WORDS: ReadonlySet<string> = new Set([
  'the',
  'and',
  'for',
  'are',
  'but',
  'not',
  'you',
  'your',
  'with',
  'have',
  'has',
  'can',
  'what',
  'how',
  'who',
  'why',
  'when',
  'where',
  'which',
  'this',
  'that',
  'from',
  'about',
  'does',
  'did',
  'was',
  'were',
  'will',
  'would',
  'could',
  'should',
  'there',
  'their',
  'they',
  'them',
  'any',
  'all',
  'our',
  'out',
  'get',
  'tell',
  'please',
  'want',
  'need',
  'like',
  'know',
  'more',
  'some',
]);
const MAX_TERMS = 24;
const CACHE_TTL_MS = 60_000;

interface Entry {
  title: string;
  url: string;
  content: string;
  custom: boolean;
  haystack: string;
}

let cache: { at: number; organization: string; entries: Entry[] } | null = null;

const termsOf = (text: string): string[] =>
  [...new Set(text.toLowerCase().match(/[a-z\d]{3,}/g) ?? [])]
    .filter((term) => !STOP_WORDS.has(term))
    .slice(0, MAX_TERMS);

/** The active knowledge of the company in scope, read at most once a minute. */
async function entries(organization: string): Promise<Entry[]> {
  if (cache && cache.organization === organization && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.entries;
  }
  const rows = await ChatKnowledgeModel.find({ isActive: true })
    .select('title url content source')
    .limit(5000)
    .lean();
  const loaded = rows.map((row) => ({
    title: row.title,
    url: row.url,
    content: row.content,
    custom: row.source === 'CUSTOM',
    haystack: `${row.title} ${row.content}`.toLowerCase(),
  }));
  cache = { at: Date.now(), organization, entries: loaded };
  return loaded;
}

/** Forgets the cached knowledge, after a sync or an edit. */
export function forgetKnowledgeCache(): void {
  cache = null;
}

function occurrences(haystack: string, term: string): number {
  let count = 0;
  for (
    let at = haystack.indexOf(term);
    at !== -1 && count < 5;
    at = haystack.indexOf(term, at + 1)
  ) {
    count += 1;
  }
  return count;
}

function scoreOf(entry: Entry, terms: string[]): number {
  const title = entry.title.toLowerCase();
  const hits = terms.reduce(
    (sum, term) => sum + occurrences(entry.haystack, term) + (title.includes(term) ? 3 : 0),
    0,
  );
  // Written by the team for the bot: preferred when it is about the question at all.
  return hits > 0 && entry.custom ? hits + 2 : hits;
}

/**
 * The knowledge most about `question`, best first, up to `maxChars` of it — the bot's context
 * window. Empty when nothing matches: the bot then has nothing to answer from, and says so.
 */
export async function knowledgeFor(
  question: string,
  maxChars: number,
  organization: string,
): Promise<string> {
  const terms = termsOf(question);
  if (terms.length === 0) {
    return '';
  }
  const ranked = (await entries(organization))
    .map((entry) => ({ entry, score: scoreOf(entry, terms) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  const blocks: string[] = [];
  let used = 0;
  for (const { entry } of ranked) {
    const source = entry.url ? ` (${entry.url})` : '';
    const block = `[${blocks.length + 1}] ${entry.title}${source}\n${entry.content}`;
    if (used + block.length > maxChars) {
      break;
    }
    blocks.push(block);
    used += block.length;
  }
  return blocks.join('\n\n');
}
