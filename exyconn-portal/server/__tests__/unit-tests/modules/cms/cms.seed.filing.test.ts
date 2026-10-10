import { ensureCmsDefaults } from '../../../../src/modules/cms';
import { BlogPostModel } from '../../../../src/modules/website/models/blog.model';
import { NavLinkModel } from '../../../../src/modules/website/models/nav-link.model';
import { seedSite } from './cms.fixtures';

jest.mock('../../../../src/modules/cms/seed/exyconn', () =>
  jest.requireActual('./cms.seed.fixture'),
);

describe('filing older website records under the default site', () => {
  it('assigns records without a site to the default site, once', async () => {
    const home = await seedSite('home', { isDefault: true });
    await BlogPostModel.collection.insertOne({ title: 'Old post', siteId: '' });
    await NavLinkModel.collection.insertOne({ label: 'Old link' });
    await BlogPostModel.collection.insertOne({ title: 'Elsewhere', siteId: 'other' });

    await ensureCmsDefaults();

    const posts = await BlogPostModel.collection.find().sort({ title: 1 }).toArray();
    expect(posts.map((post) => post.siteId)).toEqual(['other', home._id.toHexString()]);
    await expect(NavLinkModel.collection.findOne({ label: 'Old link' })).resolves.toMatchObject({
      siteId: home._id.toHexString(),
    });

    await BlogPostModel.collection.insertOne({ title: 'Later post', siteId: '' });
    await ensureCmsDefaults();
    await expect(BlogPostModel.collection.findOne({ title: 'Later post' })).resolves.toMatchObject({
      siteId: '',
    });
  });

  it('leaves records alone when there is no default site', async () => {
    await seedSite('seeded');
    await BlogPostModel.collection.insertOne({ title: 'Old post', siteId: '' });

    await ensureCmsDefaults();

    await expect(BlogPostModel.collection.findOne({ title: 'Old post' })).resolves.toMatchObject({
      siteId: '',
    });
  });
});
