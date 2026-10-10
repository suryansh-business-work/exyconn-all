import { cmsResolvers } from '../../../../src/modules/cms';
import { imageUploader } from '../../../../src/utils/imagekit';
import { EDITOR_EMAIL, editorCtx, seedSite } from './cms.fixtures';

jest.mock('../../../../src/utils/imagekit', () => ({
  imageUploader: { uploadImage: jest.fn(), uploadFont: jest.fn() },
}));

const { Query, Mutation } = cmsResolvers;
const SITE = 'site-1';

/** The id every resolver hands back alongside the document. */
const idOf = (doc: unknown) => (doc as { id: string }).id;

describe('fragments for the website team', () => {
  it('runs a fragment from creation through publishing to deletion', async () => {
    const ctx = editorCtx();

    const created = await Mutation.createCmsFragment(
      null,
      { siteId: SITE, input: { name: 'Header', kind: 'HEADER' } },
      ctx,
    );
    const id = idOf(created);
    expect(created).toMatchObject({ name: 'Header', updatedByName: EDITOR_EMAIL });

    await expect(
      Mutation.updateCmsFragment(null, { id, input: { name: 'Top', kind: 'HEADER' } }, ctx),
    ).resolves.toMatchObject({ id, name: 'Top' });
    await expect(
      Mutation.saveCmsFragmentDraft(null, { id, draft: { html: '<nav/>', css: '' } }, ctx),
    ).resolves.toMatchObject({ id, status: 'DRAFT' });
    await expect(Mutation.publishCmsFragment(null, { id }, ctx)).resolves.toMatchObject({
      id,
      status: 'PUBLISHED',
    });

    const listed = await Query.cmsFragments(null, { siteId: SITE }, ctx);
    expect(listed.map((fragment) => fragment.id)).toEqual([id]);
    await expect(Query.cmsFragment(null, { id }, ctx)).resolves.toMatchObject({ id });

    await expect(Mutation.deleteCmsFragment(null, { id }, ctx)).resolves.toBe(true);
    await expect(Query.cmsFragment(null, { id }, ctx)).rejects.toThrow('Fragment not found');
  });
});

describe('media for the website team', () => {
  it('uploads, lists, describes and deletes an image', async () => {
    const ctx = editorCtx();
    const site = await seedSite('main');
    const siteId = site._id.toHexString();
    jest.mocked(imageUploader.uploadImage).mockResolvedValueOnce('https://ik.test/a.png');

    const uploaded = await Mutation.uploadCmsAsset(
      null,
      { input: { siteId, file: 'data:image/png;base64,AAAA', fileName: 'a.png' } },
      ctx,
    );
    const id = idOf(uploaded);
    expect(uploaded).toMatchObject({ url: 'https://ik.test/a.png', name: 'a.png' });

    const listed = await Query.cmsAssets(null, { siteId, page: 0, pageSize: 10 }, ctx);
    expect(listed.totalCount).toBe(1);

    await expect(
      Mutation.updateCmsAssetAlt(null, { id, alt: ' Logo ' }, ctx),
    ).resolves.toMatchObject({ id, alt: 'Logo' });
    await expect(Mutation.deleteCmsAsset(null, { id }, ctx)).resolves.toBe(true);
  });

  it('refuses somebody who is not signed in before uploading anything', async () => {
    await expect(
      Mutation.uploadCmsAsset(
        null,
        { input: { siteId: SITE, file: 'data:image/png;base64,AAAA', fileName: 'a.png' } },
        { user: null },
      ),
    ).rejects.toThrow('Authentication required');
    expect(imageUploader.uploadImage).not.toHaveBeenCalled();
  });
});
