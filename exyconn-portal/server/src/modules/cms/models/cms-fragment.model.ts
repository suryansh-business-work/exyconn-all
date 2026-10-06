import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { CMS_DOCUMENT_STATUSES, cmsDraftSchema, cmsPublishedSchema } from './cms-document.schema';

export const CMS_FRAGMENT_KINDS = ['HEADER', 'FOOTER', 'SECTION', 'SNIPPET'] as const;

/**
 * A reusable piece of a site — its header, its footer, a section used on many pages — edited
 * like a page and placed into pages with <exy-fragment>. Publishing it updates every page that
 * uses it.
 */
const cmsFragmentSchema = new Schema(
  {
    siteId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    kind: { type: String, enum: CMS_FRAGMENT_KINDS, required: true, default: 'SECTION' },
    draft: { type: cmsDraftSchema, required: true, default: () => ({}) },
    published: { type: cmsPublishedSchema, default: null },
    status: { type: String, enum: CMS_DOCUMENT_STATUSES, required: true, default: 'DRAFT' },
    seedKey: { type: String, default: '' },
    updatedByName: { type: String, default: '' },
  },
  { timestamps: true, minimize: false },
);

export type CmsFragmentDocument = InferSchemaType<typeof cmsFragmentSchema>;

export const CmsFragmentModel: Model<CmsFragmentDocument> = model<CmsFragmentDocument>(
  'CmsFragment',
  cmsFragmentSchema,
);
