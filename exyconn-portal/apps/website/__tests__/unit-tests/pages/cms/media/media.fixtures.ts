import type { MediaAsset } from '../../../../../src/pages/cms/media/useMediaAssets';

/** A file of a site's media library as the assets query returns it. */
export function mediaAsset(overrides: Partial<MediaAsset> = {}): MediaAsset {
  return {
    id: 'asset-1',
    siteId: 'site-1',
    url: 'https://ik.imagekit.io/exyconn/logo.png',
    name: 'logo.png',
    mime: 'image/png',
    size: 1536,
    width: 640,
    height: 480,
    alt: 'Exyconn logo',
    createdAt: '2026-02-01T00:00:00.000Z',
    ...overrides,
  };
}
