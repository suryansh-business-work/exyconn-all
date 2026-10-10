import { Types } from 'mongoose';
import { cmsPages } from '../../../../src/modules/cms/cms.pages';
import { CmsPageModel, CmsPageRevisionModel } from '../../../../src/modules/cms/models';
import { KNOWN_COMPONENT, componentHtml } from './cms.fixtures';

const SITE = 'site-1';
const EDITOR = 'Asha';
const missingId = () => new Types.ObjectId().toHexString();

const newPage = async (path = '/about-us') =>
  (
    await cmsPages.create(SITE, { path, title: 'About', kind: 'PAGE', layout: 'default' }, EDITOR)
  )._id.toHexString();

describe('drafts and publishing', () => {
  it('keeps a draft, publishes it as a revision and marks later edits CHANGED', async () => {
    const id = await newPage();
    const html = componentHtml(KNOWN_COMPONENT);

    const draft = await cmsPages.saveDraft(id, { html, css: 'a{}' }, EDITOR);
    expect(draft).toMatchObject({ status: 'DRAFT', draft: { projectData: null, html } });

    const published = await cmsPages.publish(id, 'Ravi');
    expect(published).toMatchObject({
      status: 'PUBLISHED',
      updatedByName: 'Ravi',
      published: {
        blocks: [{ kind: 'component', key: KNOWN_COMPONENT, props: {}, children: [] }],
        css: 'a{}',
      },
    });
    await cmsPages.publish(id, EDITOR);

    const revisions = await cmsPages.revisions(id);
    expect(revisions.map((revision) => revision.version)).toEqual([2, 1]);
    expect(revisions[0]).toMatchObject({ title: 'About', publishedByName: EDITOR });
    expect(revisions[0]).not.toHaveProperty('draft');

    const edited = await cmsPages.saveDraft(
      id,
      { projectData: { a: 1 }, html: '<p/>', css: '' },
      EDITOR,
    );
    expect(edited).toMatchObject({ status: 'CHANGED', draft: { projectData: { a: 1 } } });
  });

  it('refuses an oversized draft and a draft that does not compile', async () => {
    const id = await newPage();

    await expect(
      cmsPages.saveDraft(id, { html: '', css: 'a'.repeat(1_000_001) }, EDITOR),
    ).rejects.toThrow('This page is too large to save.');
    await cmsPages.saveDraft(id, { html: componentHtml('nope.missing'), css: '' }, EDITOR);
    await expect(cmsPages.publish(id, EDITOR)).rejects.toThrow('Unknown component: nope.missing.');
    await expect(CmsPageRevisionModel.countDocuments()).resolves.toBe(0);
  });

  it('takes a page off the site, keeping its draft', async () => {
    const id = await newPage();
    await cmsPages.saveDraft(id, { html: '<p>Hi</p>', css: '' }, EDITOR);
    await cmsPages.publish(id, EDITOR);

    const page = await cmsPages.unpublish(id, 'Ravi');

    expect(page).toMatchObject({
      published: null,
      status: 'DRAFT',
      updatedByName: 'Ravi',
      draft: { html: '<p>Hi</p>' },
    });
  });

  it('says when the page does not exist', async () => {
    const draft = { html: '', css: '' };

    await expect(cmsPages.get(missingId())).rejects.toThrow('Page not found');
    await expect(cmsPages.saveDraft(missingId(), draft, EDITOR)).rejects.toThrow('Page not found');
    await expect(cmsPages.publish(missingId(), EDITOR)).rejects.toThrow('Page not found');
    await expect(cmsPages.unpublish(missingId(), EDITOR)).rejects.toThrow('Page not found');
    await expect(cmsPages.remove(missingId())).rejects.toThrow('Page not found');
  });
});

describe('duplicate, remove and restore', () => {
  it('copies a page and its draft to a new path', async () => {
    const id = await newPage();
    await cmsPages.saveDraft(id, { html: '<p>Hi</p>', css: 'p{}' }, EDITOR);

    const copy = await cmsPages.duplicate(id, '/about-copy', 'Ravi');

    expect(copy).toMatchObject({
      siteId: SITE,
      path: '/about-copy',
      title: 'About (copy)',
      status: 'DRAFT',
      published: null,
      updatedByName: 'Ravi',
      draft: { html: '<p>Hi</p>', css: 'p{}' },
    });
  });

  it('refuses a copy onto a path in use', async () => {
    const id = await newPage();

    await expect(cmsPages.duplicate(id, '/about-us', EDITOR)).rejects.toThrow(
      'Another page already lives at /about-us.',
    );
    await expect(cmsPages.duplicate(missingId(), '/x', EDITOR)).rejects.toThrow('Page not found');
  });

  it('removes a page with its revisions', async () => {
    const id = await newPage();
    await cmsPages.publish(id, EDITOR);

    await expect(cmsPages.remove(id)).resolves.toBe(true);
    await expect(CmsPageModel.countDocuments()).resolves.toBe(0);
    await expect(CmsPageRevisionModel.countDocuments()).resolves.toBe(0);
  });

  it('restores a published version into the draft without publishing it', async () => {
    const id = await newPage();
    await cmsPages.saveDraft(id, { projectData: { v: 1 }, html: '<p>One</p>', css: 'a{}' }, EDITOR);
    await cmsPages.publish(id, EDITOR);
    await cmsPages.saveDraft(id, { html: '<p>Two</p>', css: '' }, EDITOR);
    const [revision] = await cmsPages.revisions(id);

    const restored = await cmsPages.restoreRevision(String(revision._id), 'Ravi');

    expect(restored).toMatchObject({
      status: 'CHANGED',
      updatedByName: 'Ravi',
      draft: { projectData: { v: 1 }, html: '<p>One</p>', css: 'a{}' },
      published: { blocks: [{ kind: 'html', html: '<p>One</p>' }] },
    });
  });

  it('says when the revision does not exist', async () => {
    await expect(cmsPages.restoreRevision(missingId(), EDITOR)).rejects.toThrow(
      'Revision not found',
    );
  });
});
