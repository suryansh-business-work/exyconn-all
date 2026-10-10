import { Types } from 'mongoose';
import { cmsAssets } from '../../../../src/modules/cms/cms.assets';
import { CmsAssetModel } from '../../../../src/modules/cms/models';
import { imageUploader } from '../../../../src/utils/imagekit';
import { seedSite } from './cms.fixtures';

jest.mock('../../../../src/utils/imagekit', () => ({
  imageUploader: { uploadImage: jest.fn(), uploadFont: jest.fn() },
}));

const uploader = jest.mocked(imageUploader);
const IMAGE_URL = 'https://ik.test/cms-main/logo.png';
const FONT_URL = 'https://ik.test/cms-main-fonts/brand.woff2';

beforeEach(() => {
  uploader.uploadImage.mockResolvedValue(IMAGE_URL);
  uploader.uploadFont.mockResolvedValue(FONT_URL);
});

const missingId = () => new Types.ObjectId().toHexString();

describe('cmsAssets.upload', () => {
  it('uploads an image into the site folder and records it', async () => {
    const site = await seedSite('main');
    const file = 'data:image/png;base64,AAAAAAAA';

    const asset = await cmsAssets.upload({
      siteId: site._id.toHexString(),
      file,
      fileName: ' logo.png ',
      alt: ' Logo ',
      width: 10,
    });

    expect(uploader.uploadImage).toHaveBeenCalledWith(file, ' logo.png ', 'cms-main');
    expect(uploader.uploadFont).not.toHaveBeenCalled();
    expect(asset).toMatchObject({
      url: IMAGE_URL,
      name: 'logo.png',
      mime: 'image/png',
      size: 6,
      width: 10,
      height: 0,
      alt: 'Logo',
    });
  });

  it('uploads a font by its MIME type into the fonts folder', async () => {
    const site = await seedSite('main');
    const file = 'data:font/woff2;base64,AAAA';

    const asset = await cmsAssets.upload({
      siteId: site._id.toHexString(),
      file,
      fileName: 'brand',
    });

    expect(uploader.uploadFont).toHaveBeenCalledWith(file, 'brand', 'cms-main-fonts');
    expect(asset).toMatchObject({ url: FONT_URL, mime: 'font/woff2', size: 3 });
  });

  it('recognises a font by its file name when the browser sent no font type', async () => {
    const site = await seedSite('main');
    const file = 'data:application/octet-stream;base64,AAAA';

    await cmsAssets.upload({ siteId: site._id.toHexString(), file, fileName: 'Brand.TTF' });

    expect(uploader.uploadFont).toHaveBeenCalledWith(file, 'Brand.TTF', 'cms-main-fonts');
    expect(uploader.uploadImage).not.toHaveBeenCalled();
  });

  it('names an unnamed file and leaves the type blank for something not a data URL', async () => {
    const site = await seedSite('main');

    const asset = await cmsAssets.upload({
      siteId: site._id.toHexString(),
      file: 'https://elsewhere.test/a.png',
      fileName: '   ',
      alt: null,
      width: null,
      height: null,
    });

    expect(asset).toMatchObject({ name: 'image', mime: '', size: 0, width: 0, alt: '' });
    expect(uploader.uploadImage).toHaveBeenCalledTimes(1);
  });

  it('refuses a site that does not exist without uploading anything', async () => {
    await expect(
      cmsAssets.upload({ siteId: missingId(), file: 'data:image/png;base64,AA', fileName: 'a' }),
    ).rejects.toThrow('Website not found');
    expect(uploader.uploadImage).not.toHaveBeenCalled();
  });
});

/** The URLs on a page of the library (the service returns its rows with ids only). */
const urlsOf = (page: { rows: unknown[] }) =>
  (page.rows as Array<{ url: string }>).map((row) => row.url);

describe('cmsAssets.paged', () => {
  const seedAssets = () =>
    CmsAssetModel.collection.insertMany([
      { siteId: 's1', url: 'u1', name: 'old.png', alt: 'Team photo', createdAt: new Date(1000) },
      { siteId: 's1', url: 'u2', name: 'axb.png', alt: '', createdAt: new Date(2000) },
      { siteId: 's1', url: 'u3', name: 'a.b.png', alt: '', createdAt: new Date(3000) },
      { siteId: 's2', url: 'u4', name: 'other.png', alt: '', createdAt: new Date(4000) },
    ]);

  it('lists a site newest first, with ids', async () => {
    await seedAssets();

    const page = await cmsAssets.paged('s1', 0, 10);

    expect(page.totalCount).toBe(3);
    expect(urlsOf(page)).toEqual(['u3', 'u2', 'u1']);
    expect(page.rows[0].id).toEqual(expect.any(String));
  });

  it('searches the name and alt text literally', async () => {
    await seedAssets();

    const byName = await cmsAssets.paged('s1', 0, 10, ' a.b ');
    const byAlt = await cmsAssets.paged('s1', 0, 10, 'team');

    expect(urlsOf(byName)).toEqual(['u3']);
    expect(urlsOf(byAlt)).toEqual(['u1']);
  });

  it('keeps the page and its size within bounds', async () => {
    await seedAssets();

    const first = await cmsAssets.paged('s1', -3, 0);
    const second = await cmsAssets.paged('s1', 1, 1);

    expect(urlsOf(first)).toEqual(['u3']);
    expect(urlsOf(second)).toEqual(['u2']);
    expect(second.totalCount).toBe(3);
  });
});

describe('cmsAssets.updateAlt and remove', () => {
  it('trims the alt text and removes an image', async () => {
    const asset = await CmsAssetModel.create({ siteId: 's1', url: 'u1', name: 'a.png' });
    const id = asset._id.toHexString();

    await expect(cmsAssets.updateAlt(id, '  A team photo  ')).resolves.toMatchObject({
      alt: 'A team photo',
    });
    await expect(cmsAssets.remove(id)).resolves.toBe(true);
  });

  it('says when the image does not exist', async () => {
    await expect(cmsAssets.updateAlt(missingId(), 'x')).rejects.toThrow('Image not found');
    await expect(cmsAssets.remove(missingId())).rejects.toThrow('Image not found');
  });
});
