import { createHash } from 'node:crypto';
import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** Where a translation came from. A human edit is never overwritten by the machine. */
export const TRANSLATION_SOURCES = ['AUTO', 'HUMAN'] as const;
export type TranslationSource = (typeof TRANSLATION_SOURCES)[number];

/**
 * The key a source string is stored under.
 *
 * The English string IS the key — there is no invented `settings.save.button` vocabulary to
 * keep in sync with the screens — but a sentence makes a poor index entry, so rows are keyed
 * on its SHA-256 and carry the source text alongside for the admin's translation screen.
 */
export function translationKey(source: string): string {
  return createHash('sha256').update(source).digest('hex');
}

const translationSchema = new Schema(
  {
    /** Canonical BCP-47 tag, e.g. `hi`, `pt-BR`. */
    locale: { type: String, required: true, index: true },
    /** SHA-256 of `source` — see {@link translationKey}. */
    key: { type: String, required: true },
    /** The English string exactly as it appears in the UI. */
    source: { type: String, required: true },
    /** The translation shown in place of `source`. */
    text: { type: String, required: true },
    source_kind: { type: String, enum: TRANSLATION_SOURCES, required: true, default: 'AUTO' },
    /** Which model produced an AUTO row, for the admin deciding whether to trust it. */
    model: { type: String, default: '' },
  },
  { timestamps: true },
);

// One row per string per locale: the upsert that fills a miss races against every other tab
// rendering the same screen, and without this two of them would both insert.
translationSchema.index({ locale: 1, key: 1 }, { unique: true });

export type TranslationDocument = InferSchemaType<typeof translationSchema>;

export const TranslationModel: Model<TranslationDocument> = model<TranslationDocument>(
  'Translation',
  translationSchema,
);
