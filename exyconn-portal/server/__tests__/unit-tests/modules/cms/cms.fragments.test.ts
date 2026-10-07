import { Types } from 'mongoose';
import { cmsFragments } from '../../../../src/modules/cms/cms.fragments';
import { CmsFragmentModel, CmsPageModel } from '../../../../src/modules/cms/models';
import { KNOWN_COMPONENT, componentHtml, fragmentHtml, seedSite } from './cms.fixtures';

const SITE = 'site-1';
const EDITOR = 'Asha';
const missingId = () => String(new Types.ObjectId());

const newFragment = async (name = 'Header', kind: 'HEADER' | 'FOOTER' | 'SECTION' = 'HEADER') =>
  String((await cmsFragments.create(SITE, { name, kind }, EDITOR))._id);

describe('fragment settings', () => {
  it('creates a fragment with a trimmed name and who made it', async () => {
    const fragment = await cmsFragments.create(SITE, { name: '  Hero ', kind: 'SECTION' }, EDITOR);

    expect(fragment).toMatchObject({
      siteId: SITE,
      name: 'Hero',
      kind: 'SECTION',
      status: 'DRAFT',
      updatedByName: EDITOR,
    });
  });

  it('refuses a fragment without a name', async () => {
    await expect(
      cmsFragments.create(SITE, { name: '   ', kind: 'SNIPPET' }, EDITOR),
    ).rejects.toThrow('Give the fragment a name.');
  });

  it('lists a site fragments by kind then name, without their documents', async () => {
    await newFragment('Main header', 'HEADER');
    await newFragment('Zeta', 'SECTION');
    await newFragment('Alpha', 'SECTION');
    await newFragment('Footer', 'FOOTER');
    await cmsFragments.create('site-2', { name: 'Other', kind: 'HEADER' }, EDITOR);

    const rows = await cmsFragments.list(SITE);

    expect(rows.map((row) => row.name)).toEqual(['Footer', 'Main header', 'Alpha', 'Zeta']);
    expect(rows[0]).not.toHaveProperty('draft');
  });

  it('renames a fragment and changes its kind', async () => {
    const id = await newFragment();

    const updated = await cmsFragments.update(id, { name: ' Top bar ', kind: 'SNIPPET' }, 'Ravi');

    expect(updated).toMatchObject({ name: 'Top bar', kind: 'SNIPPET', updatedByName: 'Ravi' });
  });

  it('says when a fragment does not exist', async () => {
    await expect(cmsFragments.get(missingId())).rejects.toThrow('Fragment not found');
    await expect(
      cmsFragments.update(missingId(), { name: 'X', kind: 'HEADER' }, EDITOR),
    ).rejects.toThrow('Fragment not found');
  });
});

describe('fragment drafts and publishing', () => {
  it('keeps a draft as DRAFT until published, then marks later edits CHANGED', async () => {
    const id = await newFragment();
    const html = componentHtml(KNOWN_COMPONENT);

    const draft = await cmsFragments.saveDraft(id, { html, css: 'a{}' }, EDITOR);
    expect(draft).toMatchObject({
      status: 'DRAFT',
      draft: { projectData: null, html, css: 'a{}' },
    });

    const published = await cmsFragments.publish(id, 'Ravi');
    expect(published).toMatchObject({
      status: 'PUBLISHED',
      updatedByName: 'Ravi',
      published: {
        blocks: [{ kind: 'component', key: KNOWN_COMPONENT, props: {}, children: [] }],
        css: 'a{}',
        publishedAt: expect.any(Date),
      },
    });

    const edited = await cmsFragments.saveDraft(
      id,
      { projectData: { pages: [] }, html: '<p>New</p>', css: '' },
      EDITOR,
    );
    expect(edited).toMatchObject({ status: 'CHANGED', draft: { projectData: { pages: [] } } });
  });

  it('refuses an oversized draft and a fragment that contains itself', async () => {
    const id = await newFragment();

    await expect(
      cmsFragments.saveDraft(id, { html: 'a'.repeat(2_000_001), css: '' }, EDITOR),
    ).rejects.toThrow('This page is too large to save.');
    await cmsFragments.saveDraft(id, { html: fragmentHtml(id), css: '' }, EDITOR);
    await expect(cmsFragments.publish(id, EDITOR)).rejects.toThrow(
      'A fragment cannot contain itself.',
    );
  });
});

describe('cmsFragments.remove', () => {
  it('deletes a fragment nothing uses', async () => {
    const id = await newFragment();

    await expect(cmsFragments.remove(id)).resolves.toBe(true);
    await expect(CmsFragmentModel.countDocuments()).resolves.toBe(0);
  });

  it('refuses a fragment a site wears as its header or footer', async () => {
    const header = await newFragment('Header');
    const footer = await newFragment('Footer', 'FOOTER');
    await seedSite('main', { headerFragmentId: header, footerFragmentId: footer });
    const message = 'This fragment is in use. Remove it from the site settings and pages first.';

    await expect(cmsFragments.remove(header)).rejects.toThrow(message);
    await expect(cmsFragments.remove(footer)).rejects.toThrow(message);
  });

  it('refuses a fragment placed on a page of its site', async () => {
    const id = await newFragment('Hero', 'SECTION');
    await CmsPageModel.create({
      siteId: SITE,
      path: '/',
      title: 'Home',
      draft: { html: fragmentHtml(id), css: '' },
    });

    await expect(cmsFragments.remove(id)).rejects.toThrow('This fragment is in use.');
  });

  it('says when the fragment does not exist', async () => {
    await expect(cmsFragments.remove(missingId())).rejects.toThrow('Fragment not found');
  });
});
