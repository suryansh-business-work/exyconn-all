import type { CmsBlock } from '@exyconn/cms';
import { Types } from 'mongoose';
import { publicPage, publicSite } from '../../../../src/modules/cms/cms.public';
import {
  CmsDesignSystemModel,
  CmsFragmentModel,
  CmsPageModel,
} from '../../../../src/modules/cms/models';
import { seedSite } from './cms.fixtures';

const ref = (fragmentId: string): CmsBlock => ({ kind: 'fragment', fragmentId });

async function publishedFragment(siteId: string, blocks: CmsBlock[] = [], css = '') {
  const row = await CmsFragmentModel.create({
    siteId,
    name: 'Fragment',
    published: { blocks, css, publishedAt: new Date() },
  });
  return row._id.toHexString();
}

describe('publicSite', () => {
  it('serves the site, its design system and its published chrome with what it places', async () => {
    const site = await seedSite('main', { isDefault: true });
    const siteId = site._id.toHexString();
    const nested = await publishedFragment(siteId, [{ kind: 'html', html: '<nav/>' }], 'nav{}');
    const header = await publishedFragment(siteId, [ref(nested)], 'header{}');
    const draftFooter = (
      await CmsFragmentModel.create({ siteId, name: 'Footer', kind: 'FOOTER' })
    )._id.toHexString();
    const design = await CmsDesignSystemModel.create({ siteId, name: 'Brand', tokens: {} });
    await site.updateOne({
      headerFragmentId: header,
      footerFragmentId: draftFooter,
      designSystemId: design._id.toHexString(),
    });

    const result = await publicSite('localhost');

    expect(result.site).toMatchObject({ id: siteId, slug: 'main' });
    expect(result.designSystem).toMatchObject({ id: design._id.toHexString(), name: 'Brand' });
    expect(result.fragments).toEqual([
      { id: header, blocks: [ref(nested)], css: 'header{}' },
      { id: nested, blocks: [{ kind: 'html', html: '<nav/>' }], css: 'nav{}' },
    ]);
  });

  it('serves a bare site with no design system or chrome', async () => {
    await seedSite('main', { isDefault: true });

    const result = await publicSite('');

    expect(result.designSystem).toBeNull();
    expect(result.fragments).toEqual([]);
  });

  it('reads a published fragment stored without blocks or CSS as empty', async () => {
    const site = await seedSite('main', { isDefault: true });
    const siteId = site._id.toHexString();
    const header = await publishedFragment(siteId);
    await CmsFragmentModel.collection.updateOne(
      { _id: new Types.ObjectId(header) },
      { $unset: { 'published.blocks': '', 'published.css': '' } },
    );
    await site.updateOne({ headerFragmentId: header });

    const result = await publicSite('localhost');

    expect(result.fragments).toEqual([{ id: header, blocks: [], css: '' }]);
  });
});

describe('fragments a page places', () => {
  const livePage = (siteId: string, blocks: CmsBlock[]) =>
    CmsPageModel.create({
      siteId,
      path: '/',
      title: 'Home',
      published: { blocks, css: '', publishedAt: new Date() },
    });

  it('follows fragments inside fragments four levels deep, and no further', async () => {
    const siteId = 'site-1';
    const fifth = await publishedFragment(siteId);
    const fourth = await publishedFragment(siteId, [ref(fifth)]);
    const third = await publishedFragment(siteId, [ref(fourth)]);
    const second = await publishedFragment(siteId, [ref(third)]);
    const first = await publishedFragment(siteId, [ref(second)]);
    await livePage(siteId, [ref(first)]);

    const result = await publicPage(siteId, '/');

    expect(result?.fragments.map((fragment) => fragment.id)).toEqual([
      first,
      second,
      third,
      fourth,
    ]);
  });

  it('reads a placed fragment stored without blocks or CSS as empty', async () => {
    const siteId = 'site-1';
    const placed = await publishedFragment(siteId);
    await CmsFragmentModel.collection.updateOne(
      { _id: new Types.ObjectId(placed) },
      { $unset: { 'published.blocks': '', 'published.css': '' } },
    );
    await livePage(siteId, [ref(placed)]);

    const result = await publicPage(siteId, '/');

    expect(result?.fragments).toEqual([{ id: placed, blocks: [], css: '' }]);
  });

  it('stops at a fragment cycle and skips ids that are not ids or not published', async () => {
    const siteId = 'site-1';
    const draft = (await CmsFragmentModel.create({ siteId, name: 'Draft' }))._id.toHexString();
    const b = await publishedFragment(siteId);
    const a = await publishedFragment(siteId, [ref(b), ref('seed:header'), ref(draft)]);
    await CmsFragmentModel.updateOne({ _id: b }, { 'published.blocks': [ref(a)] });
    const foreign = await publishedFragment('site-2');
    await livePage(siteId, [ref(a), ref(foreign)]);

    const result = await publicPage(siteId, '/');

    expect(result?.fragments.map((fragment) => fragment.id)).toEqual([a, b]);
  });
});
