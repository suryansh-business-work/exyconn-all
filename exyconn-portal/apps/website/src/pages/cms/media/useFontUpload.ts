import { useUploadCmsAssetMutation } from '@exyconn/shell/graphql/generated';
import { fileToDataUrl } from '@exyconn/shell/utils/file';
import type { FontFile } from '../design-system/font-sources';

/** The cap on one font file. */
export const MAX_FONT_BYTES = 5 * 1024 * 1024;
export const FONT_ACCEPT = '.woff2,.woff,.ttf,.otf';

/** Each font extension: the MIME the server expects and the @font-face format it is. */
const FONT_TYPES: Record<string, { mime: string; format: FontFile['format'] }> = {
  woff2: { mime: 'font/woff2', format: 'woff2' },
  woff: { mime: 'font/woff', format: 'woff' },
  ttf: { mime: 'font/ttf', format: 'truetype' },
  otf: { mime: 'font/otf', format: 'opentype' },
};

const extensionOf = (name: string) => name.split('.').at(-1)?.toLowerCase() ?? '';

/** The @font-face format of a file, from its extension; null for anything else. */
export const fontFormatOf = (name: string): FontFile['format'] | null =>
  FONT_TYPES[extensionOf(name)]?.format ?? null;

/**
 * Uploads a font file into the site's media library and resolves to its URL. Browsers report
 * no (or a made-up) type for fonts, so the data URL is re-labelled with the real font MIME.
 */
export function useFontUpload(siteId: string): (file: File) => Promise<string> {
  const [upload] = useUploadCmsAssetMutation();

  return async (file: File) => {
    const type = FONT_TYPES[extensionOf(file.name)];
    if (!type) {
      throw new Error(`${file.name} is not a WOFF2, WOFF, TTF or OTF font`);
    }
    if (file.size > MAX_FONT_BYTES) {
      throw new Error(`${file.name} is larger than 5 MB`);
    }
    const dataUrl = await fileToDataUrl(file);
    const payload = dataUrl.slice(dataUrl.indexOf(',') + 1);
    const { data } = await upload({
      variables: {
        input: { siteId, file: `data:${type.mime};base64,${payload}`, fileName: file.name },
      },
    });
    if (!data?.uploadCmsAsset) {
      throw new Error('The upload returned no file');
    }
    return data.uploadCmsAsset.url;
  };
}
