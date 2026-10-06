import { badRequest, notFound } from '../../utils/errors';
import { CmsFragmentModel, CmsPageModel, CmsSiteModel } from './models';
import { assertDraft, compileDraft, statusAfterEdit, type CmsDraftInput } from './cms.documents';

export interface CmsFragmentInput {
  name: string;
  kind: 'HEADER' | 'FOOTER' | 'SECTION' | 'SNIPPET';
}

async function fragmentById(id: string) {
  const fragment = await CmsFragmentModel.findById(id).lean();
  if (!fragment) notFound('Fragment');
  return fragment;
}

function nameOf(input: CmsFragmentInput): string {
  const name = input.name.trim();
  if (name === '') {
    badRequest('Give the fragment a name.');
  }
  return name;
}

/** Reusable header, footer and section fragments: edited and published like pages. */
export const cmsFragments = {
  list: (siteId: string) =>
    CmsFragmentModel.find({ siteId })
      .select('siteId name kind status updatedByName updatedAt createdAt published.publishedAt')
      .sort({ kind: 1, name: 1 })
      .lean(),

  get: fragmentById,

  async create(siteId: string, input: CmsFragmentInput, editor: string) {
    const fragment = await CmsFragmentModel.create({
      siteId,
      name: nameOf(input),
      kind: input.kind,
      updatedByName: editor,
    });
    return fragment.toObject();
  },

  async update(id: string, input: CmsFragmentInput, editor: string) {
    await fragmentById(id);
    return CmsFragmentModel.findByIdAndUpdate(
      id,
      { name: nameOf(input), kind: input.kind, updatedByName: editor },
      { new: true },
    ).lean();
  },

  async saveDraft(id: string, draft: CmsDraftInput, editor: string) {
    assertDraft(draft);
    const current = await fragmentById(id);
    return CmsFragmentModel.findByIdAndUpdate(
      id,
      {
        draft: { projectData: draft.projectData ?? null, html: draft.html, css: draft.css },
        status: statusAfterEdit(current.published),
        updatedByName: editor,
      },
      { new: true },
    ).lean();
  },

  /** Puts the fragment live on every page that uses it. */
  async publish(id: string, editor: string) {
    const fragment = await fragmentById(id);
    const compiled = await compileDraft(fragment.draft, fragment.siteId, id);
    return CmsFragmentModel.findByIdAndUpdate(
      id,
      {
        published: { blocks: compiled.blocks, css: compiled.css, publishedAt: new Date() },
        status: 'PUBLISHED',
        updatedByName: editor,
      },
      { new: true },
    ).lean();
  },

  /** Refused while a site wears it as its header or footer, or a page places it. */
  async remove(id: string) {
    const fragment = await fragmentById(id);
    const asChrome = await CmsSiteModel.exists({
      $or: [{ headerFragmentId: id }, { footerFragmentId: id }],
    });
    const onPage = await CmsPageModel.exists({
      siteId: fragment.siteId,
      'draft.html': { $regex: `data-fragment-id="${id}"` },
    });
    if (asChrome || onPage) {
      badRequest('This fragment is in use. Remove it from the site settings and pages first.');
    }
    await CmsFragmentModel.deleteOne({ _id: id });
    return true;
  },
};
