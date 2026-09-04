import { DocPageModel } from './docs.model';
import { notFound } from '../../utils/errors';
import type { Actor } from './board.service';

/** Ids of a page and everything filed under it, however deep. */
async function subtreeIds(rootId: string): Promise<string[]> {
  const ids = [rootId];
  let frontier = [rootId];
  while (frontier.length > 0) {
    const children = await DocPageModel.find({ parentId: { $in: frontier } })
      .select('_id')
      .lean();
    frontier = children.map((child) => child._id.toString());
    ids.push(...frontier);
  }
  return ids;
}

/** Rewrites `order` across one parent's children, optionally forcing one to an index. */
async function renumber(
  projectId: string,
  parentId: string | null,
  pinId?: string,
  pinIndex?: number,
) {
  const siblings = await DocPageModel.find({ projectId, parentId })
    .sort({ order: 1 })
    .select('_id')
    .lean();
  let ids = siblings.map((page) => page._id.toString());
  if (pinId && pinIndex !== undefined) {
    ids = ids.filter((id) => id !== pinId);
    ids.splice(Math.max(0, Math.min(pinIndex, ids.length)), 0, pinId);
  }
  await Promise.all(ids.map((id, order) => DocPageModel.updateOne({ _id: id }, { order }).exec()));
}

/** Domain logic for a project's documentation space. */
export const docsService = {
  pages(projectId: string) {
    return DocPageModel.find({ projectId }).sort({ order: 1 }).lean();
  },

  async page(id: string) {
    const doc = await DocPageModel.findById(id).lean();
    if (!doc) notFound('DocPage');
    return doc;
  },

  /** A new page starts empty and lands at the end of its parent's children. */
  async createPage(projectId: string, parentId: string | null, title: string) {
    const order = await DocPageModel.countDocuments({ projectId, parentId });
    return (await DocPageModel.create({ projectId, parentId, title, order })).toObject();
  },

  async updatePage(id: string, patch: { title?: string; body?: string }, editor: Actor) {
    const fields: Record<string, unknown> = {
      updatedById: editor.id,
      updatedByName: editor.name,
    };
    if (patch.title !== undefined) fields.title = patch.title;
    if (patch.body !== undefined) fields.body = patch.body;

    const doc = await DocPageModel.findByIdAndUpdate(id, fields, { new: true }).lean();
    if (!doc) notFound('DocPage');
    return doc;
  },

  /** Deletes the page and its whole subtree — a page without its parent has nowhere to live. */
  async deletePage(id: string) {
    const page = await DocPageModel.findById(id).select('_id').lean();
    if (!page) notFound('DocPage');
    await DocPageModel.deleteMany({ _id: { $in: await subtreeIds(id) } });
    return true;
  },

  async movePage(id: string, parentId: string | null, toIndex: number) {
    const page = await DocPageModel.findById(id);
    if (!page) notFound('DocPage');
    const projectId = page.projectId.toString();
    const fromParent = page.parentId?.toString() ?? null;

    page.parentId = parentId as never;
    await page.save();

    if (fromParent !== parentId) await renumber(projectId, fromParent);
    await renumber(projectId, parentId, id, toIndex);
    return true;
  },
};
