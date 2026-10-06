import { Schema } from 'mongoose';

/** What the editor last saved: GrapesJS's project, and the HTML and CSS it produced. */
export const cmsDraftSchema = new Schema(
  {
    projectData: { type: Schema.Types.Mixed, default: null },
    html: { type: String, default: '' },
    css: { type: String, default: '' },
  },
  { _id: false, minimize: false },
);

/** What visitors see: the compiled block tree (@exyconn/cms CmsBlock[]) and its CSS. */
export const cmsPublishedSchema = new Schema(
  {
    blocks: { type: Schema.Types.Mixed, default: () => [] },
    css: { type: String, default: '' },
    publishedAt: { type: Date, required: true },
  },
  { _id: false, minimize: false },
);

/** DRAFT: never published. PUBLISHED: live and unchanged since. CHANGED: live, with newer edits. */
export const CMS_DOCUMENT_STATUSES = ['DRAFT', 'PUBLISHED', 'CHANGED'] as const;
