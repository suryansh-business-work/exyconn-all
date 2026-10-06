import { createHash } from 'node:crypto';
import { openAiClient } from '../../utils/openai';
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
/** Texts sent to the embeddings endpoint per call. */
const EMBED_BATCH = 64;
/** Below this similarity a row is not about the question, unless its words say otherwise. */
const MIN_SIMILARITY = 0.25;
/** What one matching word is worth next to the similarity (0 to 1). */
const WORD_WEIGHT = 0.02;
const MAX_WORD_HITS = 10;

interface Entry {
  title: string;
  url: string;
  content: string;
  custom: boolean;
  haystack: string;
  vector: Float32Array;
}

/** A page the bot was given, numbered as the prompt shows it. */
export interface KnowledgeSource {
  title: string;
  url: string;
}

export interface Knowledge {
  /** The numbered blocks for the prompt. */
  text: string;
  /** sources[n - 1] is block [n]. */
  sources: KnowledgeSource[];
}

/** What reaching OpenAI needs: the key, and the embedding model from the chat's settings. */
export interface Embedder {
  apiKey: string;
  model: string;
}

let cache: { at: number; organization: string; model: string; entries: Entry[] } | null = null;

/** Forgets the cached knowledge, after a sync or an edit. */
export function forgetKnowledgeCache(): void {
  cache = null;
}

const hashOf = (title: string, content: string, model: string): string =>
  createHash('sha256').update(`${model}\n${title}\n${content}`).digest('hex');

const textOf = (row: { title: string; content: string }) => `${row.title}\n${row.content}`;

/**
 * Embeds every active row whose text changed since it was last embedded (or never was), a
 * batch at a time. A sync files a few hundred rows; each is embedded once, not per question.
 */
export async function embedStaleKnowledge(embedder: Embedder): Promise<number> {
  const rows = await ChatKnowledgeModel.find({ isActive: true })
    .select('title content +embeddedHash')
    .limit(5000)
    .lean();
  const stale = rows.filter(
    (row) => row.embeddedHash !== hashOf(row.title, row.content, embedder.model),
  );
  for (let start = 0; start < stale.length; start += EMBED_BATCH) {
    const batch = stale.slice(start, start + EMBED_BATCH);
    const vectors = await openAiClient.embed(embedder.apiKey, embedder.model, batch.map(textOf));
    await ChatKnowledgeModel.bulkWrite(
      batch.map((row, index) => ({
        updateOne: {
          filter: { _id: row._id },
          update: {
            embedding: vectors[index],
            embeddedHash: hashOf(row.title, row.content, embedder.model),
          },
        },
      })),
    );
  }
  if (stale.length > 0) {
    forgetKnowledgeCache();
  }
  return stale.length;
}

/** The active knowledge of the company in scope, with its vectors, read at most once a minute. */
async function entries(embedder: Embedder, organization: string): Promise<Entry[]> {
  const fresh =
    cache?.organization === organization &&
    cache.model === embedder.model &&
    Date.now() - cache.at < CACHE_TTL_MS;
  if (fresh && cache) {
    return cache.entries;
  }
  await embedStaleKnowledge(embedder);
  const rows = await ChatKnowledgeModel.find({ isActive: true })
    .select('title url content source +embedding')
    .limit(5000)
    .lean();
  const loaded = rows.map((row) => ({
    title: row.title,
    url: row.url,
    content: row.content,
    custom: row.source === 'CUSTOM',
    haystack: `${row.title} ${row.content}`.toLowerCase(),
    vector: Float32Array.from(row.embedding ?? []),
  }));
  cache = { at: Date.now(), organization, model: embedder.model, entries: loaded };
  return loaded;
}

const termsOf = (text: string): string[] =>
  [...new Set(text.toLowerCase().match(/[a-z\d]{3,}/g) ?? [])]
    .filter((term) => !STOP_WORDS.has(term))
    .slice(0, MAX_TERMS);

function wordHits(entry: Entry, terms: string[]): number {
  const title = entry.title.toLowerCase();
  const hits = terms.reduce(
    (sum, term) => sum + (entry.haystack.includes(term) ? 1 : 0) + (title.includes(term) ? 2 : 0),
    0,
  );
  return Math.min(hits, MAX_WORD_HITS);
}

function cosine(a: Float32Array, b: number[]): number {
  if (a.length === 0 || a.length !== b.length) {
    return 0;
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA === 0 || normB === 0 ? 0 : dot / Math.sqrt(normA * normB);
}

/** How much a row is about the question: meaning first, matching words as a tie-breaker. */
function scoreOf(entry: Entry, question: number[], terms: string[]): number {
  const similarity = cosine(entry.vector, question);
  const hits = wordHits(entry, terms);
  if (similarity < MIN_SIMILARITY && hits === 0) {
    return 0;
  }
  // Written by the team for the bot: preferred when it is about the question at all.
  const custom = entry.custom ? 0.05 : 0;
  return similarity + hits * WORD_WEIGHT + custom;
}

/**
 * The knowledge most about `question`, best first, up to `maxChars` of it — the bot's context
 * window — found by meaning (embeddings) and by matching words. Empty when nothing is close:
 * the bot then has nothing to answer from, and says so.
 */
export async function knowledgeFor(
  question: string,
  maxChars: number,
  organization: string,
  embedder: Embedder,
): Promise<Knowledge> {
  const [all, [vector]] = await Promise.all([
    entries(embedder, organization),
    openAiClient.embed(embedder.apiKey, embedder.model, [question]),
  ]);
  const terms = termsOf(question);
  const ranked = all
    .map((entry) => ({ entry, score: scoreOf(entry, vector, terms) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  const blocks: string[] = [];
  const sources: KnowledgeSource[] = [];
  let used = 0;
  for (const { entry } of ranked) {
    const source = entry.url ? ` (${entry.url})` : '';
    const block = `[${blocks.length + 1}] ${entry.title}${source}\n${entry.content}`;
    if (used + block.length > maxChars) {
      break;
    }
    blocks.push(block);
    sources.push({ title: entry.title, url: entry.url });
    used += block.length;
  }
  return { text: blocks.join('\n\n'), sources };
}
