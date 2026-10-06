import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { CMS_DOCUMENT_STATUSES, cmsDraftSchema, cmsPublishedSchema } from './cms-document.schema';

export const CMS_PAGE_KINDS = ['PAGE', 'TEMPLATE'] as const;
export const CMS_PAGE_LAYOUTS = ['default', 'bare'] as const;

/**
 * A page of a site at a path ('/', '/about-us'), or a TEMPLATE for a family of pages
 * ('/blog/:slug') whose components read the matching item. Edited as a GrapesJS document
 * (draft) and published as a compiled block tree; every publish keeps a revision.
 */
const cmsPageSchema = new Schema(
  {
    siteId: { type: String, required: true },
    path: { type: String, required: true, trim: true },
    kind: { type: String, enum: CMS_PAGE_KINDS, required: true, default: 'PAGE' },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    seo: {
      title: { type: String, default: '', trim: true },
      description: { type: String, default: '', trim: true },
      keywords: { type: String, default: '', trim: true },
      ogImageUrl: { type: String, default: '', trim: true },
      canonical: { type: String, default: '', trim: true },
      noindex: { type: Boolean, default: false },
      jsonLd: { type: Schema.Types.Mixed, default: null },
    },
    layout: { type: String, enum: CMS_PAGE_LAYOUTS, required: true, default: 'default' },
    draft: { type: cmsDraftSchema, required: true, default: () => ({}) },
    published: { type: cmsPublishedSchema, default: null },
    status: { type: String, enum: CMS_DOCUMENT_STATUSES, required: true, default: 'DRAFT' },
    /** The seed item this page came from, if any (see cms.seed.ts). */
    seedKey: { type: String, default: '' },
    updatedByName: { type: String, default: '' },
  },
  { timestamps: true, minimize: false },
);

cmsPageSchema.index({ siteId: 1, path: 1 }, { unique: true });

export type CmsPageDocument = InferSchemaType<typeof cmsPageSchema>;

export const CmsPageModel: Model<CmsPageDocument> = model<CmsPageDocument>(
  'CmsPage',
  cmsPageSchema,
);

/** One published version of a page, kept so an editor can look back and restore it. */
const cmsPageRevisionSchema = new Schema(
  {
    pageId: { type: String, required: true, index: true },
    version: { type: Number, required: true },
    title: { type: String, default: '' },
    draft: { type: cmsDraftSchema, required: true },
    publishedByName: { type: String, default: '' },
  },
  { timestamps: true, minimize: false },
);

cmsPageRevisionSchema.index({ pageId: 1, version: -1 });

export type CmsPageRevisionDocument = InferSchemaType<typeof cmsPageRevisionSchema>;

export const CmsPageRevisionModel: Model<CmsPageRevisionDocument> = model<CmsPageRevisionDocument>(
  'CmsPageRevision',
  cmsPageRevisionSchema,
);
