import { Types } from 'mongoose';
import { cmsResolvers } from '../../../../src/modules/cms';
import { cmsPages } from '../../../../src/modules/cms/cms.pages';
import { previewPageId } from '../../../../src/modules/cms/cms.preview';
import { EDITOR_EMAIL, editorCtx } from './cms.fixtures';

const { Query, Mutation } = cmsResolvers;
const SITE = 'site-1';

const settings = {
  path: '/about-us',
  title: 'About',
  kind: 'PAGE' as const,
  layout: 'default' as const,
};

/** The id every resolver hands back alongside the document. */
const idOf = (doc: unknown) => (doc as { id: string }).id;

describe('pages for the website team', () => {
  it('runs a page from creation through publishing to deletion', async () => {
    const ctx = editorCtx();

    const created = await Mutation.createCmsPage(null, { siteId: SITE, input: settings }, ctx);
    const id = idOf(created);
    expect(created).toMatchObject({ path: '/about-us', updatedByName: EDITOR_EMAIL });

    await expect(
      Mutation.updateCmsPageSettings(null, { id, input: { ...settings, title: 'About us' } }, ctx),
    ).resolves.toMatchObject({ id, title: 'About us' });
    await expect(
      Mutation.saveCmsPageDraft(null, { id, draft: { html: '<p>Hi</p>', css: '' } }, ctx),
    ).resolves.toMatchObject({ id, status: 'DRAFT' });
    await expect(Mutation.publishCmsPage(null, { id }, ctx)).resolves.toMatchObject({
      status: 'PUBLISHED',
    });

    const revisions = await Query.cmsPageRevisions(null, { pageId: id }, ctx);
    expect(revisions).toEqual([expect.objectContaining({ version: 1, id: expect.any(String) })]);
    await expect(
      Mutation.restoreCmsPageRevision(null, { revisionId: idOf(revisions[0]) }, ctx),
    ).resolves.toMatchObject({ id, status: 'CHANGED' });
    await expect(Mutation.unpublishCmsPage(null, { id }, ctx)).resolves.toMatchObject({
      status: 'DRAFT',
      published: null,
    });

    const copy = await Mutation.duplicateCmsPage(null, { id, path: '/about-copy' }, ctx);
    expect(copy).toMatchObject({ path: '/about-copy', title: 'About us (copy)' });

    const listed = await Query.cmsPages(
      null,
      { siteId: SITE, input: { page: 0, pageSize: 10 } },
      ctx,
    );
    expect(listed.totalCount).toBe(2);
    await expect(Query.cmsPage(null, { id }, ctx)).resolves.toMatchObject({ id });

    await expect(Mutation.deleteCmsPage(null, { id }, ctx)).resolves.toBe(true);
    await expect(Query.cmsPage(null, { id }, ctx)).rejects.toThrow('Page not found');
  });

  it('signs a preview link for a page that exists, and only for one', async () => {
    const ctx = editorCtx();
    const created = await Mutation.createCmsPage(null, { siteId: SITE, input: settings }, ctx);

    const token = await Query.cmsPreviewToken(null, { pageId: idOf(created) }, ctx);

    expect(previewPageId(token)).toBe(idOf(created));
    await expect(
      Query.cmsPreviewToken(null, { pageId: String(new Types.ObjectId()) }, ctx),
    ).rejects.toThrow('Page not found');
  });

  it('hands back nothing when the page vanished while it was being changed', async () => {
    jest.spyOn(cmsPages, 'unpublish').mockResolvedValueOnce(null);

    await expect(
      Mutation.unpublishCmsPage(null, { id: String(new Types.ObjectId()) }, editorCtx()),
    ).resolves.toBeNull();
  });

  it('refuses somebody who is not signed in before touching the page', async () => {
    await expect(
      Mutation.createCmsPage(null, { siteId: SITE, input: settings }, { user: null }),
    ).rejects.toThrow('Authentication required');
    await expect(
      Query.cmsPages(null, { siteId: SITE, input: { page: 0, pageSize: 10 } }, { user: null }),
    ).rejects.toThrow('Authentication required');
  });
});
