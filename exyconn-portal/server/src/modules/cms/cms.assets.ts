import { notFound } from '../../utils/errors';
import { imageUploader } from '../../utils/imagekit';
import { withIds } from '../../utils/serialize';
import { escapeRegex } from '../../utils/tableQuery';
import { CmsAssetModel, CmsSiteModel } from './models';

const MAX_PAGE_SIZE = 200;
const DATA_URL = /^data:([\w.+-]+\/[\w.+-]+);base64,(.*)$/s;
/** A font file by its name, for browsers that report no MIME type for fonts. */
const FONT_FILE = /\.(?:woff2?|ttf|otf)$/i;

export interface CmsAssetUpload {
  siteId: string;
  /** A data: URL; checked by the shared upload policy (images and PDFs, or WOFF2/WOFF/TTF/OTF fonts). */
  file: string;
  fileName: string;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
}

/** A site's media library: images (and the design system's web fonts) uploaded once and reused. */
export const cmsAssets = {
  async paged(siteId: string, page: number, pageSize: number, search?: string | null) {
    const filter: Record<string, unknown> = { siteId };
    const text = (search ?? '').trim().slice(0, 100);
    if (text) {
      const pattern = { $regex: escapeRegex(text), $options: 'i' };
      filter.$or = [{ name: pattern }, { alt: pattern }];
    }
    const size = Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE);
    const [rows, totalCount] = await Promise.all([
      CmsAssetModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(Math.max(page, 0) * size)
        .limit(size)
        .lean(),
      CmsAssetModel.countDocuments(filter),
    ]);
    return { rows: withIds(rows as Array<{ _id: unknown }>), totalCount };
  },

  async upload(input: CmsAssetUpload) {
    const site = await CmsSiteModel.findById(input.siteId).select('slug').lean();
    if (!site) notFound('Website');
    const match = DATA_URL.exec(input.file);
    const isFont = (match?.[1] ?? '').startsWith('font/') || FONT_FILE.test(input.fileName);
    const url = isFont
      ? await imageUploader.uploadFont(input.file, input.fileName, `cms-${site.slug}-fonts`)
      : await imageUploader.uploadImage(input.file, input.fileName, `cms-${site.slug}`);
    const payload = match?.[2] ?? '';
    const asset = await CmsAssetModel.create({
      siteId: input.siteId,
      url,
      name: input.fileName.trim().slice(0, 200) || 'image',
      mime: match?.[1] ?? '',
      size: Math.floor((payload.length * 3) / 4),
      width: input.width ?? 0,
      height: input.height ?? 0,
      alt: (input.alt ?? '').trim(),
    });
    return asset.toObject();
  },

  async updateAlt(id: string, alt: string) {
    const asset = await CmsAssetModel.findByIdAndUpdate(
      id,
      { alt: alt.trim().slice(0, 300) },
      { new: true },
    ).lean();
    if (!asset) notFound('Image');
    return asset;
  },

  async remove(id: string) {
    const result = await CmsAssetModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) notFound('Image');
    return true;
  },
};
