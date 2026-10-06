import { badRequest, notFound } from '../../utils/errors';
import { withIds } from '../../utils/serialize';
import { escapeRegex } from '../../utils/tableQuery';
import { CmsPageModel, CmsPageRevisionModel } from './models';
import { assertDraft, compileDraft, statusAfterEdit, type CmsDraftInput } from './cms.documents';

export interface CmsPageSettingsInput {
  path: string;
  title: string;
  kind: 'PAGE' | 'TEMPLATE';
  layout: 'default' | 'bare';
  seo?: {
    title?: string | null;
    description?: string | null;
    keywords?: string | null;
    ogImageUrl?: string | null;
    canonical?: string | null;
    noindex?: boolean | null;
    jsonLd?: unknown;
  } | null;
}

/** What the pages list shows; the documents themselves are never loaded for a list. */
const LIST_FIELDS =
  'siteId path kind title layout status seo.noindex updatedByName updatedAt createdAt published.publishedAt';
const MAX_PAGE_SIZE = 200;

export interface CmsPageListInput {
  page: number;
  pageSize: number;
  search?: string | null;
  status?: string | null;
  kind?: string | null;
}

/** '/', or '/a/b-c' — lower-case segments, ':param' segments allowed in a template. */
const PATH =
  /^\/(?:[a-z\d][a-z\d._-]*|:[a-z][a-zA-Z\d]*)(?:\/(?:[a-z\d][a-z\d._-]*|:[a-z][a-zA-Z\d]*))*$/;

function settingsFields(input: CmsPageSettingsInput) {
  const path = input.path.trim().replace(/\/+$/, '') || '/';
  if (path !== '/' && !PATH.test(path)) {
    badRequest('Use a path like /about-us — lower-case letters, digits and dashes.');
  }
  const isPattern = path.includes('/:');
  if (input.kind === 'TEMPLATE' && !isPattern) {
    badRequest('A template needs a path with a parameter, like /blog/:slug.');
  }
  if (input.kind === 'PAGE' && isPattern) {
    badRequest('Only a template may have a parameter in its path.');
  }
  const title = input.title.trim();
  if (title === '') {
    badRequest('Give the page a title.');
  }
  return {
    path,
    title,
    kind: input.kind,
    layout: input.layout,
    seo: {
      title: (input.seo?.title ?? '').trim(),
      description: (input.seo?.description ?? '').trim(),
      keywords: (input.seo?.keywords ?? '').trim(),
      ogImageUrl: (input.seo?.ogImageUrl ?? '').trim(),
      canonical: (input.seo?.canonical ?? '').trim(),
      noindex: input.seo?.noindex ?? false,
      jsonLd: input.seo?.jsonLd ?? null,
    },
  };
}

async function assertPathFree(siteId: string, path: string, exceptId?: string): Promise<void> {
  const clash = await CmsPageModel.exists({
    siteId,
    path,
    ...(exceptId ? { _id: { $ne: exceptId } } : {}),
  });
  if (clash) {
    badRequest(`Another page already lives at ${path}.`);
  }
}

async function pageById(id: string) {
  const page = await CmsPageModel.findById(id).lean();
  if (!page) notFound('Page');
  return page;
}

export const cmsPages = {
  async paged(siteId: string, input: CmsPageListInput) {
    const filter: Record<string, unknown> = { siteId };
    const search = (input.search ?? '').trim().slice(0, 100);
    if (search) {
      const pattern = { $regex: escapeRegex(search), $options: 'i' };
      filter.$or = [{ title: pattern }, { path: pattern }];
    }
    if (input.status) filter.status = input.status;
    if (input.kind) filter.kind = input.kind;
    const pageSize = Math.min(Math.max(input.pageSize, 1), MAX_PAGE_SIZE);
    const [rows, totalCount] = await Promise.all([
      CmsPageModel.find(filter)
        .select(LIST_FIELDS)
        .sort({ path: 1 })
        .skip(Math.max(input.page, 0) * pageSize)
        .limit(pageSize)
        .lean(),
      CmsPageModel.countDocuments(filter),
    ]);
    return { rows: withIds(rows as Array<{ _id: unknown }>), totalCount };
  },

  get: pageById,

  async create(siteId: string, input: CmsPageSettingsInput, editor: string) {
    const fields = settingsFields(input);
    await assertPathFree(siteId, fields.path);
    const page = await CmsPageModel.create({ siteId, ...fields, updatedByName: editor });
    return page.toObject();
  },

  async updateSettings(id: string, input: CmsPageSettingsInput, editor: string) {
    const current = await pageById(id);
    const fields = settingsFields(input);
    await assertPathFree(current.siteId, fields.path, id);
    return CmsPageModel.findByIdAndUpdate(
      id,
      { ...fields, updatedByName: editor },
      { new: true },
    ).lean();
  },

  async saveDraft(id: string, draft: CmsDraftInput, editor: string) {
    assertDraft(draft);
    const current = await pageById(id);
    return CmsPageModel.findByIdAndUpdate(
      id,
      {
        draft: { projectData: draft.projectData ?? null, html: draft.html, css: draft.css },
        status: statusAfterEdit(current.published),
        updatedByName: editor,
      },
      { new: true },
    ).lean();
  },

  /** Puts the draft live and keeps it as a revision. */
  async publish(id: string, editor: string) {
    const page = await pageById(id);
    const compiled = await compileDraft(page.draft, page.siteId);
    const last = await CmsPageRevisionModel.findOne({ pageId: id }).sort({ version: -1 }).lean();
    await CmsPageRevisionModel.create({
      pageId: id,
      version: (last?.version ?? 0) + 1,
      title: page.title,
      draft: page.draft,
      publishedByName: editor,
    });
    return CmsPageModel.findByIdAndUpdate(
      id,
      {
        published: { blocks: compiled.blocks, css: compiled.css, publishedAt: new Date() },
        status: 'PUBLISHED',
        updatedByName: editor,
      },
      { new: true },
    ).lean();
  },

  /** Takes the page off the site; the draft is kept. */
  async unpublish(id: string, editor: string) {
    await pageById(id);
    return CmsPageModel.findByIdAndUpdate(
      id,
      { published: null, status: 'DRAFT', updatedByName: editor },
      { new: true },
    ).lean();
  },

  async duplicate(id: string, path: string, editor: string) {
    const source = await pageById(id);
    const fields = settingsFields({ ...source, path, title: `${source.title} (copy)` });
    await assertPathFree(source.siteId, fields.path);
    const copy = await CmsPageModel.create({
      siteId: source.siteId,
      ...fields,
      draft: source.draft,
      updatedByName: editor,
    });
    return copy.toObject();
  },

  async remove(id: string) {
    const result = await CmsPageModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) notFound('Page');
    await CmsPageRevisionModel.deleteMany({ pageId: id });
    return true;
  },

  revisions: (pageId: string) =>
    CmsPageRevisionModel.find({ pageId })
      .select('version title publishedByName createdAt')
      .sort({ version: -1 })
      .limit(100)
      .lean(),

  /** Copies a published version back into the draft; publishing it is a separate step. */
  async restoreRevision(revisionId: string, editor: string) {
    const revision = await CmsPageRevisionModel.findById(revisionId).lean();
    if (!revision) notFound('Revision');
    return cmsPages.saveDraft(
      revision.pageId,
      {
        projectData: revision.draft.projectData,
        html: revision.draft.html,
        css: revision.draft.css,
      },
      editor,
    );
  },
};
