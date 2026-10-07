import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  FONT_ACCEPT,
  MAX_FONT_BYTES,
  fontFormatOf,
  useFontUpload,
} from '../../../../../src/pages/cms/media';

const gql = vi.hoisted(() => ({ upload: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useUploadCmsAssetMutation: () => [gql.upload],
}));

const fontFile = (name: string, size?: number) => {
  const made = new File(['abc'], name, { type: 'application/octet-stream' });
  if (size !== undefined) Object.defineProperty(made, 'size', { value: size });
  return made;
};

const uploadWith = () => renderHook(() => useFontUpload('site-1')).result.current;

describe('fontFormatOf', () => {
  it('maps each font extension to its @font-face format, ignoring case', () => {
    expect(fontFormatOf('Brand.WOFF2')).toBe('woff2');
    expect(fontFormatOf('Brand.woff')).toBe('woff');
    expect(fontFormatOf('Brand.ttf')).toBe('truetype');
    expect(fontFormatOf('Brand.otf')).toBe('opentype');
  });

  it('knows no format for anything else', () => {
    expect(fontFormatOf('logo.png')).toBeNull();
    expect(fontFormatOf('README')).toBeNull();
  });
});

describe('useFontUpload', () => {
  beforeEach(() => {
    gql.upload.mockReset();
    gql.upload.mockResolvedValue({ data: { uploadCmsAsset: { url: 'https://cdn/brand.ttf' } } });
  });

  it('takes the four font types, up to 5 MB each', () => {
    expect(FONT_ACCEPT).toBe('.woff2,.woff,.ttf,.otf');
    expect(MAX_FONT_BYTES).toBe(5 * 1024 * 1024);
  });

  it('uploads the font labelled with its real MIME and resolves to its URL', async () => {
    await expect(uploadWith()(fontFile('Brand.ttf'))).resolves.toBe('https://cdn/brand.ttf');

    expect(gql.upload).toHaveBeenCalledWith({
      variables: {
        input: { siteId: 'site-1', file: 'data:font/ttf;base64,YWJj', fileName: 'Brand.ttf' },
      },
    });
  });

  it('refuses a file that is not a font', async () => {
    await expect(uploadWith()(fontFile('logo.png'))).rejects.toThrow(
      'logo.png is not a WOFF2, WOFF, TTF or OTF font',
    );
    expect(gql.upload).not.toHaveBeenCalled();
  });

  it('refuses a font over the cap', async () => {
    await expect(uploadWith()(fontFile('Brand.woff2', MAX_FONT_BYTES + 1))).rejects.toThrow(
      'Brand.woff2 is larger than 5 MB',
    );
  });

  it('rejects when the server returns no file', async () => {
    gql.upload.mockResolvedValue({ data: { uploadCmsAsset: null } });
    await expect(uploadWith()(fontFile('Brand.otf'))).rejects.toThrow(
      'The upload returned no file',
    );
  });
});
