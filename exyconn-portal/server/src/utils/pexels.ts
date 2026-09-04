import { PexelsConfigModel, type PexelsConfigDocument } from '../modules/tech/pexels-config.model';

const PEXELS_API_URL = 'https://api.pexels.com';

/** How many results one page of the upload dialog's stock tabs holds. */
const PER_PAGE = 24;

/** One stock result, flattened to what the upload dialog actually renders. */
export interface PexelsMedia {
  id: string;
  /** Still frame shown in the grid — the photo thumbnail, or the video's poster. */
  previewUrl: string;
  /** The URL stored when the item is picked: the photo file, or the video file. */
  url: string;
  alt: string;
  /** Photographer / videographer, shown under the grid as Pexels requires. */
  credit: string;
  /** Seconds. Zero for photos. */
  duration: number;
}

/**
 * The subset of Pexels' search filters the upload dialog exposes. Colour is photo-only and
 * duration is video-only; the dialog sends only the ones its tab supports.
 */
export interface PexelsSearchFilters {
  /** `landscape` | `portrait` | `square`. */
  orientation?: string | null;
  /** `large` | `medium` | `small`. */
  size?: string | null;
  /** A Pexels colour name or a `#rrggbb` value. Photos only. */
  color?: string | null;
  /** Seconds. Videos only. */
  minDuration?: number | null;
  maxDuration?: number | null;
}

/** Pexels serves every asset from its own CDN; nothing else may be imported by URL. */
export function isPexelsMediaUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('.pexels.com');
  } catch {
    return false;
  }
}

interface PhotoPayload {
  id: number;
  alt: string;
  photographer: string;
  src: { medium: string; large2x: string };
}

interface VideoFilePayload {
  quality: string;
  file_type: string;
  link: string;
}

interface VideoPayload {
  id: number;
  image: string;
  duration: number;
  user: { name: string };
  video_files: VideoFilePayload[];
}

/** The HD mp4 rendition if Pexels has one, else the first file it offers. */
function bestVideoFile(files: VideoFilePayload[]): VideoFilePayload | undefined {
  return files.find((file) => file.quality === 'hd' && file.file_type === 'video/mp4') ?? files[0];
}

/**
 * Pexels stock search (singleton). The API key comes from the active Pexels config in
 * the Tech module, so it is rotated in the portal rather than in a deploy. Results are
 * normalised to `PexelsMedia` so photos and videos render through the same grid.
 */
class PexelsClient {
  private async request<T>(apiKey: string, path: string): Promise<T> {
    const response = await fetch(`${PEXELS_API_URL}${path}`, {
      headers: { Authorization: apiKey },
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Pexels ${path} failed (${response.status}): ${detail.slice(0, 200)}`);
    }
    return (await response.json()) as T;
  }

  /** Loads the single active Pexels config, or throws. */
  private async getActiveKey(): Promise<string> {
    const config = await PexelsConfigModel.findOne({ isActive: true }).lean();
    if (!config) {
      throw new Error('No active Pexels configuration. Add one in Tech > Environment Variables.');
    }
    return config.apiKey;
  }

  private searchPath(
    kind: 'v1/search' | 'videos/search',
    query: string,
    page: number,
    filters: PexelsSearchFilters,
  ): string {
    const params = new URLSearchParams({
      query,
      per_page: String(PER_PAGE),
      page: String(page),
    });
    const optional: ReadonlyArray<readonly [string, string | number | null | undefined]> = [
      ['orientation', filters.orientation],
      ['size', filters.size],
      ['color', filters.color],
      ['min_duration', filters.minDuration],
      ['max_duration', filters.maxDuration],
    ];
    for (const [name, value] of optional) {
      if (value !== null && value !== undefined && value !== '') {
        params.set(name, String(value));
      }
    }
    return `/${kind}?${params.toString()}`;
  }

  async searchPhotos(
    query: string,
    page: number,
    filters: PexelsSearchFilters,
  ): Promise<PexelsMedia[]> {
    const apiKey = await this.getActiveKey();
    const data = await this.request<{ photos: PhotoPayload[] }>(
      apiKey,
      this.searchPath('v1/search', query, page, filters),
    );
    return data.photos.map((photo) => ({
      id: String(photo.id),
      previewUrl: photo.src.medium,
      url: photo.src.large2x,
      alt: photo.alt ?? '',
      credit: photo.photographer,
      duration: 0,
    }));
  }

  async searchVideos(
    query: string,
    page: number,
    filters: PexelsSearchFilters,
  ): Promise<PexelsMedia[]> {
    const apiKey = await this.getActiveKey();
    const data = await this.request<{ videos: VideoPayload[] }>(
      apiKey,
      this.searchPath('videos/search', query, page, filters),
    );
    return data.videos.flatMap((video) => {
      const file = bestVideoFile(video.video_files);
      if (!file) return [];
      return [
        {
          id: String(video.id),
          previewUrl: video.image,
          url: file.link,
          alt: `Stock video by ${video.user.name}`,
          credit: video.user.name,
          duration: video.duration,
        },
      ];
    });
  }

  /** Runs a cheap search through a specific config so a key can be validated before use. */
  async verify(config: PexelsConfigDocument): Promise<void> {
    await this.request(config.apiKey, '/v1/search?query=office&per_page=1&page=1');
  }
}

export const pexelsClient = new PexelsClient();
