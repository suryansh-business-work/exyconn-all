import { getJson } from '../social.http';
import {
  SYNC_LIMIT,
  count,
  list,
  str,
  type NetworkClient,
  type NetworkPost,
} from './network.types';

const API = 'https://www.googleapis.com/youtube/v3';

/**
 * A YouTube channel: its latest uploads with views, likes and comments. Nothing is published
 * here — a YouTube post is a video upload, not something a text composer makes.
 */
export const youtube: NetworkClient = {
  fetchPosts: async (account) => {
    const token = account.accessToken;
    const channel = await getJson(
      'YouTube',
      `${API}/channels?part=contentDetails&id=${encodeURIComponent(account.externalId)}`,
      token,
    );
    const details = list(channel.items)[0]?.contentDetails as
      { relatedPlaylists?: { uploads?: string } } | undefined;
    const uploads = details?.relatedPlaylists?.uploads;
    if (!uploads) return [];
    const items = await getJson(
      'YouTube',
      `${API}/playlistItems?part=contentDetails&maxResults=${SYNC_LIMIT}&playlistId=${uploads}`,
      token,
    );
    const ids = list(items.items)
      .map((item) => str((item.contentDetails as { videoId?: string } | undefined)?.videoId))
      .filter(Boolean);
    if (ids.length === 0) return [];
    const videos = await getJson(
      'YouTube',
      `${API}/videos?part=snippet,statistics&id=${ids.join(',')}`,
      token,
    );
    return list(videos.items).map((video): NetworkPost => {
      const snippet = (video.snippet ?? {}) as Record<string, unknown>;
      const stats = (video.statistics ?? {}) as Record<string, unknown>;
      const thumbnails = snippet.thumbnails as { medium?: { url?: string } } | undefined;
      return {
        externalId: str(video.id),
        text: str(snippet.title),
        mediaUrl: thumbnails?.medium?.url ?? '',
        permalink: `https://www.youtube.com/watch?v=${str(video.id)}`,
        publishedAt: new Date(str(snippet.publishedAt)),
        metrics: {
          likes: count(stats.likeCount),
          comments: count(stats.commentCount),
          shares: 0,
          views: count(stats.viewCount),
        },
      };
    });
  },
  publish: null,
};
